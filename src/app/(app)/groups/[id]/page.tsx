import GroupChatClient from './GroupChatClient';
import { supabase } from '@/lib/supabase';

// This function is required for Next.js static export (output: 'export')
// It pre-renders the group chat pages for all existing groups at build time.
// For mobile apps (Capacitor), this ensures the routes exist in the static build.
export async function generateStaticParams() {
  try {
    const { data: groups } = await supabase.from('groups').select('id');
    
    if (!groups || groups.length === 0) {
      return [{ id: 'general' }];
    }

    return groups.map((group) => ({
      id: group.id.toString(),
    }));
  } catch (error) {
    console.error('Error fetching groups for static params:', error);
    return [{ id: 'general' }];
  }
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return <GroupChatClient />;
}
