import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Video, MapPin, AlertCircle, FileText, X, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Input } from './Input';

interface AppointmentSlot {
  time: string;
  available: boolean;
}

interface UploadedFile {
  name: string;
  path: string;
  size: number;
  type: string;
}

export function AppointmentScheduler() {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [appointmentType, setAppointmentType] = useState('');
  const [modality, setModality] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [availableSlots, setAvailableSlots] = useState<AppointmentSlot[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots(selectedDate);
    }
  }, [selectedDate]);

  const loadAvailableSlots = async (date: string) => {
    try {
      const dayOfWeek = new Date(date).getDay();
      
      const { data: slots, error } = await supabase
        .from('appointment_slots')
        .select('*')
        .eq('day_of_week', dayOfWeek);

      if (error) throw error;

      // Simular slots disponíveis para demonstração
      const mockSlots: AppointmentSlot[] = [
        { time: '08:00', available: true },
        { time: '09:00', available: true },
        { time: '10:00', available: false },
        { time: '11:00', available: true },
        { time: '14:00', available: true },
        { time: '15:00', available: true },
        { time: '16:00', available: false },
        { time: '17:00', available: true },
      ];

      setAvailableSlots(mockSlots);
    } catch (err: any) {
      console.error('Erro ao carregar horários:', err.message);
      setError('Erro ao carregar horários disponíveis');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      for (const file of files) {
        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error('Arquivo muito grande. Limite de 10MB');
        }

        // Validate file type
        if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
          throw new Error('Tipo de arquivo não permitido. Apenas PDF, JPG e PNG são aceitos');
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('appointment_files')
          .upload(fileName, file, {
            contentType: file.type,
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        setUploadedFiles(prev => [...prev, {
          name: file.name,
          path: fileName,
          size: file.size,
          type: file.type
        }]);
      }
    } catch (err: any) {
      console.error('Erro no upload:', err);
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Criar o agendamento
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          patient_id: user.id,
          date: selectedDate,
          start_time: selectedSlot,
          end_time: `${selectedSlot.split(':')[0]}:50`, // 50 minutos de consulta
          type: appointmentType,
          modality: modality,
          notes: notes,
          status: 'scheduled'
        })
        .select()
        .single();

      if (appointmentError) throw appointmentError;

      // Registrar os arquivos anexados
      if (uploadedFiles.length > 0) {
        const { error: filesError } = await supabase
          .from('appointment_files')
          .insert(
            uploadedFiles.map(file => ({
              appointment_id: appointment.id,
              file_name: file.name,
              file_path: file.path,
              uploaded_by: user.id
            }))
          );

        if (filesError) throw filesError;
      }

      setSuccess('Consulta agendada com sucesso!');
      
      // Limpar formulário
      setSelectedDate('');
      setSelectedSlot('');
      setAppointmentType('');
      setModality('');
      setNotes('');
      setUploadedFiles([]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return selectedDate && 
           selectedSlot && 
           appointmentType && 
           modality;
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Formulário de Agendamento */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Agendar Consulta</h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {/* Data */}
              <Input
                label="Data da Consulta"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />

              {/* Horários Disponíveis */}
              {selectedDate && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Horário
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.time}
                        type="button"
                        onClick={() => setSelectedSlot(slot.time)}
                        disabled={!slot.available}
                        className={`p-2 text-sm rounded-md border ${
                          selectedSlot === slot.time
                            ? 'bg-green-600 text-white border-green-600'
                            : slot.available
                            ? 'border-gray-300 hover:border-green-500'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tipo de Consulta */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Tipo de Consulta
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAppointmentType('first_visit')}
                    className={`p-3 text-sm rounded-md border flex items-center justify-center gap-2 ${
                      appointmentType === 'first_visit'
                        ? 'bg-green-600 text-white border-green-600'
                        : 'border-gray-300 hover:border-green-500'
                    }`}
                  >
                    Primeira Consulta
                  </button>
                  <button
                    type="button"
                    onClick={() => setAppointmentType('follow_up')}
                    className={`p-3 text-sm rounded-md border flex items-center justify-center gap-2 ${
                      appointmentType === 'follow_up'
                        ? 'bg-green-600 text-white border-green-600'
                        : 'border-gray-300 hover:border-green-500'
                    }`}
                  >
                    Retorno
                  </button>
                </div>
              </div>

              {/* Modalidade */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Modalidade
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setModality('online')}
                    className={`p-3 text-sm rounded-md border flex items-center justify-center gap-2 ${
                      modality === 'online'
                        ? 'bg-green-600 text-white border-green-600'
                        : 'border-gray-300 hover:border-green-500'
                    }`}
                  >
                    <Video className="w-4 h-4" />
                    Online
                  </button>
                  <button
                    type="button"
                    onClick={() => setModality('in_person')}
                    className={`p-3 text-sm rounded-md border flex items-center justify-center gap-2 ${
                      modality === 'in_person'
                        ? 'bg-green-600 text-white border-green-600'
                        : 'border-gray-300 hover:border-green-500'
                    }`}
                  >
                    <MapPin className="w-4 h-4" />
                    Presencial
                  </button>
                </div>
              </div>

              {/* Observações */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Observações ou Necessidades Especiais
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Ex: Alergias, restrições alimentares, etc."
                />
              </div>

              {/* Upload de Arquivos */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Anexar Exames
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <div className="text-center">
                    <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <div className="text-sm text-gray-600">
                      <label className="text-green-600 hover:text-green-500 cursor-pointer">
                        <span>Upload de arquivo</span>
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.png,.jpg,.jpeg"
                          multiple
                          onChange={handleFileUpload}
                          disabled={uploading}
                        />
                      </label>
                      <span> ou arraste e solte</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, PNG, JPG até 10MB
                    </p>
                  </div>
                </div>

                {/* Lista de Arquivos */}
                {uploadedFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                      >
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <div>
                            <span className="text-sm text-gray-600 truncate">
                              {file.name}
                            </span>
                            <span className="text-xs text-gray-400 ml-2">
                              ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 text-green-600 rounded-md text-sm">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !isFormValid()}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⌛</span>
                  Agendando...
                </>
              ) : (
                'Agendar Consulta'
              )}
            </button>
          </form>
        </div>

        {/* Informações e Instruções */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Informações Importantes
            </h4>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">
                    As consultas têm duração de 50 minutos. Chegue com 10 minutos de antecedência.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">
                    Cancelamentos devem ser feitos com no mínimo 24 horas de antecedência.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">
                    Traga seus exames recentes e registros alimentares, se houver.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {modality === 'online' && (
            <div className="bg-blue-50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                <Video className="w-5 h-5" />
                Consulta Online
              </h4>
              <div className="space-y-3 text-sm text-blue-700">
                <p>
                  • O link da videochamada será enviado por e-mail 30 minutos antes da consulta
                </p>
                <p>
                  • Certifique-se de ter uma boa conexão com a internet
                </p>
                <p>
                  • Escolha um ambiente silencioso e bem iluminado
                </p>
                <p>
                  • Teste sua câmera e microfone antes da consulta
                </p>
              </div>
            </div>
          )}

          {modality === 'in_person' && (
            <div className="bg-green-50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-green-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Consulta Presencial
              </h4>
              <div className="space-y-3 text-sm text-green-700">
                <p>
                  • Endereço: Av. Principal, 1000 - Centro
                </p>
                <p>
                  • Estacionamento gratuito disponível
                </p>
                <p>
                  • Use máscara durante todo o atendimento
                </p>
                <p>
                  • Traga uma garrafa de água
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}