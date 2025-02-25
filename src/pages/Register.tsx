import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { Input } from '../components/Input';
import { supabase } from '../lib/supabase';

export function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    birthDate: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validatePassword = (password: string) => {
    const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    return regex.test(password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (!validatePassword(formData.password)) {
      setError('A senha deve ter no mínimo 8 caracteres, incluindo números e caracteres especiais');
      return;
    }

    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            full_name: formData.fullName,
            birth_date: formData.birthDate,
            phone: formData.phone,
            tutorial_shown: false,
            is_public: true,
            theme: 'light',
            notifications: {
              email: true,
              push: true
            }
          });

        if (profileError) throw profileError;

        navigate('https://bolt.new/nutri-clinica/profile/customize');
      }
    } catch (err: any) {
      console.error('Erro no registro:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Cadastro">
      <form onSubmit={handleSubmit}>
        <Input
          label="Nome completo"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          required
        />
        <Input
          label="E-mail"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <Input
          label="Senha"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
        />
        <Input
          label="Confirmar senha"
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
        />
        <Input
          label="Data de nascimento"
          type="date"
          name="birthDate"
          value={formData.birthDate}
          onChange={handleChange}
          required
        />
        <Input
          label="Telefone"
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          required
        />

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? 'Cadastrando...' : 'Cadastrar'}
        </button>

        <p className="mt-4 text-center text-sm text-gray-600">
          Já tem uma conta?{' '}
          <Link to="/login" className="text-green-600 hover:text-green-500">
            Faça login
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}