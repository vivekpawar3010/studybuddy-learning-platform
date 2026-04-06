import { supabase } from './supabase';

/**
 * Syncs a Firebase user to the Supabase profiles table.
 * If the profile doesn't exist, it creates one.
 */
export const syncUserToSupabase = async (firebaseUser: any) => {
  if (!firebaseUser) return null;

  const { uid, email, displayName, photoURL } = firebaseUser;

  try {
    // 1. Check if profile exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('firebase_uid', uid)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    if (existingProfile) {
      return existingProfile;
    }

    // 2. Create profile if it doesn't exist (empty fields to force setup)
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert([
        {
          firebase_uid: uid,
          email: email || '',
          full_name: displayName || '',
          avatar_url: photoURL || null,
          username: null,
          bio: '',
          location: '',
          college: '',
          github: '',
          linkedin: ''
        }
      ])
      .select()
      .single();

    if (insertError) throw insertError;

    return { ...newProfile, isNewUser: true };
  } catch (error) {
    console.error('Error syncing user to Supabase:', error);
    return null;
  }
};
