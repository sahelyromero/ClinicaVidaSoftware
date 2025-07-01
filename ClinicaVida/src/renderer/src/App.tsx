import { useState, useEffect } from "react";
import Icon from "./assets/icon.png";
import { openDB, addDoctor, getDoctors, updateDoctor, deleteDoctor, Doctor } from "./database/db";
import './App.css';
import DoctorForm from './components/doctorsrender/doctorform';
import DoctorsList from './components/doctorsrender/doctorslist';
import LegalRequirements, {LegalRequirement} from './components/doctorsrender/legalrequirements';
import InternalPolicies, { InternalPolicy } from './components/doctorsrender/internalpolicies';
import MonthlyHours, { MonthlyHoursData } from './components/doctorsrender/monthlyhours';
import ShiftAssignment, { ShiftAssignment as ShiftAssignmentType } from './components/doctorsrender/shiftassignment';
import Calendario from "./components/calendario/calendario";
import ChildPage from "./components/calendario/ChildPage";
import Ap from "./components/calendario/Ap";

declare global {
    interface Window {
        electronAPI: { openChildWindow: () => void };
    }
    }

// Tipos para las nuevas funcionalidades
const legalRequirements: LegalRequirement[] = [
  {
    id: '1',
    title: 'Jornada Laboral Máxima',
    description: 'Máximo 60 horas semanales de trabajo según legislación colombiana',
    type: 'law',
  },
  {
    id: '2',
    title: 'Descanso Post Turno Nocturno',
    description: 'Derecho a descanso después de turno nocturno',
    type: 'law',
  },
  {
    id: '3',
    title: 'Días Festivos y Domingos',
    description: 'Aplicar fórmula: (días del mes - (4+n)) * (44/6) para cálculo de horas',
    type: 'regulation',
  }
];

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
        group: 'hospitalización', // Añadido grupo por defecto
        email: '' // Añadido email
    });
    const [showSpecialtyField, setShowSpecialtyField] = useState<boolean>(false);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [currentDoctorId, setCurrentDoctorId] = useState<number | null>(null);

    // Estados para las nuevas funcionalidades
    const [monthlyHours, setMonthlyHours] = useState<MonthlyHoursData[]>([]);
    const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
    const [shiftAssignments, setShiftAssignments] = useState<ShiftAssignmentType[]>([]);

    // Estado para controlar el modal del calendario
    const [showCalendarModal, setShowCalendarModal] = useState<boolean>(false);

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
        description: 'Solo puede pertenecer a un grupo principal: urgencias u hospitalización. Refuerzo es una especialidad dentro de hospitalización',
        category: 'groups'
    },
    {
        id: '3', // Cambiar de '' a '3'
        title: 'Especialidades Requeridas',
        description: 'Para Oncología, Hemato-oncología, Medicina interna, Dolor y cuidados paliativos, Cirugía oncológica, Cirugía de tórax, Cirugía hepatobiliar y Refuerzo',
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
    if (!['urgencias', 'hospitalización'].includes(data.group || '')) {
        errors.push('Debe seleccionar un grupo válido (urgencias u hospitalización)');
    }
    if (data.group === 'hospitalización' && data.specialty === 'Refuerzo' && !data.hasSpecialty) {
        errors.push('Los médicos de refuerzo deben estar marcados como especialistas');
    }

    // Validar especialidades para hospitalización
    if (data.group === 'hospitalización' && data.hasSpecialty) {
        const validSpecialties = [
            'Oncología', 
            'Hemato-oncología', 
            'Medicina interna', 
            'Dolor y cuidados paliativos', 
            'Cirugía oncológica', 
            'Cirugía de tórax', 
            'Cirugía hepatobiliar', 
            'Refuerzo'
        ];
        
        // Comparación exacta (sin distinguir mayúsculas/minúsculas)
        if (!validSpecialties.some(spec => spec.toLowerCase() === data.specialty?.toLowerCase())) {
            errors.push('Para hospitalización, la especialidad debe ser: Oncología, Hemato-oncología, Medicina interna, Dolor y cuidados paliativos, Cirugía oncológica, Cirugía de tórax, Cirugía hepatobiliar o Refuerzo');
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
            group: 'hospitalización',
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
                // Festivos en Colombia por mes
        const colombianHolidays = {
            1: [1, 6], // Enero: Año Nuevo, Reyes Magos
            3: [24], // Marzo: San José
            4: [17, 18], // Abril: Jueves Santo, Viernes Santo (fechas aproximadas)
            5: [1], // Mayo: Día del trabajo
            6: [2, 23, 30], // Junio: Ascensión, Corpus Christi, San Pedro y San Pablo
            7: [20], // Julio: Independencia
            8: [7, 18], // Agosto: Boyacá, Asunción
            10: [13], // Octubre: Día de la raza
            11: [3, 17], // Noviembre: Todos los Santos, Independencia de Cartagena
            12: [8, 25] // Diciembre: Inmaculada, Navidad
        };

        // Contar domingos en el mes
        let sundays = 0;
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month - 1, day);
            if (date.getDay() === 0) {
                sundays++;
            }
        }

        // Obtener festivos del mes actual
        const holidaysInMonth = colombianHolidays[month] || [];
        const holidays = holidaysInMonth.length;

        // Calcular horas mínimas según la fórmula
        const workingDays = daysInMonth - sundays - holidays;
        const minimumHours = Math.round(workingDays * (44 / 6));

        setMonthlyHours([{
            doctorId: 'system',
            doctorName: 'Horas Mínimas del Mes',
            totalHours: minimumHours,
            availableHours: workingDays,
            workingDays: workingDays
        }]);
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

    const renderContent = () => {
        switch (activeTab) {
            case 'addDoctor':
                return (
                    <DoctorForm
                    doctorData={doctorData}
                    showSpecialtyField={showSpecialtyField}
                    isEditing={isEditing}
                    handleInputChange={handleInputChange}
                    handleSubmit={handleSubmit}
                    resetForm={resetForm}
                    />
                );
            case 'doctorsList':
                return (
                    <DoctorsList
                    doctors={doctors}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    />
                );
            case 'legal':
            return <LegalRequirements legalRequirements={legalRequirements} />;
            case 'policies':
                return <InternalPolicies internalPolicies={internalPolicies} />;
            case 'hours':
                return (
                    <MonthlyHours
                    selectedMonth={selectedMonth}
                    setSelectedMonth={setSelectedMonth}
                    calculateMonthlyHours={calculateMonthlyHours}
                    monthlyHours={monthlyHours}
                    hasDoctors={doctors.length > 0}
                    />
                );
            case 'assign':
                return (
                    <ShiftAssignment
                    shiftAssignments={shiftAssignments}
                    onGenerate={() => window.electronAPI.openChildWindow()}
                    />
                );

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

