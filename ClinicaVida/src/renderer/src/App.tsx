import { useState, useEffect } from "react";
import Icon from "./assets/icon.png";
import { openDB, addDoctor, getDoctors, updateDoctor, deleteDoctor, Doctor } from "./database/db";
import './App.css';
import Calendario from "./components/calendario/calendario";
import ChildPage from "./components/calendario/ChildPage";
import Ap from "./components/calendario/Ap";


declare global {
    interface Window {
        electronAPI: { openChildWindow: () => void };
    }
    }

// Tipos para las nuevas funcionalidades
interface LegalRequirement {
    id: string;
    title: string;
    description: string;
    type: 'law' | 'regulation';
}

interface InternalPolicy {
    id: string;
    title: string;
    description: string;
    category: 'schedules' | 'groups' | 'specialties';
}

interface MonthlyHours {
    doctorId: string;
    doctorName: string;
    totalHours: number;
    availableHours: number;
    workingDays: number;
}

interface ShiftAssignment {
    doctorId: string;
    doctorName: string;
    shiftType: 'C6' | 'C8' | 'C12';
    dayOfWeek: string;
    assigned: boolean;
}

const App = () => {
    const [activeTab, setActiveTab] = useState<string>('dashboard');
    const [doctorData, setDoctorData] = useState<Omit<Doctor, 'id'>>({
        name: '',
        idNumber: '',
        birthDate: '',
        hasSpecialty: false,
        specialty: '',
        group: 'urgencias', // Añadido grupo por defecto
        email: '' // Añadido email
    });
    const [showSpecialtyField, setShowSpecialtyField] = useState<boolean>(false);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [currentDoctorId, setCurrentDoctorId] = useState<number | null>(null);

    // Estados para las nuevas funcionalidades
    const [monthlyHours, setMonthlyHours] = useState<MonthlyHours[]>([]);
    const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
    const [shiftAssignments, setShiftAssignments] = useState<ShiftAssignment[]>([]);

    // Estado para controlar el modal del calendario
    const [showCalendarModal, setShowCalendarModal] = useState<boolean>(false);

    // Datos estáticos para requerimientos legales
    const legalRequirements: LegalRequirement[] = [
    {
        id: '1', // Cambiar de ' ' a '1'
        title: 'Jornada Laboral Máxima',
        description: 'Máximo 60 horas semanales de trabajo según legislación colombiana',
        type: 'law'
    },
    {
        id: '2', // Cambiar de ' ' a '2'
        title: 'Descanso Post Turno Nocturno',
        description: 'Derecho a descanso después de turno nocturno',
        type: 'law'
    },
    {
        id: '3', // Cambiar de ' ' a '3'
        title: 'Días Festivos y Domingos',
        description: 'Aplicar fórmula: (días del mes - (4+n)) * (44/6) para cálculo de horas',
        type: 'regulation'
    }
];

    // Datos estáticos para políticas internas
    const internalPolicies: InternalPolicy[] = [
    {
        id: '1', // Cambiar de ' ' a '1'
        title: 'Turnos por Especialidad',
        description: 'Médicos especializados solo pueden tomar turnos C8, médicos de refuerzo solo C6',
        category: 'specialties'
    },
    {
        id: '2', // Cambiar de ' ' a '2'
        title: 'Grupos de Trabajo',
        description: 'Solo puede pertenecer a un grupo principal: urgencias, hospitalización o refuerzo',
        category: 'groups'
    },
    {
        id: '3', // Cambiar de '' a '3'
        title: 'Especialidades Requeridas',
        description: 'Para Oncología, Hemato-oncología, Medicina interna, Dolor y cuidados paliativos, Cirugía oncológica, Cirugía de tórax, Cirugía hepatobiliar',
        category: 'specialties'
    }
];

    // Inicializar la base de datos y cargar médicos
    useEffect(() => {
        const initializeDB = async () => {
            await openDB();
            await loadDoctors();
        };
        initializeDB();
    }, []);

    const loadDoctors = async () => {
        const doctorsList = await getDoctors();
        setDoctors(doctorsList);
    };

    const handleNavClick = (tab: string) => {
        setActiveTab(tab);
        resetForm();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setDoctorData({
            ...doctorData,
            [name]: type === 'checkbox' ? checked : value
        });

        if (name === 'hasSpecialty') {
            setShowSpecialtyField(checked);
            if (!checked) {
                setDoctorData(prev => ({ ...prev, specialty: '' }));
            }
        }
    };

    const validateDoctorData = (data: Omit<Doctor, 'id'>): string[] => {
        const errors: string[] = [];

        // Validar grupo principal
        if (!['urgencias', 'hospitalización', 'refuerzo'].includes(data.group || '')) {
            errors.push('Debe seleccionar un grupo válido (urgencias, hospitalización o refuerzo)');
        }

        // Validar especialidades para hospitalización
        if (data.group === 'hospitalización' && data.hasSpecialty) {
            const validSpecialties = ['oncología', 'hemato-oncología', 'medicina interna'];
            if (!validSpecialties.some(spec => data.specialty?.toLowerCase().includes(spec))) {
                errors.push('Para hospitalización, la especialidad debe ser oncología, hemato-oncología o medicina interna');
            }
        }

        return errors;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const validationErrors = validateDoctorData(doctorData);
        if (validationErrors.length > 0) {
            alert('Errores de validación:\n' + validationErrors.join('\n'));
            return;
        }

        if (isEditing && currentDoctorId) {
            await updateDoctor({ id: currentDoctorId, ...doctorData });
        } else {
            await addDoctor(doctorData);
        }

        resetForm();
        await loadDoctors();
    };

    const resetForm = () => {
        setDoctorData({
            name: '',
            idNumber: '',
            birthDate: '',
            hasSpecialty: false,
            specialty: '',
            group: 'urgencias',
            email: ''
        });
        setShowSpecialtyField(false);
        setIsEditing(false);
        setCurrentDoctorId(null);
    };

    const handleEdit = (doctor: Doctor) => {
        setDoctorData({
            name: doctor.name,
            idNumber: doctor.idNumber,
            birthDate: doctor.birthDate,
            hasSpecialty: doctor.hasSpecialty,
            specialty: doctor.specialty || '',
            group: doctor.group || 'urgencias',
            email: doctor.email || ''
        });
        setShowSpecialtyField(doctor.hasSpecialty);
        setIsEditing(true);
        setCurrentDoctorId(doctor.id!);
        setActiveTab('addDoctor');
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este médico?')) {
            await deleteDoctor(id);
            await loadDoctors();
        }
    };

    const calculateMonthlyHours = () => {
        const [year, month] = selectedMonth.split('-').map(Number);
        const daysInMonth = new Date(year, month, 0).getDate();
        const sundays = Math.floor(daysInMonth / 7) + (new Date(year, month - 1, 1).getDay() === 0 ? 1 : 0);
        const holidays = 2; // Estimado de días festivos por mes

        const calculations = doctors.map(doctor => {
            const workingDays = daysInMonth - sundays - holidays;
            const totalHours = workingDays * (44 / 6); // 44 horas semanales / 6 días

            return {
                doctorId: doctor.idNumber,
                doctorName: doctor.name,
                totalHours: Math.round(totalHours),
                availableHours: Math.round(totalHours * 0.9), // 90% disponible
                workingDays
            };
        });

        setMonthlyHours(calculations);
    };

    const generateShiftAssignments = () => {
        const weekdays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
        const assignments: ShiftAssignment[] = [];

        doctors.forEach(doctor => {
            weekdays.forEach(day => {
                let shiftType: 'C6' | 'C8' | 'C12' = 'C8';

                // Aplicar reglas de negocio
                if (doctor.group === 'refuerzo') {
                    shiftType = 'C6';
                } else if (doctor.hasSpecialty) {
                    shiftType = 'C8';
                }

                assignments.push({
                    doctorId: doctor.idNumber,
                    doctorName: doctor.name,
                    shiftType,
                    dayOfWeek: day,
                    assigned: Math.random() > 0.3 // 70% probabilidad de asignación
                });
            });
        });

        setShiftAssignments(assignments);
    };

    // Función para abrir el modal del calendario
    const handleOpenCalendarModal = () => {
        setShowCalendarModal(true);
    };

    // Función para cerrar el modal del calendario
    const handleCloseCalendarModal = () => {
        setShowCalendarModal(false);
    };


    const CalendarModal = () => {
    if (!showCalendarModal) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
                {/* Header del modal */}
                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900">Cuadro de Turnos</h3>
                    <button
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Contenido del modal con scroll */}
                <div className="flex-1 overflow-auto p-4">
                    <div className="min-w-full">

                    </div>
                </div>
            </div>
        </div>
    );
};



    const renderAddDoctor = () => (
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
                        <option value="refuerzo">Refuerzo</option>
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

    const renderDoctorsList = () => {
    // Agrupar médicos por grupo principal
        const groupedDoctors = {
            urgencias: doctors.filter(d => d.group === 'urgencias'),
            hospitalización: doctors.filter(d => d.group === 'hospitalización'),
            refuerzo: doctors.filter(d => d.group === 'refuerzo')
        };

        // Subgrupar médicos de hospitalización por especialidad
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
                    {doctor.hasSpecialty
                        ? `Especialista en ${doctor.specialty}`
                        : 'Médico General'}
                </td>
                <td className="px-4 py-2">
                    <button
                        onClick={() => handleEdit(doctor)}
                        className="custom-button text-sm px-3 py-1.5 mr-2 bg-blue-600 hover:bg-blue-700"
                    >
                        Editar
                    </button>
                    <button
                        onClick={() => handleDelete(doctor.id!)}
                        className="custom-button text-sm px-3 py-1.5 bg-red-600 hover:bg-red-700"
                    >
                        Eliminar
                    </button>
                </td>
            </tr>
        );

        return (
            <div className="p-4">
                <h2 className="text-2xl font-bold mb-6">Lista de Médicos por Grupos</h2>

                {/* Grupo Urgencias */}
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
                                <tbody>
                                    {groupedDoctors.urgencias.map(renderDoctorRow)}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-500 italic ml-4">No hay médicos asignados a urgencias</p>
                    )}
                </div>

                {/* Grupo Hospitalización con subgrupos por especialidad */}
                <div className="mb-8">
                    <h3 className="text-xl font-bold mb-3 text-blue-600 bg-blue-50 p-3 rounded-lg">
                        🏥 Hospitalización ({groupedDoctors.hospitalización.length} médicos)
                    </h3>
                    {groupedDoctors.hospitalización.length > 0 ? (
                        <div className="ml-4">
                            {Object.entries(hospitalizationBySpecialty).map(([specialty, doctors]) => (
                                <div key={specialty} className="mb-6">
                                    <h4 className="text-lg font-semibold mb-2 text-blue-700 bg-blue-25 p-2 rounded border-l-4 border-blue-400">
                                        📋 {specialty} ({doctors.length} médicos)
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
                                            <tbody>
                                                {doctors.map(renderDoctorRow)}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 italic ml-4">No hay médicos asignados a hospitalización</p>
                    )}
                </div>

                {/* Grupo Refuerzo */}
                <div className="mb-8">
                    <h3 className="text-xl font-bold mb-3 text-green-600 bg-green-50 p-3 rounded-lg">
                        💪 Refuerzo ({groupedDoctors.refuerzo.length} médicos)
                    </h3>
                    {groupedDoctors.refuerzo.length > 0 ? (
                        <div className="overflow-x-auto mb-4">
                            <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-sm">
                                <thead className="bg-green-100">
                                    <tr>
                                        <th className="px-4 py-2 text-left">Nombre</th>
                                        <th className="px-4 py-2 text-left">ID</th>
                                        <th className="px-4 py-2 text-left">Email</th>
                                        <th className="px-4 py-2 text-left">Tipo</th>
                                        <th className="px-4 py-2 text-left">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {groupedDoctors.refuerzo.map(renderDoctorRow)}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-500 italic ml-4">No hay médicos asignados a refuerzo</p>
                    )}
                </div>

                {/* Resumen total */}
                <div className="bg-gray-100 p-4 rounded-lg">
                    <h4 className="font-bold text-gray-800 mb-2">📊 Resumen Total</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                            <span className="block text-2xl font-bold text-red-600">{groupedDoctors.urgencias.length}</span>
                            <span className="text-sm text-gray-600">Urgencias</span>
                        </div>
                        <div className="text-center">
                            <span className="block text-2xl font-bold text-blue-600">{groupedDoctors.hospitalización.length}</span>
                            <span className="text-sm text-gray-600">Hospitalización</span>
                        </div>
                        <div className="text-center">
                            <span className="block text-2xl font-bold text-green-600">{groupedDoctors.refuerzo.length}</span>
                            <span className="text-sm text-gray-600">Refuerzo</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderShiftAssignment = () => (
    <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">Asignar Turnos</h2>
        <div className="mb-4">
            <button
                onClick={() => window.electronAPI.openChildWindow()}
                className="custom-button bg-green-600 hover:bg-green-700"
            >
                Generar Cuadro de Turnos
            </button>
        </div>

        {/* Información adicional */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
            <p className="text-blue-800">
                <strong>Instrucciones:</strong> Presiona "Generar Cuadro de Turnos" para ver el calendario de turnos en una ventana emergente.
            </p>
        </div>

        {/* Mostrar las asignaciones solo si existen y NO estamos en modal */}
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

const renderLegalRequirements = () => (
    <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">Requerimientos Legales</h2>
        <div className="space-y-4">
            {legalRequirements.map((requirement) => (
                <div key={requirement.id} className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                    <div className="flex items-center mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            requirement.type === 'law'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                        }`}>
                            {requirement.type === 'law' ? 'LEY' : 'REGULACIÓN'}
                        </span>
                        <h3 className="text-lg font-bold text-blue-800 ml-3">{requirement.title}</h3>
                    </div>
                    <p className="text-blue-700">{requirement.description}</p>
                </div>
            ))}
        </div>

        <div className="mt-6 bg-gray-100 p-4 rounded-lg">
            <h4 className="font-bold text-gray-800 mb-2">📋 Resumen de Cumplimiento</h4>
            <p className="text-sm text-gray-600">
                Estos requerimientos deben ser considerados al momento de asignar turnos y calcular horas laborales.
            </p>
        </div>
    </div>
);

const renderInternalPolicies = () => (
    <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">Políticas Internas</h2>
        <div className="space-y-4">
            {internalPolicies.map((policy) => (
                <div key={policy.id} className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
                    <div className="flex items-center mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            policy.category === 'schedules'
                                ? 'bg-blue-100 text-blue-800'
                                : policy.category === 'groups'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-orange-100 text-orange-800'
                        }`}>
                            {policy.category === 'schedules' && 'HORARIOS'}
                            {policy.category === 'groups' && 'GRUPOS'}
                            {policy.category === 'specialties' && 'ESPECIALIDADES'}
                        </span>
                        <h3 className="text-lg font-bold text-green-800 ml-3">{policy.title}</h3>
                    </div>
                    <p className="text-green-700">{policy.description}</p>
                </div>
            ))}
        </div>

        <div className="mt-6 bg-gray-100 p-4 rounded-lg">
            <h4 className="font-bold text-gray-800 mb-2">⚙️ Configuración Actual</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                <div className="text-center">
                    <span className="block text-xl font-bold text-purple-600">3</span>
                    <span className="text-sm text-gray-600">Grupos Principales</span>
                </div>
                <div className="text-center">
                    <span className="block text-xl font-bold text-orange-600">7</span>
                    <span className="text-sm text-gray-600">Especialidades</span>
                </div>
                <div className="text-center">
                    <span className="block text-xl font-bold text-blue-600">3</span>
                    <span className="text-sm text-gray-600">Tipos de Turno</span>
                </div>
            </div>
        </div>
    </div>
);

const renderMonthlyHours = () => (
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

        {monthlyHours.length > 0 && (
            <div>
                <h3 className="text-lg font-bold mb-3">
                    Cálculo para {new Date(selectedMonth + '-01').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                </h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-4 py-2 text-left">Médico</th>
                                <th className="px-4 py-2 text-left">ID</th>
                                <th className="px-4 py-2 text-left">Días Laborales</th>
                                <th className="px-4 py-2 text-left">Horas Totales</th>
                                <th className="px-4 py-2 text-left">Horas Disponibles</th>
                                <th className="px-4 py-2 text-left">Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {monthlyHours.map((hours, index) => (
                                <tr key={index} className="border-t border-gray-200 hover:bg-gray-50">
                                    <td className="px-4 py-2">{hours.doctorName}</td>
                                    <td className="px-4 py-2">{hours.doctorId}</td>
                                    <td className="px-4 py-2">{hours.workingDays}</td>
                                    <td className="px-4 py-2 font-semibold">{hours.totalHours}h</td>
                                    <td className="px-4 py-2 text-green-600 font-semibold">{hours.availableHours}h</td>
                                    <td className="px-4 py-2">
                                        <span className={`px-2 py-1 rounded text-xs ${
                                            hours.availableHours >= 160
                                                ? 'bg-green-100 text-green-800'
                                                : hours.availableHours >= 120
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : 'bg-red-100 text-red-800'
                                        }`}>
                                            {hours.availableHours >= 160 ? 'Óptimo' :
                                             hours.availableHours >= 120 ? 'Moderado' : 'Bajo'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-6 bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-bold text-blue-800 mb-2">📊 Resumen del Mes</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <span className="block text-xl font-bold text-blue-600">
                                {monthlyHours.reduce((sum, h) => sum + h.totalHours, 0)}h
                            </span>
                            <span className="text-sm text-gray-600">Total Horas</span>
                        </div>
                        <div className="text-center">
                            <span className="block text-xl font-bold text-green-600">
                                {monthlyHours.reduce((sum, h) => sum + h.availableHours, 0)}h
                            </span>
                            <span className="text-sm text-gray-600">Horas Disponibles</span>
                        </div>
                        <div className="text-center">
                            <span className="block text-xl font-bold text-purple-600">
                                {monthlyHours.reduce((sum, h) => sum + h.workingDays, 0)}
                            </span>
                            <span className="text-sm text-gray-600">Días Laborales Total</span>
                        </div>
                        <div className="text-center">
                            <span className="block text-xl font-bold text-orange-600">
                                {Math.round(monthlyHours.reduce((sum, h) => sum + h.availableHours, 0) / monthlyHours.length)}h
                            </span>
                            <span className="text-sm text-gray-600">Promedio por Médico</span>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {monthlyHours.length === 0 && doctors.length > 0 && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                <p className="text-yellow-800">
                    <strong>Información:</strong> Selecciona un mes y presiona "Calcular Horas" para ver el análisis de horas laborales.
                </p>
            </div>
        )}

        {doctors.length === 0 && (
            <div className="bg-gray-50 border-l-4 border-gray-400 p-4 rounded">
                <p className="text-gray-600">
                    <strong>Sin médicos:</strong> Primero debes agregar médicos al sistema para calcular las horas laborales.
                </p>
            </div>
        )}
    </div>
);

    const renderContent = () => {
        switch (activeTab) {
            case 'addDoctor':
                return renderAddDoctor();
            case 'doctorsList':
                return renderDoctorsList();
            case 'legal':
                return renderLegalRequirements();
            case 'policies':
                return renderInternalPolicies();
            case 'hours':
                return renderMonthlyHours();
            case 'assign':
                return renderShiftAssignment();
            default:
                return (
                    <div className="p-4 text-center">
                        <h2 className="text-2xl font-bold mb-4">Panel de Control</h2>
                        <p className="mb-6">Sistema de Gestión de Turnos Médicos - Clínica Vida</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
                            <div className="bg-blue-100 p-4 rounded-lg">
                                <h3 className="font-bold text-blue-800">Médicos Registrados</h3>
                                <p className="text-2xl font-bold text-blue-600">{doctors.length}</p>
                            </div>
                            <div className="bg-green-100 p-4 rounded-lg">
                                <h3 className="font-bold text-green-800">Especialistas</h3>
                                <p className="text-2xl font-bold text-green-600">
                                    {doctors.filter(d => d.hasSpecialty).length}
                                </p>
                            </div>
                            <div className="bg-purple-100 p-4 rounded-lg">
                                <h3 className="font-bold text-purple-800">Médicos Generales</h3>
                                <p className="text-2xl font-bold text-purple-600">
                                    {doctors.filter(d => !d.hasSpecialty).length}
                                </p>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#f9eef5] font-lato text-[#9280b6]">
            <div className="container mx-auto px-4 flex-grow">
                <div className="flex justify-center mt-6 mb-8">
                    <img width="200px" height="200px" src={Icon} alt="Logo" className="rounded-full shadow-lg" />
                </div>

                <header className="bg-[#22335d] text-[#9280b6] p-4 rounded-lg shadow-lg mb-8">
                    <h1 className="text-xl font-bold text-center mb-4">Organizador de Turnos Médicos</h1>
                    <nav className="flex flex-wrap justify-center gap-3">
                        <button
                            onClick={() => handleNavClick('dashboard')}
                            className={`custom-button text-sm px-3 py-1.5 m-1 ${activeTab === 'dashboard' ? 'active-button' : ''}`}
                        >
                            Dashboard
                        </button>
                        <button
                            onClick={() => handleNavClick('addDoctor')}
                            className={`custom-button text-sm px-3 py-1.5 m-1 ${activeTab === 'addDoctor' ? 'active-button' : ''}`}
                        >
                            Agregar Médico
                        </button>
                        <button
                            onClick={() => handleNavClick('doctorsList')}
                            className={`custom-button text-sm px-3 py-1.5 m-1 ${activeTab === 'doctorsList' ? 'active-button' : ''}`}
                        >
                            Lista de Médicos
                        </button>
                        <button
                            onClick={() => handleNavClick('legal')}
                            className={`custom-button text-sm px-3 py-1.5 m-1 ${activeTab === 'legal' ? 'active-button' : ''}`}
                        >
                            Requerimientos Legales
                        </button>
                        <button
                            onClick={() => handleNavClick('policies')}
                            className={`custom-button text-sm px-3 py-1.5 m-1 ${activeTab === 'policies' ? 'active-button' : ''}`}
                        >
                            Políticas Internas
                        </button>
                        <button
                            onClick={() => handleNavClick('hours')}
                            className={`custom-button text-sm px-3 py-1.5 m-1 ${activeTab === 'hours' ? 'active-button' : ''}`}
                        >
                            Horas Laborales
                        </button>
                        <button
                            onClick={() => handleNavClick('assign')}
                            className={`custom-button text-sm px-3 py-1.5 m-1 ${activeTab === 'assign' ? 'active-button' : ''}`}
                        >
                            Asignar Turnos
                        </button>
                    </nav>
                </header>

                <main className="main-content bg-white rounded-xl shadow-md p-6 mb-8">
                    {renderContent()}
                </main>
            </div>

            <footer className="bg-[#22335d] text-[#9280b6] text-center p-4 mt-auto">
                <p className="text-sm">© {new Date().getFullYear()} Grupo 2.1 - Ingeniería de Software 2025-1 - Universidad Nacional de Colombia Sede Medellín</p>
            </footer>

            {/* Modal del calendario */}
            <CalendarModal />
        </div>
    );
};

export default App;

