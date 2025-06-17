import { NextResponse } from 'next/server'
import { createSupabaseClient } from '@/utils/supabase/server'

export async function GET() {
  try {
    const supabase = await createSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user)
      return NextResponse.json(
        { data: null, error: 'User not authenticated' },
        { status: 401 },
      )

    const { data: projects, error: projectError } = await supabase
      .from('project_members')
      .select(
        `
      role,
      projects:project_id(
      *
      )
    `,
      )
      .eq('user_id', user.id)
      .neq('role', 'VIEWER')

    if (projectError) {
      console.error('Error fetching projects:', projectError)
      return NextResponse.json(
        { data: null, error: projectError.message ?? projectError },
        { status: 500 },
      )
    }
    const projectsList = projects.map((project) => project.projects)
    return NextResponse.json(
      { data: projectsList, error: null },
      { status: 200 },
    )
  } catch (error) {
    console.error('Error fetching projects:', error)
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
