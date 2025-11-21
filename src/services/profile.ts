import { supabase } from './supabase';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  street: string | null;
  postal_code: string | null;
  city: string | null;
  province: string | null;
  is_formosa: boolean;
  role: 'customer' | 'seller_individual' | 'seller_official' | 'admin';
  created_at: string;
}

export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data as UserProfile;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Error:', error);
    return { success: false, error: error.message };
  }
}

export async function updatePassword(newPassword: string) {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.error('Error updating password:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Error:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteAccount(userId: string) {
  try {
    // Primero eliminar el perfil
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error('Error deleting profile:', profileError);
      return { success: false, error: profileError.message };
    }

    // Luego cerrar sesión
    await supabase.auth.signOut();

    return { success: true };
  } catch (error: any) {
    console.error('Error:', error);
    return { success: false, error: error.message };
  }
}