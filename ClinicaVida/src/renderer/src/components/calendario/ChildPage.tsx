import React from 'react';
import Calendario from './calendario'; // ✅ ruta correcta si están en la misma carpeta

export default function ChildPage(): JSX.Element {
  const handleClose = () => {
    // Cierra la ventana emergente actual
    window.close();
  };

  return (
    <>
      <div className="min-h-screen bg-white p-6 overflow-y-auto max-h-screen">
        <h1 className="text-2xl font-bold text-indigo-700 mb-4">Calendario de Turnos</h1>
        <Calendario />
      </div>
       {/* Botón posicionado a la izquierda */}
        <div className="flex justify-start mb-4">
          <button
            onClick={handleClose}
            className="custom-button text-sm px-3 py-1.5"
          >
            Atrás
          </button>
        </div>
    </>
  );
}
