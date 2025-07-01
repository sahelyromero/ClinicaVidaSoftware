import React from 'react';

interface CalendarModalProps {
  show: boolean;
  onClose: () => void;
}

const CalendarModal: React.FC<CalendarModalProps> = ({ show, onClose }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header del modal */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">Cuadro de Turnos</h3>
          <button
            className="text-gray-400 hover:text-gray-600 transition-colors"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenido del modal con scroll */}
        <div className="flex-1 overflow-auto p-4">
          <div className="min-w-full">
            {/* Aquí puedes insertar tu componente de calendario si lo deseas */}
            {/* <Calendario /> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarModal;
