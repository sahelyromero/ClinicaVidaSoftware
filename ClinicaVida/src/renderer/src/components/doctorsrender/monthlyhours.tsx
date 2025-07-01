// MonthlyHours.tsx
import React from 'react';

export interface MonthlyHoursData {
  doctorId: string;
  doctorName: string;
  totalHours: number;
  availableHours: number;
  workingDays: number;
}

interface MonthlyHoursProps {
  selectedMonth: string;
  setSelectedMonth: (value: string) => void;
  calculateMonthlyHours: () => void;
  monthlyHours: MonthlyHoursData[];
  hasDoctors: boolean;
}

const MonthlyHours: React.FC<MonthlyHoursProps> = ({
  selectedMonth,
  setSelectedMonth,
  calculateMonthlyHours,
  monthlyHours,
  hasDoctors
}) => {
  const currentDate = new Date(`${selectedMonth}-01`);
  const formattedDate = currentDate.toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Horas Laborales Mensuales</h2>

      <div className="mb-6 flex items-center gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Seleccionar Mes:</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="input"
          />
        </div>
        <button
          onClick={calculateMonthlyHours}
          className="custom-button bg-blue-600 hover:bg-blue-700 mt-6"
        >
          Calcular Horas
        </button>
      </div>

      {monthlyHours.length > 0 ? (
        <>
          <h3 className="text-lg font-bold mb-3">
            Horas Mínimas para {formattedDate}
          </h3>

          <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <span className="block text-xl font-bold text-blue-600">
                  {monthlyHours[0].workingDays}
                </span>
                <span className="text-sm text-gray-600">Días Hábiles</span>
              </div>
              <div className="text-center">
                <span className="block text-3xl font-bold text-green-600">
                  {monthlyHours[0].totalHours}h
                </span>
                <span className="text-sm text-gray-600">Horas Mínimas</span>
              </div>
              <div className="text-center">
                <span className="block text-3xl font-bold text-purple-600">
                  {Math.round(monthlyHours[0].totalHours / monthlyHours[0].workingDays * 10) / 10}h
                </span>
                <span className="text-sm text-gray-600">Horas por Día</span>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
            <h4 className="font-bold text-yellow-800 mb-2">📋 Detalles del Cálculo</h4>
            <p className="text-yellow-700 text-sm">
              <strong>Fórmula aplicada:</strong> (Días del mes - Domingos - Festivos) × (44 horas/6 días)
            </p>
          </div>
        </>
      ) : hasDoctors ? (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <p className="text-yellow-800">
            <strong>Información:</strong> Selecciona un mes y presiona "Calcular Horas" para ver el análisis de horas laborales.
          </p>
        </div>
      ) : (
        <div className="bg-gray-50 border-l-4 border-gray-400 p-4 rounded">
          <p className="text-gray-600">
            <strong>Sin médicos:</strong> Primero debes agregar médicos al sistema para calcular las horas laborales.
          </p>
        </div>
      )}
    </div>
  );
};

export default MonthlyHours;
