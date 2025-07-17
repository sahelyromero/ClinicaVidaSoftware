import React, { useState, useEffect } from 'react';
import { Doctor } from '../../database/db';
import { SuccessModal } from './eventosEspecialesHelpers';

interface DoctorFormProps {
  doctorData: Omit<Doctor, 'id'>;
  showSpecialtyField: boolean;
  isEditing: boolean;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  resetForm: () => void;
  formErrors: string[];
  specialtyError: string | null;
}

const DoctorForm: React.FC<DoctorFormProps> = ({
  doctorData,
  showSpecialtyField,
  isEditing,
  handleInputChange,
  handleSubmit,
  resetForm,
  formErrors,
  specialtyError
}) => {
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previousErrorsLength, setPreviousErrorsLength] = useState(formErrors.length);

  // Efecto para detectar cuando se resuelve exitosamente el formulario
  useEffect(() => {
    // Si estaba enviando y ahora no hay errores, mostrar éxito
    if (isSubmitting && formErrors.length === 0 && previousErrorsLength >= 0) {
      const message = isEditing 
        ? 'Los cambios en este médico han sido guardados correctamente'
        : 'El médico ha sido registrado correctamente';
      
      setSuccessMessage(message);
      setShowSuccessModal(true);
      setIsSubmitting(false);
    }
    // Si hay errores, detener el estado de envío
    else if (isSubmitting && formErrors.length > 0) {
      setIsSubmitting(false);
    }
    
    setPreviousErrorsLength(formErrors.length);
  }, [formErrors, isSubmitting, isEditing, previousErrorsLength]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Ejecutar la función handleSubmit del padre
      await handleSubmit(e);
    } catch (error) {
      console.error('Error al procesar el formulario:', error);
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    // Si no estamos editando, resetear el formulario después de agregar
    if (!isEditing) {
      resetForm();
    }
  };

  const handleCancelEdit = () => {
    setShowSuccessModal(false);
    resetForm();
  };

  return (
    <div className="doctor-form-container" style={{ fontFamily: "'Century Gothic', sans-serif" }}>
      <h2 className="text-xl font-bold mb-3">
        {isEditing ? 'Editar Médico' : 'Agregar Médico'}
      </h2>

      {formErrors.length > 0 && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded mb-4">
          <ul className="list-disc ml-5">
            {formErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="space-y-4">
        <div className="input-group">
          <label className="font-century-gothic">Nombre Completo</label>
          <input
            type="text"
            name="name"
            value={doctorData.name}
            onChange={handleInputChange}
            required
            className="input"
            pattern="^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$"
            title="Solo se permiten letras"
            disabled={isSubmitting}
          />
        </div>
        <div className="input-group">
          <label className="font-century-gothic">Número de Identificación</label>
          <input
            type="text"
            name="idNumber"
            value={doctorData.idNumber}
            onChange={handleInputChange}
            required
            className="input"
            pattern="^\d+$"
            title="Solo se permiten números"
            disabled={isSubmitting}
          />
        </div>
        <div className="input-group">
          <label className="font-century-gothic">Correo Electrónico</label>
          <input
            type="email"
            name="email"
            value={doctorData.email}
            onChange={handleInputChange}
            required
            className="input"
            pattern="^[\w.-]+@[\w.-]+\.[A-Za-z]{2,}$"
            title="Debe incluir un correo válido con @ y dominio (.com, .org, .co, etc.)"
            disabled={isSubmitting}
          />
        </div>
        <div className="input-group">
          <label className="font-century-gothic">Fecha de Nacimiento</label>
          <input
            type="date"
            name="birthDate"
            value={doctorData.birthDate}
            onChange={handleInputChange}
            required
            className="input"
            disabled={isSubmitting}
          />
        </div>
        <div className="input-group">
          <label className="font-century-gothic">Grupo de Trabajo* (Obligatorio)</label>
          <select
            name="group"
            value={doctorData.group}
            onChange={handleInputChange}
            required
            className="input"
            disabled={isSubmitting}
          >
            <option value="urgencias">Urgencias</option>
            <option value="hospitalización">Hospitalización</option>
          </select>
        </div>

        {doctorData.group !== 'urgencias' && (
          <div className="input-group">
            <label className="flex items-center font-century-gothic">
              <input
                type="checkbox"
                name="hasSpecialty"
                checked={doctorData.hasSpecialty}
                onChange={handleInputChange}
                disabled={isSubmitting}
              />
              <span className="ml-2">¿Tiene especialidad?</span>
            </label>
          </div>
        )}

        {doctorData.group === 'urgencias' && (
          <p className="text-sm text-gray-500 mt-1 font-century-gothic">
            Los médicos de urgencias no requieren especialidad.
          </p>
        )}

        {showSpecialtyField && (
          <div className="input-group">
            <label className="block text-sm font-medium font-century-gothic">Especialidad</label>
            <select
              name="specialty"
              value={doctorData.specialty}
              onChange={handleInputChange}
              className={`input ${specialtyError ? 'border-red-500' : ''}`}
              required
              disabled={doctorData.group === 'urgencias' || isSubmitting}
            >
              <option value="">Seleccionar especialidad</option>
              <option value="Oncología">Oncología</option>
              <option value="Hemato-oncología">Hemato-oncología</option>
              <option value="Medicina interna">Medicina interna</option>
              <option value="Dolor y cuidados paliativos">Dolor y cuidados paliativos</option>
              <option value="Cirugía oncológica">Cirugía oncológica</option>
              <option value="Cirugía de tórax">Cirugía de tórax</option>
              <option value="Refuerzo">Refuerzo</option>
            </select>
            {specialtyError && (
              <p className="text-sm text-red-600 mt-1 font-century-gothic">{specialtyError}</p>
            )}
          </div>
        )}

        <div className="form-actions">
          <button 
            type="submit" 
            className="custom-button"
            disabled={isSubmitting}
          >
            {isSubmitting 
              ? (isEditing ? 'Guardando...' : 'Agregando...')
              : (isEditing ? 'Guardar Cambios' : 'Agregar Médico')
            }
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="custom-button bg-gray-500 hover:bg-gray-600"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <SuccessModal 
        show={showSuccessModal} 
        onClose={handleModalClose}
        message={successMessage}
      />
    </div>
  );
};

export default DoctorForm;