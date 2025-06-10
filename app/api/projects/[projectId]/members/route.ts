import { userProfile } from '@/lib/types/types'
import { createSupabaseClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params
    if (!projectId) {
      return NextResponse.json(
        { data: null, error: 'Project ID is required' },
        { status: 400 },
      )
    }
    const supabase = await createSupabaseClient()
    const { data: members, error: membersError } = await supabase
      .from('profiles')
      .select(
        `*, project_members!inner(
          role, user_id)`,
      )
      .eq('project_members.project_id', projectId)

    if (membersError) {
      console.error('Error fetching project members:', membersError)
      return NextResponse.json(
        { data: null, error: membersError.message ?? membersError },
        { status: 500 },
      )
    }

    return NextResponse.json(
      { data: members as userProfile[], error: null },
      { status: 200 },
    )
  } catch (error) {
    console.error('Error fetching project members:', error)
    return NextResponse.json(
      {
        data: null,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 },
    )
  }
}
