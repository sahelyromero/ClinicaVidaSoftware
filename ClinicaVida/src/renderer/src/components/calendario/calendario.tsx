import React from 'react';

type Turno = {
  [dia: number]: string; // ej. { 1: "C8", 2: "C10", ... }
};

type Medico = {
  nombre: string;
  especialidad: string;
  turnos: Turno;
};

const medicos: Medico[] = [
  {
    nombre: 'Miguel Campos',
    especialidad: 'Hematología',
    turnos: { 1: 'C8', 2: 'C8', 10: 'C10', 27: 'C8', 30: 'C10' }
  },
  {
    nombre: 'Andrea Pinto',
    especialidad: 'Hematología',
    turnos: { 2: 'C10', 3: 'C10', 9: 'C10', 16: 'C10' }
  },
  {
    nombre: 'Yandry Pedroza',
    especialidad: 'Medicina Interna',
    turnos: { 2: 'C8', 5: 'C4', 10: 'C10', 17: 'C10' }
  },
  {
    nombre: 'Yandry Pedroza',
    especialidad: 'Medicina Interna',
    turnos: { 2: 'C8', 5: 'C4', 10: 'C10', 17: 'C10' }
  },
    {
    nombre: 'Yandry Pedroza',
    especialidad: 'Medicina Interna',
    turnos: { 2: 'C8', 5: 'C4', 10: 'C10', 17: 'C10' }
  },
    {
    nombre: 'Yandry Pedroza',
    especialidad: 'Medicina Interna',
    turnos: { 2: 'C8', 5: 'C4', 10: 'C10', 17: 'C10' }
  }
  // Puedes agregar más médicos aquí...
];

const especialidadColor = (especialidad: string) => {
  const colores: { [key: string]: string } = {
    'Hematología': '#f8caca',
    'Medicina Interna': '#c8f8c8',
    'Oncología': '#c8e0f8',
    'DYCP': '#e5c8f8',
    'Cirugía': '#c8f8f2'
  };
  return colores[especialidad] || '#ffffff';
};






const Calendario: React.FC = () => {


  const diasMes = 30;

  return (
    <div className="flex-1 overflow-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Calendario de Turnos - Julio 2025</h2>

      {/* Contenedor con scroll both (horizontal y vertical) */}
      <div
        className="border rounded-lg overflow-auto"
      >
        <table className="min-w-full border border-gray-300 text-sm overflow-auto">
          <thead>
            <tr className="bg-gray-200 sticky top-0 z-10">
              <th className="border px-2" scope="col">#</th>
              <th className="border px-2" scope="col">Nombre</th>
              <th className="border px-2" scope="col">Especialidad</th>
              {[...Array(diasMes)].map((_, i) => (
                <th
                  key={i + 1}
                  className="border px-1 sticky top-0 bg-gray-200"
                  scope="col"
                >
                  {i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {medicos.map((medico, index) => (
              <tr
                key={index}
                style={{ backgroundColor: especialidadColor(medico.especialidad) }}
              >
                <td className="border px-2">{index + 1}</td>
                <td className="border px-2">{medico.nombre}</td>
                <td className="border px-2">Médico soporte - {medico.especialidad}</td>
                {[...Array(diasMes)].map((_, d) => (
                  <td key={d + 1} className="border text-center px-1">
                    {medico.turnos[d + 1] || ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Calendario;
