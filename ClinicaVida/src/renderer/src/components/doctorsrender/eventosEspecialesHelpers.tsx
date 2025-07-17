import React from 'react'

// Interfaces y tipos
export interface Doctor {
  id?: number
  name: string
  idNumber: string
  birthDate: string
  hasSpecialty: boolean
  specialty?: string
  group?: 'urgencias' | 'hospitalización'
  email?: string
  horasTrabajadas: number
}

export interface EventoEspecial {
  id?: number
  doctorId: number
  type: 'vacaciones' | 'incapacidad' | 'calamidad' | 'dia_familia' | 'permiso_personal'
  fechaInicio: Date
  fechaFin?: Date
  descripcion?: string
  fechaCreacion: Date
}

// Constantes
export const TIPOS_EVENTO = [
  { value: 'vacaciones', label: 'Vacaciones' },
  { value: 'incapacidad', label: 'Incapacidad' },
  { value: 'calamidad', label: 'Calamidad' },
  { value: 'dia_familia', label: 'Día de la Familia' },
  { value: 'permiso_personal', label: 'Permiso Personal' }
] as const

export const GRUPOS_MEDICOS = [
  { value: 'urgencias', label: 'Urgencias' },
  { value: 'hospitalización', label: 'Hospitalización' },
] as const

// Funciones de validación
export const validateForm = (
  selectedDoctor: number | null,
  eventType: string,
  fechaInicio: string,
  fechaFin: string
): string | null => {
  if (!selectedDoctor || !eventType || !fechaInicio) {
    return 'Por favor completa todos los campos requeridos'
  }

  if (eventType === 'vacaciones' && !fechaFin) {
    return 'Para vacaciones debes seleccionar fecha de fin'
  }

  if (eventType === 'vacaciones' && fechaFin && new Date(fechaFin) <= new Date(fechaInicio)) {
    return 'La fecha de fin debe ser posterior a la fecha de inicio'
  }

  return null
}

// Funciones auxiliares
export const filterDoctors = (
  doctors: Doctor[],
  selectedGroup: string,
  selectedSpecialty: string
): Doctor[] => {
  let filtered = doctors

  if (selectedGroup) {
    filtered = filtered.filter(doctor => doctor.group === selectedGroup)
  }

  if (selectedGroup === 'hospitalización' && selectedSpecialty) {
    filtered = filtered.filter(doctor => doctor.specialty === selectedSpecialty)
  }

  return filtered
}

export const getAvailableSpecialties = (doctors: Doctor[], selectedGroup: string): string[] => {
  if (selectedGroup === 'hospitalización') {
    const hospitalizationDoctors = doctors.filter(d => d.group === 'hospitalización')
    return [...new Set(hospitalizationDoctors.map(d => d.specialty).filter((specialty): specialty is string => specialty !== undefined))]
  }
  return []
}

// Componente Modal de Éxito
interface SuccessModalProps {
  show: boolean
  onClose: () => void
  message?: string // Prop opcional para mensaje personalizado
}

export const SuccessModal: React.FC<SuccessModalProps> = ({ 
  show, 
  onClose, 
  message
}) => {
  // Mensaje por defecto si no se proporciona uno personalizado
  const displayMessage = message || "El evento especial ha sido registrado correctamente.";
  

  if (!show) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          maxWidth: '400px',
          width: '90%',
          textAlign: 'center'
        }}
      >
        <div
          style={{
            width: '80px',
            height: '80px',
            backgroundColor: '#dcfce7',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px'
          }}
        >
          <svg
            style={{ width: '40px', height: '40px', color: '#16a34a' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#15803d',
          marginBottom: '16px',
          margin: '0 0 16px 0'
        }}>
          ¡Registro Exitoso!
        </h2>

        <p style={{
          color: '#16a34a',
          marginBottom: '32px',
          fontSize: '16px',
          lineHeight: '1.5'
        }}>
          {displayMessage}
        </p>

        <button
          onClick={onClose}
          style={{
            width: '100%',
            backgroundColor: '#16a34a',
            color: 'white',
            padding: '16px 32px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
          onMouseOver={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#15803d'}
          onMouseOut={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#16a34a'}
        >
          OK
        </button>
      </div>
    </div>
  )
}