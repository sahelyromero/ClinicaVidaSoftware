import React from 'react';
import Calendario from './calendario'; // ✅ ruta correcta si están en la misma carpeta

export default function ChildPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-white p-6">
      <h1 className="text-2xl font-bold text-indigo-700 mb-4">Calendario de Turnos</h1>
      <Calendario />
    </div>
  );
}
