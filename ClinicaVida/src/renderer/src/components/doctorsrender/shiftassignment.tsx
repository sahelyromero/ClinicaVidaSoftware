// ShiftAssignment.tsx
import React from 'react';

export interface ShiftAssignment {
  doctorId: string;
  doctorName: string;
  shiftType: 'C6' | 'C8' | 'C12';
  dayOfWeek: string;
  assigned: boolean;
}

interface ShiftAssignmentProps {
  shiftAssignments: ShiftAssignment[];
  onGenerate: () => void;
}

const ShiftAssignment: React.FC<ShiftAssignmentProps> = ({
  shiftAssignments,
  onGenerate
}) => {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Asignar Turnos</h2>

      <div className="mb-4">
        <button
          onClick={onGenerate}
          className="custom-button bg-green-600 hover:bg-green-700"
        >
          Generar Cuadro de Turnos
        </button>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
        <p className="text-blue-800">
          <strong>Instrucciones:</strong> Presiona "Generar Cuadro de Turnos" para ver el calendario de turnos en una ventana emergente. Recuerda que esto es una versión beta
          por lo que no se cumplen los requerimientos legales ni los de políticas internas.
        </p>
      </div>

      {shiftAssignments.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-bold mb-3">Asignaciones Generadas</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg overflow-hidden">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Médico</th>
                  <th className="px-4 py-2 text-left">Día</th>
                  <th className="px-4 py-2 text-left">Turno</th>
                  <th className="px-4 py-2 text-left">Estado</th>
                </tr>
              </thead>
              <tbody>
                {shiftAssignments.slice(0, 10).map((assignment, index) => (
                  <tr key={index} className="border-t border-gray-200">
                    <td className="px-4 py-2">{assignment.doctorName}</td>
                    <td className="px-4 py-2">{assignment.dayOfWeek}</td>
                    <td className="px-4 py-2">{assignment.shiftType}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        assignment.assigned
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {assignment.assigned ? 'Asignado' : 'Disponible'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {shiftAssignments.length > 10 && (
            <p className="text-gray-500 text-sm mt-2">
              Mostrando 10 de {shiftAssignments.length} asignaciones
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ShiftAssignment;
