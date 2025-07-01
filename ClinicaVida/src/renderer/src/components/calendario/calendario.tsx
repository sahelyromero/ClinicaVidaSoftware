import React, { useState, useEffect } from 'react';
import { asignarTurnosHospitalizacion } from './calendario-func'; // IMPORTACIÓN DE LA LÓGICA

// Tipos de la base de datos
interface Doctor {
  id?: number;
  name: string;
  idNumber: string;
  birthDate: string;
  hasSpecialty: boolean;
  specialty?: string;
  group?: 'urgencias' | 'hospitalización' | 'refuerzo';
  email?: string;
}

const DB_NAME = 'ClinicaVidaDB';
const DB_VERSION = 2;
const STORE_NAME = 'doctors';

let dbInstance: IDBDatabase | null = null;

const openDB = async (): Promise<IDBDatabase> => {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(request.result);
    };
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (db.objectStoreNames.contains(STORE_NAME)) {
        db.deleteObjectStore(STORE_NAME);
      }

      const store = db.createObjectStore(STORE_NAME, {
        keyPath: 'id',
        autoIncrement: true
      });

      store.createIndex('idNumber', 'idNumber', { unique: true });
      store.createIndex('name', 'name', { unique: false });
      store.createIndex('group', 'group', { unique: false });
      store.createIndex('hasSpecialty', 'hasSpecialty', { unique: false });
    };
  });
};

const getDoctors = async (): Promise<Doctor[]> => {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Tipos originales del calendario
type Turno = { [dia: number]: string };

type Medico = {
  nombre: string;
  especialidad: string;
  turnos: Turno;
  grupo?: 'hospitalización' | 'urgencias' | 'refuerzo';
};

const especialidadColor = (especialidad: string) => {
  const colores: { [key: string]: string } = {
    'Hematología': '#f8caca',
    'Medicina Interna': '#c8f8c8',
    'Oncología': '#c8e0f8',
    'DYCP': '#e5c8f8',
    'Cirugía': '#c8f8f2',
    'Urgencias': '#ffd4cc',
    'Hospitalización': '#d4f4dd',
    'Cardiología': '#e6f3ff',
    'Neurología': '#f0e6ff',
    'Pediatría': '#fff2cc'
  };
  return colores[especialidad] || '#f5f5f5';
};

const convertDoctorToMedico = (doctor: Doctor): Medico => {
  return {
    nombre: doctor.name,
    especialidad: doctor.specialty || doctor.group || 'General',
    turnos: {},
    grupo: doctor.group
  };
};

const Calendario: React.FC = () => {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayAbbreviations = ['D', 'L', 'M', 'Mi', 'J', 'V', 'S'];

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        setLoading(true);
        setError(null);

        const doctors = await getDoctors();
        const medicosFromDB = doctors.map(convertDoctorToMedico);

        if (medicosFromDB.length === 0) {
          const ejemploMedicos: Medico[] = [
            {
              nombre: 'Dr. Ejemplo',
              especialidad: 'General',
              turnos: { 1: 'C8', 15: 'C10' }
            }
          ];
          setMedicos(ejemploMedicos);
        } else {
          const medicosConTurnos = asignarTurnosHospitalizacion(
            medicosFromDB,
            selectedMonth,
            selectedYear
          );
          setMedicos(medicosConTurnos);
        }
      } catch (err) {
        console.error('Error al cargar médicos:', err);
        setError('Error al cargar los médicos de la base de datos');

        const ejemploMedicos: Medico[] = [
          {
            nombre: 'Error - Datos de ejemplo',
            especialidad: 'General',
            turnos: {}
          }
        ];
        setMedicos(ejemploMedicos);
      } finally {
        setLoading(false);
      }
    };

    loadDoctors();
  }, [selectedMonth, selectedYear]); // 👈 Dependencias para recalcular turnos al cambiar mes/año

  const getDaysInMonth = () => new Date(selectedYear, selectedMonth + 1, 0).getDate();

  const getDayAbbreviation = (day: number) => {
    const date = new Date(selectedYear, selectedMonth, day);
    return dayAbbreviations[date.getDay()];
  };

  const isWeekend = (day: number) => {
    const date = new Date(selectedYear, selectedMonth, day);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  };

  const diasMes = getDaysInMonth();
  const monthTitle = `${monthNames[selectedMonth]} ${selectedYear}`;

  const handleMonthChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMonth(parseInt(event.target.value));
  };

  const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(parseInt(event.target.value));
  };

  const generateYearOptions = () => {
    const years = [];
    for (let i = selectedYear - 5; i <= selectedYear + 5; i++) {
      years.push(i);
    }
    return years;
  };


  // Función para recargar médicos
  const reloadDoctors = async () => {
    try {
      setLoading(true);
      const doctors = await getDoctors();
      const medicosFromDB = doctors.map(convertDoctorToMedico);
      setMedicos(medicosFromDB);
      setError(null);
    } catch (err) {
      console.error('Error al recargar médicos:', err);
      setError('Error al recargar los médicos');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-auto p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-lg font-semibold mb-2">Cargando médicos...</div>
            <div className="text-gray-500">Conectando con la base de datos</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-4 calendar-container">
      <div className="mb-4 flex items-center gap-4 flex-wrap">
        <h2 className="text-xl font-semibold">Calendario de Turnos - {monthTitle}</h2>
        <div className="flex gap-2">
          <select value={selectedMonth} onChange={handleMonthChange} className="custom-select">
            {monthNames.map((month, index) => (
              <option key={index} value={index}>{month}</option>
            ))}
          </select>
          <select value={selectedYear} onChange={handleYearChange} className="custom-select">
            {generateYearOptions().map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <button
          onClick={reloadDoctors}
          className="custom-button"
          disabled={loading}
        >
          {loading ? 'Cargando...' : 'Recargar'}
        </button>        
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-700">
          {error}
        </div>
      )}

      <div className="mb-4 text-sm text-gray-600">
        <p>Días en {monthNames[selectedMonth].toLowerCase()}: <strong>{diasMes}</strong></p>
        <p>Médicos registrados: <strong>{medicos.length}</strong></p>
        {medicos.length === 0 && (
          <p className="text-amber-600 mt-2">
            No hay médicos registrados en la base de datos. Agrega médicos para verlos en el calendario.
          </p>
        )}
      </div>

      <div className="border rounded-lg overflow-auto">
        <table className="min-w-full text-sm" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr className="sticky top-0 z-10" style={{ backgroundColor: '#e5e7eb' }}>
              <th className="border px-2 sticky left-0 z-20" style={{ backgroundColor: '#e5e7eb', borderColor: '#374151' }}>#</th>
              <th className="border px-2 sticky left-8 z-20" style={{ backgroundColor: '#e5e7eb', borderColor: '#374151' }}>Nombre</th>
              <th className="border px-2 sticky left-32 z-20" style={{ backgroundColor: '#e5e7eb', borderColor: '#374151' }}>Especialidad</th>
              {[...Array(diasMes)].map((_, i) => {
                const day = i + 1;
                const dayAbb = getDayAbbreviation(day);
                const weekend = isWeekend(day);
                return (
                  <th key={day} className="border px-1 py-1 sticky top-0 z-10 min-w-[40px]" style={{
                    backgroundColor: '#e5e7eb',
                    borderColor: '#374151',
                    borderWidth: '1px'
                  }}>
                    <div className="flex flex-col items-center justify-center">
                      <div className={`text-xs leading-tight ${weekend ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>{dayAbb}</div>
                      <div className={`text-sm font-semibold leading-tight ${weekend ? 'text-red-600' : 'text-gray-800'}`}>{day}</div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {medicos.length === 0 ? (
              <tr>
                <td colSpan={diasMes + 3} className="border px-4 py-8 text-center text-gray-500">
                  No hay médicos registrados en la base de datos
                </td>
              </tr>
            ) : (
              medicos.map((medico, index) => (
                <tr key={index}>
                  <td className="border px-2 sticky left-0 z-10 font-semibold" style={{ backgroundColor: '#ffffff', borderColor: '#374151' }}>{index + 1}</td>
                  <td className="border px-2 sticky left-8 z-10 font-medium" style={{ backgroundColor: '#ffffff', borderColor: '#374151' }}>{medico.nombre}</td>
                  <td className="border px-2 sticky left-32 z-10 text-xs" style={{
                    backgroundColor: especialidadColor(medico.especialidad),
                    borderColor: '#374151'
                  }}>
                    {medico.especialidad.charAt(0).toUpperCase() + medico.especialidad.slice(1)}
                  </td>
                  {[...Array(diasMes)].map((_, d) => {
                    const day = d + 1;
                    const turno = medico.turnos[day];
                    const weekend = isWeekend(day);
                    return (
                      <td key={day} className="border text-center px-1" style={{
                        backgroundColor: '#ffffff',
                        borderColor: '#374151',
                        borderWidth: '1px'
                      }}>
                        <span className="text-xs font-semibold calendar-turno" style={{
                          color: turno ? (weekend ? '#dc2626' : '#1d4ed8') : '#000000'
                        }}>
                          {turno || ''}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Calendario;
