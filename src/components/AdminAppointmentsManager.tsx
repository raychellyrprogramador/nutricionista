import React, { useState, useEffect } from 'react';
import { 
  Calendar, Search, Filter, Download, Bell, Edit2, 
  XCircle, CheckCircle, Clock, AlertCircle, FileText 
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../lib/supabase';

interface Appointment {
  id: string;
  patient: {
    full_name: string;
    email: string;
    phone: string;
  };
  nutritionist: {
    full_name: string;
  };
  date: string;
  start_time: string;
  end_time: string;
  type: 'first_visit' | 'follow_up';
  modality: 'online' | 'in_person';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled';
  price: number;
  notes: string;
  created_at: string;
}

export function AdminAppointmentsManager() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [nutritionistFilter, setNutritionistFilter] = useState('all');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadAppointments();
  }, [dateFilter, statusFilter, nutritionistFilter]);

  const loadAppointments = async () => {
    try {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          patient:patient_id(
            full_name,
            email,
            phone
          ),
          nutritionist:nutritionist_id(
            full_name
          )
        `)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (dateFilter) {
        query = query.eq('date', dateFilter);
      }
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      if (nutritionistFilter !== 'all') {
        query = query.eq('nutritionist_id', nutritionistFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAppointments(data || []);
    } catch (err: any) {
      console.error('Error loading appointments:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId);

      if (error) throw error;

      setAppointments(prev => prev.map(app => 
        app.id === appointmentId ? { ...app, status: newStatus } : app
      ));

      // Log the action
      await supabase
        .from('audit_logs')
        .insert({
          action: 'appointment_status_changed',
          details: `Appointment ${appointmentId} status changed to ${newStatus}`,
          performed_by: (await supabase.auth.getUser()).data.user?.id
        });

      setSuccess('Status atualizado com sucesso');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      const data = appointments.map(app => ({
        'Data': format(new Date(app.date), 'dd/MM/yyyy'),
        'Horário': `${app.start_time} - ${app.end_time}`,
        'Paciente': app.patient.full_name,
        'Email': app.patient.email,
        'Telefone': app.patient.phone,
        'Nutricionista': app.nutritionist.full_name,
        'Tipo': app.type === 'first_visit' ? 'Primeira Consulta' : 'Retorno',
        'Modalidade': app.modality === 'online' ? 'Online' : 'Presencial',
        'Status': app.status,
        'Valor': `R$ ${app.price.toFixed(2)}`,
        'Observações': app.notes
      }));

      if (format === 'csv') {
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(obj => Object.values(obj).join(','));
        const csv = [headers, ...rows].join('\n');
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `agendamentos_${format(new Date(), 'dd-MM-yyyy')}.csv`;
        a.click();
      } else {
        // Implement PDF export
      }
    } catch (err: any) {
      setError('Erro ao exportar dados');
    }
  };

  const sendNotification = async (appointmentId: string, type: 'confirmation' | 'reminder' | 'cancellation') => {
    try {
      const appointment = appointments.find(app => app.id === appointmentId);
      if (!appointment) return;

      // In a real app, this would send an actual notification
      await supabase
        .from('appointment_reminders')
        .insert({
          appointment_id: appointmentId,
          type: type,
          send_at: new Date().toISOString(),
          status: 'pending'
        });

      setSuccess('Notificação agendada com sucesso');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const isToday = (date: string) => {
    return new Date(date).toDateString() === new Date().toDateString();
  };

  const needsAction = (appointment: Appointment) => {
    return appointment.status === 'scheduled' && 
           new Date(appointment.date).getTime() - new Date().getTime() <= 24 * 60 * 60 * 1000;
  };

  const filteredAppointments = appointments.filter(app => 
    app.patient.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.patient.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">Gerenciamento de Agendamentos</h2>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('csv')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar paciente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">Todos os status</option>
            <option value="scheduled">Agendado</option>
            <option value="confirmed">Confirmado</option>
            <option value="completed">Concluído</option>
            <option value="cancelled">Cancelado</option>
            <option value="rescheduled">Remarcado</option>
          </select>
          <select
            value={nutritionistFilter}
            onChange={(e) => setNutritionistFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">Todos os nutricionistas</option>
            {/* Add nutritionist options dynamically */}
          </select>
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data/Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paciente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nutricionista
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo/Modalidade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    Carregando agendamentos...
                  </td>
                </tr>
              ) : filteredAppointments.length > 0 ? (
                filteredAppointments.map((appointment) => (
                  <tr 
                    key={appointment.id} 
                    className={`hover:bg-gray-50 ${
                      isToday(appointment.date) ? 'bg-green-50' : ''
                    } ${needsAction(appointment) ? 'bg-yellow-50' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(new Date(appointment.date), 'dd/MM/yyyy')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {appointment.start_time} - {appointment.end_time}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {appointment.patient.full_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {appointment.patient.email}
                      </div>
                      <div className="text-sm text-gray-500">
                        {appointment.patient.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {appointment.nutritionist.full_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {appointment.type === 'first_visit' ? 'Primeira Consulta' : 'Retorno'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {appointment.modality === 'online' ? 'Online' : 'Presencial'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        appointment.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {appointment.status === 'scheduled' ? 'Agendado' :
                         appointment.status === 'confirmed' ? 'Confirmado' :
                         appointment.status === 'completed' ? 'Concluído' :
                         appointment.status === 'cancelled' ? 'Cancelado' :
                         'Remarcado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      R$ {appointment.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedAppointment(appointment);
                            setShowEditModal(true);
                          }}
                          className="text-green-600 hover:text-green-900"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => sendNotification(appointment.id, 'reminder')}
                          className="text-blue-600 hover:text-blue-900"
                          title="Enviar lembrete"
                        >
                          <Bell className="w-4 h-4" />
                        </button>
                        {appointment.status !== 'cancelled' && (
                          <button
                            onClick={() => {
                              setSelectedAppointment(appointment);
                              setShowCancelModal(true);
                            }}
                            className="text-red-600 hover:text-red-900"
                            title="Cancelar"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    Nenhum agendamento encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Editar Agendamento
            </h3>
            {/* Add edit form */}
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  // Handle save
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirmar Cancelamento
            </h3>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Voltar
              </button>
              <button
                onClick={() => {
                  if (selectedAppointment) {
                    handleStatusChange(selectedAppointment.id, 'cancelled');
                    setShowCancelModal(false);
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Confirmar Cancelamento
              </button>
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