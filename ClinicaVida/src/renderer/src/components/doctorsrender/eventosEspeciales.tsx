import React, { useState, useEffect } from 'react';
import { getDoctors, addEventoEspecial, getEventosEspeciales } from '../../database/db';
import {
  Doctor,
  EventoEspecial,
  TIPOS_EVENTO,
  GRUPOS_MEDICOS,
  validateForm,
  filterDoctors,
  getAvailableSpecialties,
  SuccessModal
} from './eventosEspecialesHelpers';

const EventosEspeciales: React.FC = () => {
  // Estados
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const [availableSpecialties, setAvailableSpecialties] = useState<string[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null);
  const [eventType, setEventType] = useState<string>('');
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  const [descripcion, setDescripcion] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [eventos, setEventos] = useState<EventoEspecial[]>([]);
  const [loadingEventos, setLoadingEventos] = useState(false);
  const [isAdding, setIsAdding] = useState(true);

  // Efectos
  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    const filtered = filterDoctors(doctors, selectedGroup, selectedSpecialty);
    setFilteredDoctors(filtered);
  }, [doctors, selectedGroup, selectedSpecialty]);

  useEffect(() => {
    const specialties = getAvailableSpecialties(doctors, selectedGroup);
    setAvailableSpecialties(specialties);
    if (selectedGroup !== 'hospitalización') setSelectedSpecialty('');
  }, [selectedGroup, doctors]);

  // Funciones
  const loadDoctors = async () => {
    try {
      setLoading(true);
      const doctorsFromDB = await getDoctors();
      setDoctors(doctorsFromDB);
    } catch (error) {
      console.error('Error al cargar doctores:', error);
      setErrorMessage('Error al cargar la lista de doctores');
    } finally {
      setLoading(false);
    }
  };

  const loadEventos = async () => {
    try {
      setLoadingEventos(true);
      const eventosFromDB = await getEventosEspeciales();
      setEventos(eventosFromDB);
    } catch (error) {
      console.error('Error al cargar eventos:', error);
      setErrorMessage('Error al cargar la lista de eventos');
    } finally {
      setLoadingEventos(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getEventTypeLabel = (type: string) => {
    const tipoEvento = TIPOS_EVENTO.find(t => t.value === type);
    return tipoEvento ? tipoEvento.label : type;
  };

  const getDoctorName = (doctorId: number) => {
    const doctor = doctors.find(d => d.id === doctorId);
    return doctor ? doctor.name : 'Médico no encontrado';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm(selectedDoctor, eventType, fechaInicio, fechaFin);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    try {
      setSaving(true);
      setErrorMessage('');

      const evento: Omit<EventoEspecial, 'id' | 'fechaCreacion'> = {
        doctorId: selectedDoctor!,
        type: eventType as EventoEspecial['type'],
        fechaInicio: new Date(fechaInicio),
        fechaFin: eventType === 'vacaciones' ? new Date(fechaFin) : undefined,
        descripcion: descripcion || undefined
      };

      await addEventoEspecial(evento);
      resetForm();
      setShowSuccessModal(true);
      if (!isAdding) loadEventos();
    } catch (error) {
      console.error('Error al guardar evento:', error);
      setErrorMessage('Error al registrar el evento especial');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setSelectedDoctor(null);
    setEventType('');
    setFechaInicio('');
    setFechaFin('');
    setDescripcion('');
    setSelectedGroup('');
    setSelectedSpecialty('');
    setErrorMessage('');
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    resetForm();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-lg font-semibold mb-2">Cargando...</div>
          <div className="text-gray-500">Obteniendo lista de médicos</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <h1 className="text-xl md:text-2xl font-bold mb-6 text-gray-800">Registro de Eventos Especiales</h1>

      {/* Mensaje de error */}
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 rounded-md flex items-center">
          <span className="text-red-700">{errorMessage}</span>
        </div>
      )}

      {/* Botones principales */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <button
          onClick={() => setIsAdding(true)}
          className={`flex-1 py-2 px-4 rounded-md transition-colors ${
            isAdding ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Agregar Evento
        </button>
        <button
          onClick={() => {
            setIsAdding(false);
            loadEventos();
          }}
          className={`flex-1 py-2 px-4 rounded-md transition-colors ${
            !isAdding ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Ver Lista
        </button>
      </div>

      {/* Formulario o lista */}
      {isAdding ? (
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Registrar Nuevo Evento</h2>

          {/* Filtros */}
          <div className="bg-gray-50 p-3 rounded-md mb-4">
            <h3 className="font-medium mb-3 text-gray-700">Filtros de Médicos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Filtrar por Tipo:</label>
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todos los tipos</option>
                  {GRUPOS_MEDICOS.map(grupo => (
                    <option key={grupo.value} value={grupo.value}>{grupo.label}</option>
                  ))}
                </select>
              </div>

              {selectedGroup === 'hospitalización' && (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Filtrar por Especialidad:</label>
                  <select
                    value={selectedSpecialty}
                    onChange={(e) => setSelectedSpecialty(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Todas las especialidades</option>
                    {availableSpecialties.map(specialty => (
                      <option key={specialty} value={specialty}>{specialty}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Campos del formulario */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Seleccionar Médico: <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedDoctor || ''}
                onChange={(e) => setSelectedDoctor(Number(e.target.value))}
                required
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seleccione un médico</option>
                {filteredDoctors.map(doctor => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name} {doctor.specialty && `(${doctor.specialty})`}
                  </option>
                ))}
              </select>
            </div>

            {selectedDoctor && (
              <>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Tipo de Evento: <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccione el tipo de evento</option>
                    {TIPOS_EVENTO.map(tipo => (
                      <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                    ))}
                  </select>
                </div>

                {eventType && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          {eventType === 'vacaciones' ? 'Fecha de Inicio:' : 'Fecha del Evento:'} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={fechaInicio}
                          onChange={(e) => setFechaInicio(e.target.value)}
                          required
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      {eventType === 'vacaciones' && (
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">
                            Fecha de Fin: <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            value={fechaFin}
                            onChange={(e) => setFechaFin(e.target.value)}
                            required
                            min={fechaInicio}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Descripción (opcional):
                      </label>
                      <textarea
                        value={descripcion}
                        onChange={(e) => setDescripcion(e.target.value)}
                        rows={3}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </>
                )}
              </>
            )}

            {/* Botones del formulario */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={handleSubmit}
                disabled={saving || !selectedDoctor || !eventType || !fechaInicio}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Guardando...
                  </span>
                ) : 'Registrar Evento'}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* TABLA CON SCROLL CORREGIDA */
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-800">
              Eventos Registrados ({eventos.length})
            </h2>
          </div>

          {loadingEventos ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-gray-500">Cargando eventos...</div>
            </div>
          ) : eventos.length === 0 ? (
            <div className="flex justify-center items-center h-64 text-gray-500">
              <p className="text-lg">No hay eventos registrados</p>
            </div>
          ) : (
            /* CONTENEDOR CON SCROLL FUNCIONAL */
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 border-b border-gray-200">
                      Médico
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 border-b border-gray-200">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 border-b border-gray-200">
                      Fecha Inicio
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 border-b border-gray-200">
                      Fecha Fin
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 border-b border-gray-200">
                      Descripción
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {eventos.map((evento, index) => (
                    <tr
                      key={evento.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                        {getDoctorName(evento.doctorId)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full whitespace-nowrap">
                          {getEventTypeLabel(evento.type)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {formatDate(evento.fechaInicio)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {evento.fechaFin ? formatDate(evento.fechaFin) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 max-w-xs">
                        <div className="truncate" title={evento.descripcion || '-'}>
                          {evento.descripcion || '-'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Indicador de scroll si hay muchos elementos */}
          {eventos.length > 8 && (
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 text-center">
              Desplázate para ver más registros ({eventos.length} total)
            </div>
          )}
        </div>
      )}

      {/* Modal de éxito */}
      <SuccessModal
        show={showSuccessModal}
        onClose={handleCloseSuccessModal}
      />

      {/* CSS mejorado para scrollbar */}
      <style jsx>{`
        .overflow-y-auto::-webkit-scrollbar {
          width: 8px;
        }
        .overflow-y-auto::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .overflow-x-auto::-webkit-scrollbar {
          height: 8px;
        }
        .overflow-x-auto::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        .overflow-x-auto::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .overflow-x-auto::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default EventosEspeciales;
