import React, { useState, useEffect } from 'react';
import { Camera, Lock, Bell, Save, Scale, Activity } from 'lucide-react';
import { Input } from './Input';
import type { ProfileForm } from '../types/profile';
import { supabase } from '../lib/supabase';

interface SettingsFormProps {
  profile: ProfileForm;
  onSave: (profile: ProfileForm) => Promise<void>;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => Promise<void>;
}

export function SettingsForm({ profile, onSave, onImageUpload }: SettingsFormProps) {
  const [form, setForm] = useState({
    ...profile,
    city: profile.city || '',
    state: profile.state || '',
    weight: '',
    targetWeight: '',
    height: '',
  });
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(profile.avatarUrl);
  const [error, setError] = useState('');
  const [bmi, setBmi] = useState<number | null>(null);
  const [bmiCategory, setBmiCategory] = useState<string>('');
  const [weightDifference, setWeightDifference] = useState<number | null>(null);

  const calculateBMI = (weight: string, height: string) => {
    if (!weight || !height) return null;
    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height) / 100; // convert cm to m
    if (weightNum > 0 && heightNum > 0) {
      const bmiValue = weightNum / (heightNum * heightNum);
      return parseFloat(bmiValue.toFixed(2));
    }
    return null;
  };

  const getBMICategory = (bmi: number | null) => {
    if (bmi === null) return '';
    if (bmi < 18.5) return 'Abaixo do peso';
    if (bmi < 25) return 'Peso normal';
    if (bmi < 30) return 'Sobrepeso';
    if (bmi < 35) return 'Obesidade grau I';
    if (bmi < 40) return 'Obesidade grau II';
    return 'Obesidade grau III';
  };

  useEffect(() => {
    const bmiValue = calculateBMI(form.weight, form.height);
    setBmi(bmiValue);
    setBmiCategory(getBMICategory(bmiValue));

    if (form.weight && form.targetWeight) {
      const diff = parseFloat(form.weight) - parseFloat(form.targetWeight);
      setWeightDifference(parseFloat(diff.toFixed(1)));
    } else {
      setWeightDifference(null);
    }
  }, [form.weight, form.height, form.targetWeight]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      await onImageUpload(e, 'avatar');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(form);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações Pessoais</h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Foto de Perfil */}
          <div className="flex items-center space-x-6 mb-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100">
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Camera className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-lg cursor-pointer hover:bg-gray-50">
                <Camera className="w-4 h-4 text-gray-600" />
                <input
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png"
                  onChange={handleImageChange}
                />
              </label>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-700">Foto de Perfil</h4>
              <p className="text-sm text-gray-500">
                JPG ou PNG. Tamanho máximo de 2MB.
              </p>
            </div>
          </div>

          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nome Completo"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              required
            />
            <Input
              label="Nome de Usuário"
              name="username"
              value={form.username}
              onChange={handleChange}
            />
            <Input
              label="E-mail"
              type="email"
              name="email"
              value={form.email}
              disabled
            />
            <Input
              label="Telefone"
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="(00) 00000-0000"
            />
            <Input
              label="Data de Nascimento"
              type="date"
              name="birthDate"
              value={form.birthDate}
              onChange={handleChange}
              required
            />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Sexo
              </label>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Selecione</option>
                <option value="male">Masculino</option>
                <option value="female">Feminino</option>
                <option value="other">Outro</option>
              </select>
            </div>
          </div>

          {/* Informações Físicas e IMC */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Altura (cm)"
                type="number"
                name="height"
                value={form.height}
                onChange={handleChange}
                min="0"
                max="300"
                placeholder="Ex: 170"
              />
              <Input
                label="Peso Atual (kg)"
                type="number"
                name="weight"
                value={form.weight}
                onChange={handleChange}
                min="0"
                max="500"
                step="0.1"
                placeholder="Ex: 70.5"
              />
              <Input
                label="Peso Desejado (kg)"
                type="number"
                name="targetWeight"
                value={form.targetWeight}
                onChange={handleChange}
                min="0"
                max="500"
                step="0.1"
                placeholder="Ex: 65.0"
              />
            </div>

            {/* Resultado do IMC */}
            {bmi && (
              <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Scale className="w-5 h-5 text-green-600" />
                    <h4 className="font-medium text-gray-900">Seu IMC</h4>
                  </div>
                  <span className="text-2xl font-bold text-green-600">{bmi}</span>
                </div>
                
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${
                      bmi < 18.5 ? 'bg-blue-500' :
                      bmi < 25 ? 'bg-green-500' :
                      bmi < 30 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${Math.min((bmi / 40) * 100, 100)}%` }}
                  />
                </div>

                <div className="flex justify-between text-sm text-gray-600">
                  <span>Abaixo do peso</span>
                  <span>Normal</span>
                  <span>Sobrepeso</span>
                  <span>Obesidade</span>
                </div>

                <div className="p-4 rounded-lg bg-gray-50">
                  <p className="text-gray-700">
                    Sua classificação: <span className="font-medium">{bmiCategory}</span>
                  </p>
                  {weightDifference !== null && (
                    <p className="mt-2 text-gray-700">
                      {weightDifference > 0 
                        ? `Meta de redução: ${weightDifference} kg`
                        : weightDifference < 0
                          ? `Meta de ganho: ${Math.abs(weightDifference)} kg`
                          : 'Você já está no seu peso desejado!'}
                    </p>
                  )}
                </div>

                <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                  <Activity className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h5 className="font-medium text-green-800">Recomendações</h5>
                    <ul className="mt-2 space-y-2 text-sm text-green-700">
                      <li>• Consulte um nutricionista para um plano personalizado</li>
                      <li>• Pratique atividades físicas regularmente (150 min/semana)</li>
                      <li>• Mantenha uma boa hidratação (≈2L de água/dia)</li>
                      <li>• Estabeleça metas realistas (0.5-1kg por semana)</li>
                      <li>• Monitore seu progresso regularmente</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Localização */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Cidade"
              name="city"
              value={form.city}
              onChange={handleChange}
              placeholder="Digite sua cidade"
            />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Estado
              </label>
              <select
                name="state"
                value={form.state}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Selecione o estado</option>
                <option value="AC">Acre</option>
                <option value="AL">Alagoas</option>
                <option value="AP">Amapá</option>
                <option value="AM">Amazonas</option>
                <option value="BA">Bahia</option>
                <option value="CE">Ceará</option>
                <option value="DF">Distrito Federal</option>
                <option value="ES">Espírito Santo</option>
                <option value="GO">Goiás</option>
                <option value="MA">Maranhão</option>
                <option value="MT">Mato Grosso</option>
                <option value="MS">Mato Grosso do Sul</option>
                <option value="MG">Minas Gerais</option>
                <option value="PA">Pará</option>
                <option value="PB">Paraíba</option>
                <option value="PR">Paraná</option>
                <option value="PE">Pernambuco</option>
                <option value="PI">Piauí</option>
                <option value="RJ">Rio de Janeiro</option>
                <option value="RN">Rio Grande do Norte</option>
                <option value="RS">Rio Grande do Sul</option>
                <option value="RO">Rondônia</option>
                <option value="RR">Roraima</option>
                <option value="SC">Santa Catarina</option>
                <option value="SP">São Paulo</option>
                <option value="SE">Sergipe</option>
                <option value="TO">Tocantins</option>
              </select>
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Biografia
            </label>
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Conte um pouco sobre você..."
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⌛</span>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Salvar Alterações
                </>
              )}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}