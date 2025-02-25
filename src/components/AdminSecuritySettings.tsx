import React, { useState } from 'react';
import { Shield, Key, Clock, Globe } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  allowedIPs: string[];
}

export function AdminSecuritySettings() {
  const [settings, setSettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    sessionTimeout: 30,
    allowedIPs: []
  });
  const [newIP, setNewIP] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleTwoFactorToggle = async () => {
    try {
      const { error } = await supabase
        .from('admin_settings')
        .update({ two_factor_enabled: !settings.twoFactorEnabled })
        .eq('id', 'global');

      if (error) throw error;

      setSettings(prev => ({
        ...prev,
        twoFactorEnabled: !prev.twoFactorEnabled
      }));
      setSuccess('Two-factor authentication settings updated');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSessionTimeoutChange = async (minutes: number) => {
    try {
      const { error } = await supabase
        .from('admin_settings')
        .update({ session_timeout: minutes })
        .eq('id', 'global');

      if (error) throw error;

      setSettings(prev => ({
        ...prev,
        sessionTimeout: minutes
      }));
      setSuccess('Session timeout updated');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAddIP = async () => {
    if (!/^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/.test(newIP)) {
      setError('Invalid IP address format');
      return;
    }

    try {
      const { error } = await supabase
        .from('admin_settings')
        .update({
          allowed_ips: [...settings.allowedIPs, newIP]
        })
        .eq('id', 'global');

      if (error) throw error;

      setSettings(prev => ({
        ...prev,
        allowedIPs: [...prev.allowedIPs, newIP]
      }));
      setNewIP('');
      setSuccess('IP address added successfully');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRemoveIP = async (ip: string) => {
    try {
      const { error } = await supabase
        .from('admin_settings')
        .update({
          allowed_ips: settings.allowedIPs.filter(item => item !== ip)
        })
        .eq('id', 'global');

      if (error) throw error;

      setSettings(prev => ({
        ...prev,
        allowedIPs: prev.allowedIPs.filter(item => item !== ip)
      }));
      setSuccess('IP address removed successfully');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">Security Settings</h2>

      {/* Two-Factor Authentication */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Two-Factor Authentication
              </h3>
              <p className="text-sm text-gray-500">
                Require 2FA for all administrative accounts
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.twoFactorEnabled}
              onChange={handleTwoFactorToggle}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      {/* Session Timeout */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="bg-green-100 p-3 rounded-full">
            <Clock className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Session Timeout
            </h3>
            <p className="text-sm text-gray-500">
              Set the duration of inactivity before automatic logout
            </p>
          </div>
        </div>
        <select
          value={settings.sessionTimeout}
          onChange={(e) => handleSessionTimeoutChange(Number(e.target.value))}
          className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value={15}>15 minutes</option>
          <option value={30}>30 minutes</option>
          <option value={60}>1 hour</option>
          <option value={120}>2 hours</option>
        </select>
      </div>

      {/* IP Restrictions */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="bg-purple-100 p-3 rounded-full">
            <Globe className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              IP Access Restrictions
            </h3>
            <p className="text-sm text-gray-500">
              Manage allowed IP addresses for admin access
            </p>
          </div>
        </div>
        
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newIP}
            onChange={(e) => setNewIP(e.target.value)}
            placeholder="Enter IP address (e.g., 192.168.1.1)"
            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <button
            onClick={handleAddIP}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add IP
          </button>
        </div>

        <div className="space-y-2">
          {settings.allowedIPs.map((ip) => (
            <div
              key={ip}
              className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
            >
              <span className="text-sm text-gray-600">{ip}</span>
              <button
                onClick={() => handleRemoveIP(ip)}
                className="text-red-600 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 text-green-600 rounded-md">
          {success}
        </div>
      )}
    </div>
  );
}