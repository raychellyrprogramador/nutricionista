import { supabase } from '../lib/supabase';

async function createSuperAdmin() {
  try {
    // Create the auth user
    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
      email: 'admin@nutriapp.com',
      password: 'Admin@2025',
      options: {
        data: {
          full_name: 'Administrador',
          is_admin: true
        }
      }
    });

    if (signUpError) throw signUpError;
    if (!user) throw new Error('Failed to create user');

    // Create the profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        full_name: 'Administrador',
        email: 'admin@nutriapp.com',
        birth_date: '1990-01-01',
        phone: '+5511999999999',
        city: 'São Paulo',
        state: 'SP',
        is_active: true
      });

    if (profileError) throw profileError;

    // Grant super admin role
    const { error: adminError } = await supabase
      .from('admin_users')
      .insert({
        id: user.id,
        role: 'super_admin',
        permissions: {
          users: true,
          appointments: true,
          meal_plans: true,
          settings: true,
          system: true
        }
      });

    if (adminError) throw adminError;

    console.log('Super admin created successfully!');
    console.log('Email: admin@nutriapp.com');
    console.log('Password: Admin@2025');

  } catch (err) {
    console.error('Error creating super admin:', err);
  }
}

createSuperAdmin();