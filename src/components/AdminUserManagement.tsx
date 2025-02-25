import React, { useState, useEffect } from 'react';
import { 
  Users, Search, UserPlus, Trash2, Edit2, 
  Shield, CheckCircle, XCircle, Key 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { validateUsername, validatePassword } from '../lib/adminAuth';

interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
}

export function AdminUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          *,
          admin_users (
            role,
            permissions
          )
        `)
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      if (profiles) {
        setUsers(profiles.map(profile => ({
          ...profile,
          role: profile.admin_users?.[0]?.role || 'user'
        })));
      }
    } catch (err: any) {
      console.error('Error loading users:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUserStatusChange = async (userId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: isActive })
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, is_active: isActive } : user
      ));

      // Log the action
      await supabase
        .from('audit_logs')
        .insert({
          action: isActive ? 'user_activated' : 'user_deactivated',
          details: `User ${userId} ${isActive ? 'activated' : 'deactivated'}`,
          performed_by: (await supabase.auth.getUser()).data.user?.id
        });

      setSuccess(`User ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!validatePassword(newPassword)) {
      setError('Password does not meet security requirements');
      return;
    }

    try {
      const { error } = await supabase.auth.admin.updateUserById(
        userId,
        { password: newPassword }
      );

      if (error) throw error;

      // Log the action
      await supabase
        .from('audit_logs')
        .insert({
          action: 'password_reset',
          details: `Password reset for user ${userId}`,
          performed_by: (await supabase.auth.getUser()).data.user?.id
        });

      setSuccess('Password reset successfully');
      setShowResetPassword(false);
      setNewPassword('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('admin_users')
        .upsert({
          id: userId,
          role: newRole,
          permissions: {
            users: newRole === 'admin',
            appointments: true,
            meal_plans: true,
            settings: newRole === 'admin'
          }
        });

      if (error) throw error;

      // Log the action
      await supabase
        .from('audit_logs')
        .insert({
          action: 'role_change',
          details: `Role changed to ${newRole} for user ${userId}`,
          performed_by: (await supabase.auth.getUser()).data.user?.id
        });

      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      setSuccess('User role updated successfully');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">User Management</h2>
        <button
          onClick={() => {/* Implement new user creation */}}
          className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
        >
          <UserPlus className="w-5 h-5" />
          New User
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-500 font-medium">
                              {user.full_name[0]}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.full_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="text-sm text-gray-900 border-gray-300 rounded-md"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.last_login
                        ? new Date(user.last_login).toLocaleString()
                        : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowResetPassword(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="Reset password"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleUserStatusChange(user.id, !user.is_active)}
                          className={user.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}
                          title={user.is_active ? 'Deactivate user' : 'Activate user'}
                        >
                          {user.is_active ? (
                            <XCircle className="w-4 h-4" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reset Password Modal */}
      {showResetPassword && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Reset Password for {selectedUser.full_name}
            </h3>
            <div className="space-y-4">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <p className="text-sm text-gray-500">
                Password must be at least 12 characters long and include uppercase, lowercase, numbers, and special characters.
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => {
                    setShowResetPassword(false);
                    setNewPassword('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleResetPassword(selectedUser.id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Reset Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      {(error || success) && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${
          error ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
        }`}>
          {error || success}
        </div>
      )}
    </div>
  );
}