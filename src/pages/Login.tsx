import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { Input } from '../components/Input';
import { supabase } from '../lib/supabase';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const message = location.state?.message;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    console.log('Attempting login...');

    try {
      // Step 1: Authenticate user
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (!authData?.user) {
        throw new Error('No user data received');
      }

      console.log('User authenticated:', authData.user);

      // Step 2: Check user role in admin_users table
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('role')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (adminError) {
        console.error('Error checking admin role:', adminError);
      }

      console.log('Admin role check:', { adminData });

      // Step 3: Check if user is a nutritionist
      const { data: nutritionistData, error: nutritionistError } = await supabase
        .from('nutritionists')
        .select('id')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (nutritionistError) {
        console.error('Error checking nutritionist role:', nutritionistError);
      }

      console.log('Nutritionist check:', { nutritionistData });

      // Step 4: Determine user role and redirect accordingly
      let redirectPath = '/profile';  // default path

      if (adminData?.role) {
        // Handle admin roles
        switch (adminData.role) {
          case 'admin':
          case 'super_admin':
            redirectPath = '/admin/dashboard';
            break;
          case 'nutritionist':
            redirectPath = '/nutritionist/dashboard';
            break;
        }
      } else if (nutritionistData) {
        // User is a nutritionist but not in admin_users
        redirectPath = '/nutritionist/dashboard';
      } else {
        // Check if profile exists and is completed
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_profile_completed')
          .eq('id', authData.user.id)
          .single();

        if (profileError) {
          // Create new profile if it doesn't exist
          const { error: createProfileError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              full_name: authData.user.user_metadata.full_name || email.split('@')[0],
              email: email,
              birth_date: new Date().toISOString().split('T')[0],
              phone: '',
              is_active: true,
              created_at: new Date().toISOString(),
              is_profile_completed: false
            });

          if (createProfileError) {
            console.error('Error creating profile:', createProfileError);
            throw new Error('Failed to create user profile');
          }
          redirectPath = '/profile/customize';
        } else if (!profile.is_profile_completed) {
          redirectPath = '/profile/customize';
        }
      }

      console.log('Redirecting to:', redirectPath);
      navigate(redirectPath, { replace: true });

    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Login">
      <form onSubmit={handleLogin} className="space-y-6">
        {message && (
          <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-md text-sm">
            {message}
          </div>
        )}

        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full"
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full"
        />
        
        <div className="flex items-center justify-between">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <span className="ml-2 text-sm text-gray-600">Remember me</span>
          </label>
          <Link to="/reset-password" className="text-sm text-green-600 hover:text-green-500">
            Forgot password?
          </Link>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>

        <p className="text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="text-green-600 hover:text-green-500">
            Sign up
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}