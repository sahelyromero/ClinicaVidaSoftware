import React, { useState, useEffect } from 'react'
import { getDoctors, addEventoEspecial, getEventosEspeciales } from '../../database/db'
import {
  Doctor,
  EventoEspecial,
  TIPOS_EVENTO,
  GRUPOS_MEDICOS,
  validateForm,
  filterDoctors,
  getAvailableSpecialties,
  SuccessModal
} from './eventosEspecialesHelpers'

const EventosEspeciales: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([])
  const [selectedGroup, setSelectedGroup] = useState<string>('')
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('')
  const [availableSpecialties, setAvailableSpecialties] = useState<string[]>([])
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null)
  const [eventType, setEventType] = useState<string>('')
  const [fechaInicio, setFechaInicio] = useState<string>('')
  const [fechaFin, setFechaFin] = useState<string>('')
  const [descripcion, setDescripcion] = useState<string>('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    loadDoctors()
  }, [])

  useEffect(() => {
    const filtered = filterDoctors(doctors, selectedGroup, selectedSpecialty)
    setFilteredDoctors(filtered)
  }, [doctors, selectedGroup, selectedSpecialty])

  useEffect(() => {
    const specialties = getAvailableSpecialties(doctors, selectedGroup)
    setAvailableSpecialties(specialties)
    if (selectedGroup !== 'hospitalización') {
      setSelectedSpecialty('')
    }
  }, [selectedGroup, doctors])

  const loadDoctors = async () => {
    try {
      setLoading(true)
      const doctorsFromDB = await getDoctors()
      setDoctors(doctorsFromDB)
    } catch (error) {
      console.error('Error al cargar doctores:', error)
      setErrorMessage('Error al cargar la lista de doctores')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationError = validateForm(selectedDoctor, eventType, fechaInicio, fechaFin)
    if (validationError) {
      setErrorMessage(validationError)
      return
    }

    try {
      setSaving(true)
      setErrorMessage('')

      const evento: Omit<EventoEspecial, 'id' | 'fechaCreacion'> = {
        doctorId: selectedDoctor!,
        type: eventType as EventoEspecial['type'],
        fechaInicio: new Date(fechaInicio),
        fechaFin: eventType === 'vacaciones' ? new Date(fechaFin) : undefined,
        descripcion: descripcion || undefined
      }

      await addEventoEspecial(evento)
      await getEventosEspeciales() // Recargar eventos si es necesario
      resetForm()
      setShowSuccessModal(true)

    } catch (error) {
      console.error('Error al guardar evento:', error)
      setErrorMessage('Error al registrar el evento especial')
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setSelectedDoctor(null)
    setEventType('')
    setFechaInicio('')
    setFechaFin('')
    setDescripcion('')
    setSelectedGroup('')
    setSelectedSpecialty('')
    setErrorMessage('')
  }

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false)
    resetForm()
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-lg font-semibold mb-2">Cargando...</div>
            <div className="text-gray-500">Obteniendo lista de médicos</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Registro de Eventos Especiales</h1>

      {errorMessage && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 rounded-md flex items-center">
          <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span className="text-red-700">{errorMessage}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Filtros */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Filtros de Médicos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por Tipo:</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por Especialidad:</label>
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

        {/* Selector de médico */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
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
                {doctor.name} - {doctor.group ? doctor.group.charAt(0).toUpperCase() + doctor.group.slice(1) : 'Sin grupo'}
                {doctor.specialty && ` (${doctor.specialty})`}
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-500 mt-1">
            Médicos disponibles: {filteredDoctors.length}
          </p>
        </div>

        {/* Tipo de evento */}
        {selectedDoctor && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
        )}

        {/* Fechas */}
        {eventType && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
        )}

        {/* Descripción */}
        {eventType && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción (opcional):
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ingrese detalles adicionales sobre el evento..."
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !selectedDoctor || !eventType || !fechaInicio}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Guardando...' : 'Registrar Evento'}
          </button>

          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* Modal de éxito */}
      <SuccessModal
        show={showSuccessModal}
        onClose={handleCloseSuccessModal}
      />
    </div>
  )
}

export default EventosEspeciales
