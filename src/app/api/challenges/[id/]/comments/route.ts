import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const parentId = searchParams.get('parent_id');

    let query = supabase
      .from('comments')
      .select(`
        *,
        user:user_id(full_name, email)
      `)
      .eq('challenge_id', id)
      .order('created_at', { ascending: false });

    if (parentId) {
      query = query.eq('parent_id', parentId);
    } else {
      query = query.is('parent_id', null);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ comments: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { content, parent_id, is_hint, hint_cost_points, code_language, user_id } = body;

    if (!content || !user_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('comments')
      .insert({
        challenge_id: id,
        user_id,
        parent_id,
        content,
        is_hint: is_hint || false,
        hint_cost_points: hint_cost_points || 0,
        code_language,
      })
      .select('*, user:user_id(full_name, email)')
      .single();

    if (error) throw error;

    return NextResponse.json({ comment: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
