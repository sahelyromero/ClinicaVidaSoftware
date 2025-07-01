// DoctorForm.tsx
import React from 'react';
import { Doctor } from '../../database/db';

interface DoctorFormProps {
  doctorData: Omit<Doctor, 'id'>;
  showSpecialtyField: boolean;
  isEditing: boolean;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  resetForm: () => void;
}

const DoctorForm: React.FC<DoctorFormProps> = ({
  doctorData,
  showSpecialtyField,
  isEditing,
  handleInputChange,
  handleSubmit,
  resetForm
}) => {
  return (
    <div className="doctor-form-container">
      <h2 className="text-xl font-bold mb-3">
        {isEditing ? 'Editar Médico' : 'Agregar Médico'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="input-group">
          <label>Nombre Completo</label>
          <input
            type="text"
            name="name"
            value={doctorData.name}
            onChange={handleInputChange}
            required
            className="input"
          />
        </div>
        <div className="input-group">
          <label>Número de Identificación</label>
          <input
            type="text"
            name="idNumber"
            value={doctorData.idNumber}
            onChange={handleInputChange}
            required
            className="input"
          />
        </div>
        <div className="input-group">
          <label>Correo Electrónico</label>
          <input
            type="email"
            name="email"
            value={doctorData.email}
            onChange={handleInputChange}
            required
            className="input"
          />
        </div>
        <div className="input-group">
          <label>Fecha de Nacimiento</label>
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
          <label>Grupo de Trabajo</label>
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
        <div className="input-group">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="hasSpecialty"
              checked={doctorData.hasSpecialty}
              onChange={handleInputChange}
              disabled={doctorData.group === 'urgencias'}
            />
            <span className={`ml-2 ${doctorData.group === 'urgencias' ? 'text-gray-400' : ''}`}>
              ¿Tiene especialidad?
            </span>
          </label>
          {doctorData.group === 'urgencias' && (
            <p className="text-sm text-gray-500 mt-1">
              Los médicos de urgencias no requieren especialidad
            </p>
          )}
        </div>
        {showSpecialtyField && (
          <div className="input-group">
            <label className="block text-sm font-medium">Especialidad</label>
            <select
              name="specialty"
              value={doctorData.specialty}
              onChange={handleInputChange}
              className="input"
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