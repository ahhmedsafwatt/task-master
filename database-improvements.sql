-- =============================================================
-- DATABASE IMPROVEMENTS FOR TASK MANAGER
-- Run these improvements after your initial schema setup
-- =============================================================

-- *************************************************************
-- ENUM IMPROVEMENTS
-- *************************************************************

-- Fix the roles enum to include OWNER if you want to use it
-- Otherwise, use ADMIN as the highest role
-- Uncommend the next line if you want to add OWNER role
-- ALTER TYPE roles ADD VALUE 'OWNER';

-- *************************************************************
-- PERFORMANCE INDEXES
-- *************************************************************

-- Composite indexes for better query performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_status_priority 
ON public.tasks (status, priority);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_project_status 
ON public.tasks (project_id, status) WHERE project_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_creator_status 
ON public.tasks (creator_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_due_date_status 
ON public.tasks (due_date, status) WHERE due_date IS NOT NULL AND status != 'COMPLETED';

-- Partial indexes for active tasks (non-completed)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_active 
ON public.tasks (created_at DESC) WHERE status IN ('BACKLOG', 'IN_PROGRESS');

-- Index for project members by role for faster permission checks
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_project_members_project_role 
ON public.project_members (project_id, role);

-- Index for efficient notification queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_recipient_status 
ON public.notifications (recipient_id, status, created_at DESC);

-- Index for tasks with assignees (for efficient joins)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_task_assignees_task 
ON public.task_assignees (task_id);

-- *************************************************************
-- IMPROVED CONSTRAINTS
-- *************************************************************

-- Add check constraints for data integrity
ALTER TABLE public.tasks ADD CONSTRAINT check_due_date_future 
CHECK (due_date IS NULL OR due_date > created_at);

ALTER TABLE public.tasks ADD CONSTRAINT check_end_date_order 
CHECK (end_date IS NULL OR due_date IS NULL OR end_date >= due_date);

ALTER TABLE public.projects ADD CONSTRAINT check_project_name_length 
CHECK (length(trim(name)) >= 1 AND length(name) <= 100);

ALTER TABLE public.tasks ADD CONSTRAINT check_task_title_length 
CHECK (length(trim(title)) >= 1 AND length(title) <= 200);

-- *************************************************************
-- ENHANCED HELPER FUNCTIONS
-- *************************************************************

-- Function to get user's role in a project (returns highest role if multiple)
CREATE OR REPLACE FUNCTION get_user_project_role(_project_id UUID, _user_id UUID) 
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.project_members
  WHERE project_id = _project_id AND user_id = _user_id;
  
  RETURN COALESCE(user_role, 'NONE');
END;
$$;

-- Function to check if a user can manage tasks in a project
CREATE OR REPLACE FUNCTION can_manage_project_tasks(_project_id UUID, _user_id UUID) 
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  user_role TEXT;
BEGIN
  user_role := get_user_project_role(_project_id, _user_id);
  RETURN user_role IN ('ADMIN', 'MEMBER');
END;
$$;

-- Function to get project statistics
CREATE OR REPLACE FUNCTION get_project_stats(_project_id UUID)
RETURNS TABLE(
  total_tasks BIGINT,
  completed_tasks BIGINT,
  in_progress_tasks BIGINT,
  backlog_tasks BIGINT,
  overdue_tasks BIGINT
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_tasks,
    COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_tasks,
    COUNT(*) FILTER (WHERE status = 'IN_PROGRESS') as in_progress_tasks,
    COUNT(*) FILTER (WHERE status = 'BACKLOG') as backlog_tasks,
    COUNT(*) FILTER (WHERE due_date < NOW() AND status != 'COMPLETED') as overdue_tasks
  FROM public.tasks
  WHERE project_id = _project_id;
END;
$$;

-- *************************************************************
-- STORAGE BUCKET CONSISTENCY FIX
-- *************************************************************

-- Fix storage bucket naming inconsistency
-- Note: This requires manual intervention in Supabase dashboard
-- The SQL schema refers to 'project_covers' but storage uses 'project-covers'
-- Choose one naming convention and stick to it

-- *************************************************************
-- IMPROVED RLS POLICIES
-- *************************************************************

-- More granular task visibility policy
DROP POLICY IF EXISTS "creator and project members can view public tasks" ON public.tasks;

CREATE POLICY "users can view accessible tasks" ON public.tasks 
FOR SELECT TO authenticated 
USING (
  -- User is the creator
  creator_id = auth.uid()
  OR 
  -- Task is public (not private)
  (is_private = false)
  OR
  -- User is a member of the project and can view private tasks
  (project_id IS NOT NULL AND 
   EXISTS (
     SELECT 1 FROM public.project_members pm
     WHERE pm.project_id = tasks.project_id 
     AND pm.user_id = auth.uid()
   ))
);

-- More specific project member policies
DROP POLICY IF EXISTS "Creators and admins can add members" ON public.project_members;

CREATE POLICY "admins can manage members" ON public.project_members 
FOR INSERT TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = project_members.project_id
    AND pm.user_id = auth.uid()
    AND pm.role = 'ADMIN'
  )
  OR
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_members.project_id
    AND p.creator_id = auth.uid()
  )
);

-- *************************************************************
-- USEFUL VIEWS FOR COMMON QUERIES
-- *************************************************************

-- View for project dashboards with stats
CREATE OR REPLACE VIEW project_dashboard AS
SELECT 
  p.*,
  pm.role as current_user_role,
  (SELECT COUNT(*) FROM public.tasks t WHERE t.project_id = p.id) as total_tasks,
  (SELECT COUNT(*) FROM public.tasks t WHERE t.project_id = p.id AND t.status = 'COMPLETED') as completed_tasks,
  (SELECT COUNT(*) FROM public.tasks t WHERE t.project_id = p.id AND t.status = 'IN_PROGRESS') as in_progress_tasks,
  (SELECT COUNT(*) FROM public.project_members pm2 WHERE pm2.project_id = p.id) as member_count
FROM public.projects p
LEFT JOIN public.project_members pm ON p.id = pm.project_id AND pm.user_id = auth.uid()
WHERE pm.user_id IS NOT NULL OR p.creator_id = auth.uid();

-- View for task assignments with user details
CREATE OR REPLACE VIEW task_assignments AS
SELECT 
  ta.task_id,
  ta.user_id,
  ta.assigned_at,
  p.username,
  p.email,
  p.avatar_url,
  t.title as task_title,
  t.status as task_status,
  t.priority as task_priority
FROM public.task_assignees ta
JOIN public.profiles p ON ta.user_id = p.id
JOIN public.tasks t ON ta.task_id = t.id;

-- *************************************************************
-- AUDIT TRAIL (OPTIONAL)
-- *************************************************************

-- Table for tracking important changes
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for audit queries
CREATE INDEX IF NOT EXISTS idx_audit_log_user_action 
ON public.audit_log (user_id, action, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_table_record 
ON public.audit_log (table_name, record_id, created_at DESC);

-- Enable RLS on audit log
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own audit logs
CREATE POLICY "users can view own audit logs" ON public.audit_log 
FOR SELECT TO authenticated 
USING (user_id = auth.uid());

-- *************************************************************
-- TRIGGER FUNCTION FOR AUDIT TRAIL
-- *************************************************************

CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (user_id, action, table_name, record_id, old_values)
    VALUES (auth.uid(), 'DELETE', TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_log (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (auth.uid(), 'UPDATE', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (user_id, action, table_name, record_id, new_values)
    VALUES (auth.uid(), 'INSERT', TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Add audit triggers to important tables (uncomment to enable)
-- CREATE TRIGGER audit_projects_trigger 
--   AFTER INSERT OR UPDATE OR DELETE ON public.projects
--   FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- CREATE TRIGGER audit_tasks_trigger 
--   AFTER INSERT OR UPDATE OR DELETE ON public.tasks
--   FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- *************************************************************
-- PERFORMANCE MONITORING VIEWS
-- *************************************************************

-- View to monitor slow queries (for development)
CREATE OR REPLACE VIEW slow_query_monitor AS
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation,
  most_common_vals,
  most_common_freqs
FROM pg_stats 
WHERE schemaname = 'public'
AND tablename IN ('tasks', 'projects', 'project_members', 'task_assignees')
ORDER BY tablename, attname;

-- *************************************************************
-- CLEANUP AND MAINTENANCE FUNCTIONS
-- *************************************************************

-- Function to cleanup old notifications (more configurable)
CREATE OR REPLACE FUNCTION cleanup_old_notifications(days_old INTEGER DEFAULT 30)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.notifications 
  WHERE created_at < NOW() - (days_old || ' days')::INTERVAL
  AND status = 'READ';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Function to cleanup orphaned storage files (would need to be called from application)
CREATE OR REPLACE FUNCTION get_orphaned_storage_refs()
RETURNS TABLE(bucket_name TEXT, file_path TEXT, table_name TEXT) 
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  -- This is a helper function to identify potentially orphaned files
  -- Implementation would depend on your specific storage structure
  RETURN QUERY
  SELECT 
    'project-covers'::TEXT as bucket_name,
    p.project_cover as file_path,
    'projects'::TEXT as table_name
  FROM public.projects p
  WHERE p.project_cover IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.projects p2 
    WHERE p2.id = p.id AND p2.project_cover = p.project_cover
  );
END;
$$;

-- =============================================================
-- END OF IMPROVEMENTS
-- =============================================================

-- Instructions for applying these improvements:
-- 1. Run this script after your main database setup
-- 2. Monitor performance after adding indexes
-- 3. Enable audit triggers only if needed (they add overhead)
-- 4. Adjust the cleanup functions' schedules in pg_cron if needed
-- 5. Review and customize the views based on your specific needs