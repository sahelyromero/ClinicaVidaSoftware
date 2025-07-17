// ShiftAssignment.tsx
import React, { useState } from 'react';

// Componente Modal de Éxito
interface SuccessModalProps {
  show: boolean
  onClose: () => void
}

const SuccessModal: React.FC<SuccessModalProps> = ({ show, onClose }) => {
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
          ¡Cuadro Generado!
        </h2>

        <p style={{
          color: '#16a34a',
          marginBottom: '32px',
          fontSize: '16px',
          lineHeight: '1.5'
        }}>
          El cuadro de turnos ha sido generado exitosamente cumpliendo con los requerimientos legales y políticas internas.
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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);

    // Ejecutar la función onGenerate que viene del componente padre
    await onGenerate();

    // Simular un pequeño delay para mostrar el estado de carga
    await new Promise(resolve => setTimeout(resolve, 500));

    setIsGenerating(false);
    setShowSuccessModal(true);
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Asignar Turnos</h2>

      <div className="mb-4">
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className={`custom-button ${
            isGenerating
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700'
          } flex items-center gap-2`}
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Generando...
            </>
          ) : (
            'Generar Cuadro de Turnos'
          )}
        </button>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
        <p className="text-blue-800">
          <strong>Instrucciones:</strong> Presiona "Generar Cuadro de Turnos" para ver el calendario de turnos en una ventana emergente.
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

      {/* Modal de éxito */}
      <SuccessModal
        show={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
      />
    </div>
  );
};

export default ShiftAssignment;
