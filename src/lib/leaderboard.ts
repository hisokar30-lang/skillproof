import { supabase } from '@/lib/supabase/client';
import type { Score, Profile } from '@/types';

export async function getLeaderboard(): Promise<(Score & { profile: Profile })[]> {
  const { data } = await supabase
    .from('scores')
    .select('*, profile:profiles(*)')
    .order('points_earned', { ascending: false })
    .limit(100);

  return data || [];
}
