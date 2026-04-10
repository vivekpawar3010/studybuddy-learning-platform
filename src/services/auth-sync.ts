import { supabase } from './supabase';

/**
 * Syncs a Firebase user to the Supabase profiles table.
 * If the profile doesn't exist, it creates one.
 * Returns the profile including the persisted role (if already set).
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
      return existingProfile; // role is included in the returned object
    }

    // 2. Create profile if it doesn't exist
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
          linkedin: '',
          role: null, // role not set yet — will be set on first-time role selection
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

/**
 * Permanently sets the role for a user. Once set, it cannot be changed.
 * Returns true on success, throws on failure.
 */
export const setUserRoleInDB = async (
  firebaseUid: string,
  role: 'student' | 'teacher'
): Promise<void> => {
  // First check if role is already set — enforce immutability
  const { data, error: fetchErr } = await supabase
    .from('profiles')
    .select('role')
    .eq('firebase_uid', firebaseUid)
    .single();

  if (fetchErr) throw fetchErr;

  if (data?.role) {
    throw new Error(`Role already set to "${data.role}". It cannot be changed.`);
  }

  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('firebase_uid', firebaseUid);

  if (error) throw error;
};
