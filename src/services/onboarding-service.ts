import { supabase } from './supabase';

/**
 * Fetches the user's profile to check onboarding status.
 * Returns true if the user has NOT yet completed onboarding (i.e. should see wizard).
 */
export const shouldShowOnboarding = async (firebaseUid: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('onboarding_completed, created_at')
      .eq('firebase_uid', firebaseUid)
      .single();

    if (error || !data) return false;
    return !data.onboarding_completed;
  } catch {
    return false;
  }
};

/**
 * Marks the user's onboarding as complete in the database.
 */
export const markOnboardingComplete = async (firebaseUid: string): Promise<void> => {
  try {
    await supabase
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('firebase_uid', firebaseUid);
  } catch (error) {
    console.error('Failed to mark onboarding complete:', error);
  }
};

/**
 * Returns true if the user's account is less than 5 days old.
 * Used to determine whether to show contextual hint tooltips.
 */
export const isNewUser = async (firebaseUid: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('created_at')
      .eq('firebase_uid', firebaseUid)
      .single();

    if (error || !data) return false;

    const createdAt = new Date(data.created_at);
    const now = new Date();
    const diffDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 5;
  } catch {
    return false;
  }
};
