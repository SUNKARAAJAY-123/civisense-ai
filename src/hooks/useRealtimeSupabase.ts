import { useEffect } from 'react';
import { getSupabaseClient } from '../supabase/client';

/**
 * A custom hook to listen to Supabase Realtime events for any table.
 * It automatically subscribes to INSERT, UPDATE, or DELETE events,
 * triggering the specified callback, and unsubscribes on unmount.
 */
export function useRealtimeSupabase(
  table: 'issues' | 'comments' | 'notifications' | 'profiles',
  onEvent: (payload: any) => void
) {
  useEffect(() => {
    let channel: any = null;
    try {
      const supabase = getSupabaseClient();
      
      channel = supabase
        .channel(`realtime-${table}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: table },
          (payload) => {
            onEvent(payload);
          }
        )
        .subscribe();
    } catch (e) {
      // Fail silently if Supabase is not configured (prevent client crash)
      console.warn(`Supabase Realtime subscription failed for table: ${table}. Realtime updates will poll or fallback.`);
    }

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [table, onEvent]);
}
