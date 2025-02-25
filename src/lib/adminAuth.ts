import { supabase } from './supabase';

interface AdminCredentials {
  username: string;
  password: string;
}

export const validateUsername = (username: string): boolean => {
  const usernameRegex = /^[a-zA-Z0-9_]{8,}$/;
  return usernameRegex.test(username);
};

export const validatePassword = (password: string): boolean => {
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const hasMinLength = password.length >= 12;
  const hasNoCommonWords = !/(password|admin|123456|qwerty)/i.test(password);
  const hasNoSequential = !/(?:abc|123|xyz)/i.test(password);

  return (
    hasUpperCase &&
    hasLowerCase &&
    hasNumbers &&
    hasSpecialChar &&
    hasMinLength &&
    hasNoCommonWords &&
    hasNoSequential
  );
};

export const createAdminUser = async (credentials: AdminCredentials) => {
  try {
    if (!validateUsername(credentials.username)) {
      throw new Error('Invalid username format');
    }

    if (!validatePassword(credentials.password)) {
      throw new Error('Password does not meet security requirements');
    }

    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', credentials.username)
      .single();

    if (existingUser) {
      throw new Error('Username already exists');
    }

    const { data: { user }, error } = await supabase.auth.signUp({
      email: `${credentials.username}@admin.nutriapp.com`,
      password: credentials.password,
      options: {
        data: {
          is_admin: true,
          username: credentials.username
        }
      }
    });

    if (error) throw error;
    if (!user) throw new Error('Failed to create user');

    const { error: profileError } = await supabase
      .from('admin_users')
      .insert({
        id: user.id,
        role: 'admin',
        permissions: {
          users: true,
          appointments: true,
          meal_plans: true,
          settings: true
        }
      });

    if (profileError) throw profileError;

    return user;
  } catch (err: any) {
    console.error('Error creating admin user:', err);
    throw err;
  }
};

export const logAdminAction = async (
  action: string,
  details: string,
  userId: string
) => {
  try {
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        action,
        details,
        performed_by: userId
      });

    if (error) throw error;
  } catch (err) {
    console.error('Error logging admin action:', err);
  }
};