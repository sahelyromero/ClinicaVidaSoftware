import React from 'react';
import { Doctor } from '../../database/db';

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

      <form onSubmit={handleSubmit} className="space-y-4">
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
          />
        </div>
        <div className="input-group">
          <label className="font-century-gothic">Grupo de Trabajo</label>
          <select
            name="group"
            value={doctorData.group}
            onChange={handleInputChange}
            required
            className="input"
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
              disabled={doctorData.group === 'urgencias'}
            >
              <option value="">Seleccionar especialidad</option>
              <option value="Oncología">Oncología</option>
              <option value="Hemato-oncología">Hemato-oncología</option>
              <option value="Medicina interna">Medicina interna</option>
              <option value="Dolor y cuidados paliativos">Dolor y cuidados paliativos</option>
              <option value="Cirugía oncológica">Cirugía oncológica</option>
              <option value="Cirugía de tórax">Cirugía de tórax</option>
              <option value="Cirugía hepatobiliar">Cirugía hepatobiliar</option>
              <option value="Refuerzo">Refuerzo</option>
            </select>
            {specialtyError && (
              <p className="text-sm text-red-600 mt-1 font-century-gothic">{specialtyError}</p>
            )}
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="custom-button">
            {isEditing ? 'Guardar Cambios' : 'Agregar Médico'}
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={resetForm}
              className="custom-button bg-gray-500 hover:bg-gray-600"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default DoctorForm;