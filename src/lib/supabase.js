import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = url && key ? createClient(url, key) : null;

export async function saveSimulation(payload) {
  if (!supabase) return { saved: false, mode: 'local' };
  const { error } = await supabase.from('community_simulations').insert({
    title: payload.title || 'Simulação da comunidade',
    scenario: payload.scenario || 'custom',
    payload,
  });
  if (error) throw error;
  return { saved: true, mode: 'supabase' };
}
