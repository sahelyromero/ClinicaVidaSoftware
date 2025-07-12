// DoctorsList.tsx
import React from 'react';
import { Doctor } from '../../database/db';

interface DoctorsListProps {
  doctors: Doctor[];
  onEdit: (doctor: Doctor) => void;
  onDelete: (id: number) => void;
}

const DoctorsList: React.FC<DoctorsListProps> = ({ doctors, onEdit, onDelete }) => {
  const groupedDoctors = {
    urgencias: doctors.filter(d => d.group === 'urgencias'),
    hospitalización: doctors.filter(d => d.group === 'hospitalización'),
  };

  const hospitalizationBySpecialty = groupedDoctors.hospitalización.reduce((acc, doctor) => {
    const specialty = doctor.specialty || 'Sin especialidad';
    if (!acc[specialty]) {
      acc[specialty] = [];
    }
    acc[specialty].push(doctor);
    return acc;
  }, {} as Record<string, Doctor[]>);

  const renderDoctorRow = (doctor: Doctor) => (
    <tr key={doctor.id} className="border-t border-gray-200 hover:bg-gray-50">
      <td className="px-4 py-2">{doctor.name}</td>
      <td className="px-4 py-2">{doctor.idNumber}</td>
      <td className="px-4 py-2">{doctor.email}</td>
      <td className="px-4 py-2">
        {doctor.hasSpecialty ? `Especialista en ${doctor.specialty}` : 'Médico General'}
      </td>
      <td className="px-4 py-2">
        <button
          onClick={() => onEdit(doctor)}
          className="custom-button text-sm px-3 py-1.5 mr-2 bg-blue-600 hover:bg-blue-700"
        >
          Editar
        </button>
        <button
          onClick={() => onDelete(doctor.id!)}
          className="custom-button text-sm px-3 py-1.5 bg-red-600 hover:bg-red-700"
        >
          Eliminar
        </button>
      </td>
    </tr>
  );

  return (
    <div className="doctor-list-container">
      <h2 className="text-2xl font-bold mb-6">Lista de Médicos por Grupos</h2>

      {/* Urgencias */}
      <div className="mb-8">
        <h3 className="text-xl font-bold mb-3 text-red-600 bg-red-50 p-3 rounded-lg">
          🚨 Urgencias ({groupedDoctors.urgencias.length} médicos)
        </h3>
        {groupedDoctors.urgencias.length > 0 ? (
          <div className="overflow-x-auto mb-4">
            <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-sm">
              <thead className="bg-red-100">
                <tr>
                  <th className="px-4 py-2 text-left">Nombre</th>
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Tipo</th>
                  <th className="px-4 py-2 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>{groupedDoctors.urgencias.map(renderDoctorRow)}</tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 italic ml-4">No hay médicos asignados a urgencias</p>
        )}
      </div>

      {/* Hospitalización */}
      <div className="mb-8">
        <h3 className="text-xl font-bold mb-3 text-blue-600 bg-blue-50 p-3 rounded-lg">
          🏥 Hospitalización ({groupedDoctors.hospitalización.length} médicos)
        </h3>
        {groupedDoctors.hospitalización.length > 0 ? (
          <div className="ml-4">
            {Object.entries(hospitalizationBySpecialty).map(([specialty, docs]) => (
              <div key={specialty} className="mb-6">
                <h4 className="text-lg font-semibold mb-2 text-blue-700 bg-blue-25 p-2 rounded border-l-4 border-blue-400">
                  📋 {specialty} ({docs.length} médicos)
                </h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-sm">
                    <thead className="bg-blue-100">
                      <tr>
                        <th className="px-4 py-2 text-left">Nombre</th>
                        <th className="px-4 py-2 text-left">ID</th>
                        <th className="px-4 py-2 text-left">Email</th>
                        <th className="px-4 py-2 text-left">Tipo</th>
                        <th className="px-4 py-2 text-left">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>{docs.map(renderDoctorRow)}</tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic ml-4">No hay médicos asignados a hospitalización</p>
        )}
      </div>

      {/* Resumen total */}
      <div className="bg-gray-100 p-4 rounded-lg">
        <h4 className="font-bold text-gray-800 mb-2">📊 Resumen Total</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <span className="block text-2xl font-bold text-red-600">
              {groupedDoctors.urgencias.length}
            </span>
            <span className="text-sm text-gray-600">Urgencias</span>
          </div>
          <div className="text-center">
            <span className="block text-2xl font-bold text-blue-600">
              {groupedDoctors.hospitalización.length}
            </span>
            <span className="text-sm text-gray-600">Hospitalización</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorsList
