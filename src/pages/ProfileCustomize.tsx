import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Camera, Link as LinkIcon, Loader2, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Input } from '../components/Input';

interface ProfileForm {
  fullName: string;
  username: string;
  bio: string;
  socialLinks: { platform: string; url: string }[];
  interests: string[];
  avatarUrl: string | null;
}

export function ProfileCustomize() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [form, setForm] = useState<ProfileForm>({
    fullName: '',
    username: '',
    bio: '',
    socialLinks: [{ platform: '', url: '' }],
    interests: [],
    avatarUrl: null,
  });

  useEffect(() => {
    const session = searchParams.get('session');
    if (!session) {
      navigate('/login');
    }
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (profile) {
        setForm({
          fullName: profile.full_name || '',
          username: profile.username || '',
          bio: profile.bio || '',
          socialLinks: profile.social_links || [{ platform: '', url: '' }],
          interests: profile.interests || [],
          avatarUrl: profile.avatar_url,
        });
      }
    } catch (err: any) {
      console.error('Error loading profile:', err.message);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image size must be less than 2MB');
      return;
    }

    // Validate file type
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError('Only JPG and PNG images are allowed');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setForm(prev => ({ ...prev, avatarUrl: publicUrl }));
      await saveProfile({ ...form, avatarUrl: publicUrl });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInterestAdd = (interest: string) => {
    if (form.interests.length >= 5) {
      setError('Maximum 5 interests allowed');
      return;
    }
    if (interest.trim()) {
      setForm(prev => ({
        ...prev,
        interests: [...prev.interests, interest.trim()]
      }));
    }
  };

  const handleInterestRemove = (index: number) => {
    setForm(prev => ({
      ...prev,
      interests: prev.interests.filter((_, i) => i !== index)
    }));
  };

  const handleSocialLinkAdd = () => {
    setForm(prev => ({
      ...prev,
      socialLinks: [...prev.socialLinks, { platform: '', url: '' }]
    }));
  };

  const handleSocialLinkRemove = (index: number) => {
    setForm(prev => ({
      ...prev,
      socialLinks: prev.socialLinks.filter((_, i) => i !== index)
    }));
  };

  const handleSocialLinkChange = (index: number, field: 'platform' | 'url', value: string) => {
    setForm(prev => ({
      ...prev,
      socialLinks: prev.socialLinks.map((link, i) => 
        i === index ? { ...link, [field]: value } : link
      )
    }));
  };

  const saveProfile = async (profileData: ProfileForm) => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.fullName,
          username: profileData.username,
          bio: profileData.bio,
          social_links: profileData.socialLinks,
          interests: profileData.interests,
          avatar_url: profileData.avatarUrl,
        })
        .eq('id', user.id);

      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveProfile(form);
    navigate('/profile');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white p-4">
      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h1 className="text-2xl font-semibold text-gray-800 mb-6">Customize Your Profile</h1>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Avatar Upload */}
              <div className="flex flex-col items-center">
                <div className="relative w-32 h-32 mb-4">
                  <div className="w-full h-full rounded-full overflow-hidden bg-gray-100">
                    {previewImage || form.avatarUrl ? (
                      <img
                        src={previewImage || form.avatarUrl || ''}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Camera className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-green-600 text-white p-2 rounded-full cursor-pointer hover:bg-green-700">
                    <Camera className="w-4 h-4" />
                    <input
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png"
                      onChange={handleImageUpload}
                      disabled={loading}
                    />
                  </label>
                </div>
                {loading && <Loader2 className="w-5 h-5 animate-spin text-green-600" />}
              </div>

              <Input
                label="Full Name"
                value={form.fullName}
                onChange={(e) => setForm(prev => ({ ...prev, fullName: e.target.value }))}
                required
              />

              <Input
                label="Username"
                value={form.username}
                onChange={(e) => setForm(prev => ({ ...prev, username: e.target.value }))}
                required
              />

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Bio (max 160 characters)
                </label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm(prev => ({ ...prev, bio: e.target.value }))}
                  maxLength={160}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500">
                  {form.bio.length}/160 characters
                </p>
              </div>

              {/* Social Links */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Social Links
                </label>
                {form.socialLinks.map((link, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Platform"
                      value={link.platform}
                      onChange={(e) => handleSocialLinkChange(index, 'platform', e.target.value)}
                    />
                    <Input
                      placeholder="URL"
                      value={link.url}
                      onChange={(e) => handleSocialLinkChange(index, 'url', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => handleSocialLinkRemove(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleSocialLinkAdd}
                  className="text-green-600 hover:text-green-700 text-sm flex items-center gap-1"
                >
                  <LinkIcon className="w-4 h-4" />
                  Add Social Link
                </button>
              </div>

              {/* Interests/Tags */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Interests (max 5)
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.interests.map((interest, index) => (
                    <span
                      key={index}
                      className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm flex items-center gap-1"
                    >
                      {interest}
                      <button
                        type="button"
                        onClick={() => handleInterestRemove(index)}
                        className="text-green-600 hover:text-green-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <Input
                  placeholder="Add an interest and press Enter"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleInterestAdd((e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                  disabled={form.interests.length >= 5}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Complete Profile
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Preview Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Profile Preview</h2>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100">
                {previewImage || form.avatarUrl ? (
                  <img
                    src={previewImage || form.avatarUrl || ''}
                    alt="Profile Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Camera className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-xl font-semibold">{form.fullName || 'Your Name'}</h3>
                <p className="text-gray-600">@{form.username || 'username'}</p>
              </div>
            </div>

            {form.bio && (
              <p className="text-gray-700">{form.bio}</p>
            )}

            {form.interests.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.interests.map((interest, index) => (
                  <span
                    key={index}
                    className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            )}

            {form.socialLinks.some(link => link.platform && link.url) && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Connect with me:</h4>
                <div className="space-y-1">
                  {form.socialLinks
                    .filter(link => link.platform && link.url)
                    .map((link, index) => (
                      <a
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-700 block"
                      >
                        {link.platform}
                      </a>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}