import { supabase } from './supabase';

export async function checkAdminRole(userId: string) {
  try {
    // First check if the ID exists in profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      console.error('Error checking profile:', profileError);
      return null;
    }

    // If profile doesn't exist, return null
    if (!profile) {
      console.log('Profile not found');
      return null;
    }

    // Now check admin role
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select('role')
      .eq('id', userId)
      .maybeSingle(); // Using maybeSingle() instead of single()

    if (adminError) {
      console.error('Error checking admin role:', adminError);
      return null;
    }

    return adminData?.role || null;
  } catch (err) {
    console.error('Error in checkAdminRole:', err);
    return null;
  }
}