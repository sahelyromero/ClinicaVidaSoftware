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
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [availableSpecialties, setAvailableSpecialties] = useState<string[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null);
  const [eventType, setEventType] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [eventos, setEventos] = useState<EventoEspecial[]>([]);
  const [loadingEventos, setLoadingEventos] = useState(false);
  const [isAdding, setIsAdding] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const doctorsFromDB = await getDoctors();
        setDoctors(doctorsFromDB);
      } catch (error) {
        setErrorMessage('Error al cargar la lista de doctores');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  useEffect(() => {
    setFilteredDoctors(filterDoctors(doctors, selectedGroup, selectedSpecialty));
  }, [doctors, selectedGroup, selectedSpecialty]);

  useEffect(() => {
    setAvailableSpecialties(getAvailableSpecialties(doctors, selectedGroup));
    if (selectedGroup !== 'hospitalización') setSelectedSpecialty('');
  }, [selectedGroup, doctors]);

  const loadEventos = async () => {
    try {
      setLoadingEventos(true);
      const eventosFromDB = await getEventosEspeciales();
      setEventos(eventosFromDB);
    } catch (error) {
      setErrorMessage('Error al cargar la lista de eventos');
    } finally {
      setLoadingEventos(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateForm(selectedDoctor, eventType, fechaInicio, fechaFin);
    if (error) return setErrorMessage(error);

    try {
      setSaving(true);
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
    } catch {
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

  const formatDate = (date: Date) => new Date(date).toLocaleDateString('es-ES');
  const getEventTypeLabel = (type: string) => TIPOS_EVENTO.find(t => t.value === type)?.label || type;
  const getDoctorName = (id: number) => doctors.find(d => d.id === id)?.name || 'Médico no encontrado';

  if (loading) return <div className="flex items-center justify-center h-64">Cargando...</div>;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-centuryGothic mb-6 text-gray-800">Registro de Eventos Especiales</h1>

      {errorMessage && <div className="mb-4 p-3 bg-red-100 border border-red-400 rounded-md text-red-700">{errorMessage}</div>}

      <div className="flex flex-wrap justify-center gap-3 mb-6">
        <button onClick={() => setIsAdding(true)} className={`custom-button text-sm px-3 py-1.5 m-1 ${isAdding ? 'active-button' : ''}`}>Agregar Evento</button>
        <button onClick={() => { setIsAdding(false); loadEventos(); }} className={`custom-button text-sm px-3 py-1.5 m-1 ${!isAdding ? 'active-button' : ''}`}>Ver Lista</button>
      </div>

      {isAdding ? (
        <form onSubmit={handleSubmit} className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm">Filtrar por Tipo:</label>
              <select value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)} className="input">
                <option value="">Todos</option>
                {GRUPOS_MEDICOS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </div>
            {selectedGroup === 'hospitalización' && (
              <div>
                <label className="text-sm">Filtrar por Especialidad:</label>
                <select value={selectedSpecialty} onChange={e => setSelectedSpecialty(e.target.value)} className="input">
                  <option value="">Todas</option>
                  {availableSpecialties.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="text-sm">Seleccionar Médico:</label>
            <select value={selectedDoctor || ''} onChange={e => setSelectedDoctor(Number(e.target.value))} className="input">
              <option value="">Seleccione</option>
              {filteredDoctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>

          {selectedDoctor && (
            <>
              <div>
                <label className="text-sm">Tipo de Evento:</label>
                <select value={eventType} onChange={e => setEventType(e.target.value)} className="input">
                  <option value="">Seleccione</option>
                  {TIPOS_EVENTO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} className="input" required />
                {eventType === 'vacaciones' && <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} className="input" required min={fechaInicio} />}
              </div>

              <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Descripción (opcional)" className="input" rows={3} />
            </>
          )}

          <div className="flex flex-wrap gap-3 pt-4">
            <button type="submit" disabled={saving} className="custom-button">{saving ? 'Guardando...' : 'Registrar Evento'}</button>
            <button type="button" onClick={resetForm} className="custom-button bg-gray-100 text-gray-800 hover:bg-gray-200">Limpiar</button>
          </div>
        </form>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-800">Eventos Registrados ({eventos.length})</h2>
          </div>

          {loadingEventos ? (
            <div className="flex justify-center items-center h-64">Cargando eventos...</div>
          ) : eventos.length === 0 ? (
            <div className="flex justify-center items-center h-64 text-gray-500">No hay eventos registrados</div>
          ) : (
            <div className="overflow-x-auto overflow-y-auto max-h-[60vh]">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Médico</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Tipo</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Fecha Inicio</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Fecha Fin</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Descripción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {eventos.map(e => (
                    <tr key={e.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">{getDoctorName(e.doctorId)}</td>
                      <td className="px-4 py-3 text-sm"><span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full whitespace-nowrap">{getEventTypeLabel(e.type)}</span></td>
                      <td className="px-4 py-3 text-sm text-gray-500">{formatDate(e.fechaInicio)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{e.fechaFin ? formatDate(e.fechaFin) : '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate" title={e.descripcion || '-'}>{e.descripcion || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <SuccessModal show={showSuccessModal} onClose={() => setShowSuccessModal(false)} />
    </div>
  );
};

export default EventosEspeciales;
