import { useState, useEffect } from "react";
import Icon from "./assets/icon.png";
import { openDB, addDoctor, getDoctors, updateDoctor, deleteDoctor, Doctor } from "./database/db";
import './App.css';
import DoctorForm from './components/doctorsrender/doctorform';
import DoctorsList from './components/doctorsrender/doctorslist';
import LegalRequirements, { LegalRequirement } from './components/doctorsrender/legalrequirements';
import InternalPolicies, { InternalPolicy } from './components/doctorsrender/internalpolicies';
import MonthlyHours, { MonthlyHoursData } from './components/doctorsrender/monthlyhours';
import ShiftAssignment, { ShiftAssignment as ShiftAssignmentType } from './components/doctorsrender/shiftassignment';
import CalendarModal from './components/calendario/calendarmodal';

declare global {
  interface Window {
    electronAPI: { openChildWindow: () => void };
  }
}

const legalRequirements: LegalRequirement[] = [
  { id: '1', title: 'Jornada Laboral Máxima', description: 'Máximo 60 horas semanales de trabajo según legislación colombiana', type: 'law' },
  { id: '2', title: 'Descanso Post Turno Nocturno', description: 'Derecho a descanso después de turno nocturno', type: 'law' },
  { id: '3', title: 'Días Festivos y Domingos', description: 'Aplicar fórmula: (días del mes - (4+n)) * (44/6) para cálculo de horas', type: 'regulation' }
];

const App = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [doctorData, setDoctorData] = useState<Omit<Doctor, 'id'>>({ name: '', idNumber: '', birthDate: '', hasSpecialty: false, specialty: '', group: 'hospitalización', email: '' });
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [showSpecialtyField, setShowSpecialtyField] = useState<boolean>(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentDoctorId, setCurrentDoctorId] = useState<number | null>(null);
  const [monthlyHours, setMonthlyHours] = useState<MonthlyHoursData[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [shiftAssignments, setShiftAssignments] = useState<ShiftAssignmentType[]>([]);
  const [showCalendarModal, setShowCalendarModal] = useState<boolean>(false);
  const [specialtyError, setSpecialtyError] = useState<string | null>(null);

  const internalPolicies: InternalPolicy[] = [
    { id: '1', title: 'Turnos por Especialidad', description: 'Médicos especializados solo pueden tomar turnos C8, médicos de refuerzo solo C6', category: 'specialties' },
    { id: '2', title: 'Grupos de Trabajo', description: 'Solo puede pertenecer a un grupo principal: urgencias u hospitalización. Refuerzo es una especialidad dentro de hospitalización', category: 'groups' },
    { id: '3', title: 'Especialidades Requeridas', description: 'Para Oncología, Hemato-oncología, Medicina interna, Dolor y cuidados paliativos, Cirugía oncológica, Cirugía de tórax, Cirugía hepatobiliar y Refuerzo', category: 'specialties' }
  ];

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

    setDoctorData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (name === 'hasSpecialty') {
      setShowSpecialtyField(checked);
      if (!checked) setDoctorData(prev => ({ ...prev, specialty: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors: string[] = [];

    const nameRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;
    if (!nameRegex.test(doctorData.name.trim())) validationErrors.push('El nombre solo debe contener letras y espacios.');

    const idRegex = /^\d+$/;
    if (!idRegex.test(doctorData.idNumber.trim())) validationErrors.push('La identificación solo debe contener números.');

    if (doctorData.group === 'hospitalización') {
        if (!doctorData.hasSpecialty) {
            validationErrors.push('Debes marcar que el médico tiene una especialidad.');
        } else if (!doctorData.specialty || doctorData.specialty.trim() === '') {
            validationErrors.push('Debes seleccionar una especialidad.');
        }
     }


    const emailRegex = /^[\w.-]+@[\w.-]+\.[A-Za-z]{2,}$/;
    if (!doctorData.email || !emailRegex.test(doctorData.email.trim())) validationErrors.push('El correo electrónico debe tener un @ y un dominio válido como .com, .org, etc.');

    if (validationErrors.length > 0) {
      setFormErrors(validationErrors);
      return;
    } else {
      setFormErrors([]);
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
    setDoctorData({ name: '', idNumber: '', birthDate: '', hasSpecialty: false, specialty: '', group: 'hospitalización', email: '' });
    setShowSpecialtyField(false);
    setIsEditing(false);
    setCurrentDoctorId(null);
  };

  const handleEdit = (doctor: Doctor) => {
    setDoctorData({ name: doctor.name, idNumber: doctor.idNumber, birthDate: doctor.birthDate, hasSpecialty: doctor.hasSpecialty, specialty: doctor.specialty || '', group: doctor.group || 'urgencias', email: doctor.email || '' });
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

  const calculateMonthlyHours = (): void => {
    const [year, month] = selectedMonth.split('-').map(Number)
    const daysInMonth = new Date(year, month, 0).getDate()
    const colombianHolidays = {
      1: [1, 6],
      3: [24],
      4: [17, 18],
      5: [1],
      6: [2, 23, 30],
      7: [20],
      8: [7, 18],
      10: [13],
      11: [3, 17],
      12: [8, 25]
    }

    let sundays = 0
    let holidays = 0
    let holidaysOnSunday = 0

    const holidaysInMonth = colombianHolidays[month] || []

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day)
      const isSunday = date.getDay() === 0
      const isHoliday = holidaysInMonth.includes(day)

      if (isSunday) sundays++
      if (isHoliday) holidays++
      if (isSunday && isHoliday) holidaysOnSunday++
    }

    const workingDays = daysInMonth - sundays - holidays + holidaysOnSunday
    const minimumHours = Math.round(workingDays * (44 / 6))

    setMonthlyHours([{doctorId: 'system',
        doctorName: 'Horas Mínimas del Mes',
        totalHours: minimumHours,
        availableHours: workingDays,
        workingDays
      }])
  }

  const handleOpenCalendarModal = () => setShowCalendarModal(true);
  const handleCloseCalendarModal = () => setShowCalendarModal(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'addDoctor':
        return <DoctorForm doctorData={doctorData} showSpecialtyField={showSpecialtyField} isEditing={isEditing} handleInputChange={handleInputChange} handleSubmit={handleSubmit} resetForm={resetForm} formErrors={formErrors} specialtyError={specialtyError} />;
      case 'doctorsList':
        return <DoctorsList doctors={doctors} onEdit={handleEdit} onDelete={handleDelete} />;
      case 'legal':
        return <LegalRequirements legalRequirements={legalRequirements} />;
      case 'policies':
        return <InternalPolicies internalPolicies={internalPolicies} />;
      case 'hours':
        return <MonthlyHours selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} calculateMonthlyHours={calculateMonthlyHours} monthlyHours={monthlyHours} hasDoctors={doctors.length > 0} />;
      case 'assign':
        return <ShiftAssignment shiftAssignments={shiftAssignments} onGenerate={() => window.electronAPI.openChildWindow()}
 />;
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
                <p className="text-2xl font-bold text-green-600">{doctors.filter(d => d.hasSpecialty).length}</p>
              </div>
              <div className="bg-purple-100 p-4 rounded-lg">
                <h3 className="font-bold text-purple-800">Médicos Generales</h3>
                <p className="text-2xl font-bold text-purple-600">{doctors.filter(d => !d.hasSpecialty).length}</p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#f9eef5] font-lato text-[#9280b6]">
      <div className="container mx-auto px-4 flex-grow overflow-hidden">
        <div className="hero-container">
          <img src={Icon} alt="Logo" className="hero-logo" />
        </div>
        <header className="bg-[#22335d] text-[#9280b6] p-4 rounded-lg shadow-lg mb-8">
          <h1 className="main-heading">Organizador de turnos médicos</h1>
          <nav className="flex flex-wrap justify-center gap-3">
            <button onClick={() => handleNavClick('dashboard')} className={`custom-button text-sm px-3 py-1.5 m-1 ${activeTab === 'dashboard' ? 'active-button' : ''}`}>Dashboard</button>
            <button onClick={() => handleNavClick('addDoctor')} className={`custom-button text-sm px-3 py-1.5 m-1 ${activeTab === 'addDoctor' ? 'active-button' : ''}`}>Agregar Médico</button>
            <button onClick={() => handleNavClick('doctorsList')} className={`custom-button text-sm px-3 py-1.5 m-1 ${activeTab === 'doctorsList' ? 'active-button' : ''}`}>Lista de Médicos</button>
            <button onClick={() => handleNavClick('legal')} className={`custom-button text-sm px-3 py-1.5 m-1 ${activeTab === 'legal' ? 'active-button' : ''}`}>Requerimientos Legales</button>
            <button onClick={() => handleNavClick('policies')} className={`custom-button text-sm px-3 py-1.5 m-1 ${activeTab === 'policies' ? 'active-button' : ''}`}>Políticas Internas</button>
            <button onClick={() => handleNavClick('hours')} className={`custom-button text-sm px-3 py-1.5 m-1 ${activeTab === 'hours' ? 'active-button' : ''}`}>Horas Laborales</button>
            <button onClick={() => handleNavClick('assign')} className={`custom-button text-sm px-3 py-1.5 m-1 ${activeTab === 'assign' ? 'active-button' : ''}`}>Asignar Turnos</button>
          </nav>
        </header>
        <main className="main-content bg-white rounded-xl shadow-md p-6 mb-8 overflow-auto h-full">
        {renderContent()}
        </main>

      </div>
      <footer className="bg-[#22335d] text-[#9280b6] text-center p-4 mt-auto">
        <p className="text-sm">© {new Date().getFullYear()} Grupo 2.1 - Ingeniería de Software 2025-1 - Universidad Nacional de Colombia Sede Medellín</p>
      </footer>
      <CalendarModal show={showCalendarModal} onClose={handleCloseCalendarModal} />
    </div>
  );
};

export default App;
