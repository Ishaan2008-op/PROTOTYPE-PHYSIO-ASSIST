import React, { useState, useEffect } from 'react';
import { UserRole, Patient, DailyLog } from './types';
import { MOCK_PATIENTS } from './constants';
import { PhysioDashboard } from './components/PhysioDashboard';
import { PatientApp } from './components/PatientApp';
import { RegistrationForm } from './components/RegistrationForm';
import { PhysioLogin } from './components/PhysioLogin';
import { Stethoscope, User, ShieldCheck } from 'lucide-react';
import { generateDischargeReport } from './services/geminiService';

const STORAGE_KEY_PREFIX = 'physio_temp_logs_';
const REPORT_KEY_PREFIX = 'physio_temp_reports_';

const App: React.FC = () => {
  const [currentRole, setCurrentRole] = useState<UserRole>(UserRole.NONE);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isPhysioLoggingIn, setIsPhysioLoggingIn] = useState(false);
  
  // Use a list of patients for the Physio view
  const [patientsList, setPatientsList] = useState<Patient[]>(MOCK_PATIENTS);
  
  // The specific patient logged in (if Role == PATIENT)
  const [currentPatient, setCurrentPatient] = useState<Patient>(MOCK_PATIENTS[0]);
  const [currentPhysio, setCurrentPhysio] = useState<{name: string, id: string} | undefined>(undefined);

  // Load temporary logs and reports on startup
  useEffect(() => {
    // For demo purposes, we check storage for the first mock patient
    const p1Id = MOCK_PATIENTS[0].id;
    const storedLogs = sessionStorage.getItem(`${STORAGE_KEY_PREFIX}${p1Id}`);
    const storedReports = sessionStorage.getItem(`${REPORT_KEY_PREFIX}${p1Id}`);
    
    let updatedP1 = { ...MOCK_PATIENTS[0] };
    if (storedLogs) updatedP1.logs = JSON.parse(storedLogs);
    if (storedReports) updatedP1.weeklyReports = JSON.parse(storedReports);

    // Update the list and the current patient
    const newPatients = [updatedP1, ...MOCK_PATIENTS.slice(1)];
    setPatientsList(newPatients);
    setCurrentPatient(updatedP1);

  }, []);

  const reset = () => {
    setCurrentRole(UserRole.NONE);
    setIsRegistering(false);
    setIsPhysioLoggingIn(false);
    setCurrentPhysio(undefined);
  };

  const handleRegistration = (role: UserRole, details: any) => {
    const updatedPatient = {
        ...MOCK_PATIENTS[0], // Reset to base for new demo flow
        name: details.name,
        age: details.age,
        email: details.email,
        physioName: details.physioName,
        logs: MOCK_PATIENTS[0].logs,
        weeklyReports: MOCK_PATIENTS[0].weeklyReports
    };
    
    setCurrentPatient(updatedPatient);
    setCurrentRole(role);
    setIsRegistering(false);
  };

  const handlePhysioLogin = (physio: {name: string, id: string}) => {
      setCurrentPhysio(physio);
      setCurrentRole(UserRole.PHYSIO);
      setIsPhysioLoggingIn(false);
  };

  const handleLogEntry = (log: DailyLog) => {
    setCurrentPatient(prev => {
        const newLogs = [...prev.logs, log];
        sessionStorage.setItem(`${STORAGE_KEY_PREFIX}${prev.id}`, JSON.stringify(newLogs));
        return { ...prev, logs: newLogs };
    });
    // Also update the list so if we switch to physio view immediately, it's there
    setPatientsList(prev => prev.map(p => p.id === currentPatient.id ? { ...p, logs: [...p.logs, log] } : p));
  };

  const handlePatientUpdate = (updatedPatient: Patient) => {
      // Update the individual patient state
      if (updatedPatient.id === currentPatient.id) {
          setCurrentPatient(updatedPatient);
      }
      
      // Update the list
      setPatientsList(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));

      // Persist
      sessionStorage.setItem(`${REPORT_KEY_PREFIX}${updatedPatient.id}`, JSON.stringify(updatedPatient.weeklyReports));
      sessionStorage.setItem(`${STORAGE_KEY_PREFIX}${updatedPatient.id}`, JSON.stringify(updatedPatient.logs));
  };

  const handleAddPatient = (newPatient: Patient) => {
      setPatientsList(prev => [newPatient, ...prev]);
  };

  const handleDischarge = async () => {
      const report = await generateDischargeReport(currentPatient);
      alert(`SYSTEM: Emailing discharge report to ${currentPatient.email}...\n\nSubject: Recovery Journey Complete\n\n${report.substring(0, 150)}...\n\n(See console for full report)`);
      console.log("FULL DISCHARGE REPORT:", report);

      sessionStorage.removeItem(`${STORAGE_KEY_PREFIX}${currentPatient.id}`);
      sessionStorage.removeItem(`${REPORT_KEY_PREFIX}${currentPatient.id}`);
      
      setCurrentPatient(prev => ({ ...prev, logs: [], weeklyReports: [] }));
      reset();
  };

  if (isRegistering) {
      return <RegistrationForm onRegister={handleRegistration} onCancel={reset} />;
  }

  if (isPhysioLoggingIn) {
      return <PhysioLogin onLogin={handlePhysioLogin} onCancel={reset} />;
  }

  if (currentRole === UserRole.PHYSIO) {
    return (
        <PhysioDashboard 
            patients={patientsList} 
            onBack={reset} 
            currentPhysio={currentPhysio} 
            onPatientUpdate={handlePatientUpdate}
            onAddPatient={handleAddPatient}
        />
    );
  }

  if (currentRole === UserRole.PATIENT) {
    return <PatientApp patient={currentPatient} onBack={reset} onLogEntry={handleLogEntry} onDischarge={handleDischarge} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center text-white shadow-xl shadow-blue-200 mb-4">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">PhysioAI Monitor</h1>
          <p className="text-slate-500 mt-2">Intelligent recovery tracking & sensorless motion analysis.</p>
        </div>

        <div className="space-y-4">
          <button 
            onClick={() => setIsPhysioLoggingIn(true)}
            className="w-full group bg-white hover:border-blue-500 border-2 border-transparent p-6 rounded-2xl shadow-sm hover:shadow-md transition-all text-left flex items-center gap-5"
          >
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Stethoscope size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800">Clinician Login</h3>
              <p className="text-sm text-slate-500">Verified physio access only.</p>
            </div>
          </button>

          <button 
            onClick={() => setIsRegistering(true)}
            className="w-full group bg-white hover:border-green-500 border-2 border-transparent p-6 rounded-2xl shadow-sm hover:shadow-md transition-all text-left flex items-center gap-5"
          >
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
              <User size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800">Patient Portal</h3>
              <p className="text-sm text-slate-500">Register & Connect to your Physio.</p>
            </div>
          </button>
        </div>

        <div className="mt-12 text-center">
            <p className="text-xs text-slate-400">
                Powered by Gemini 2.5 Flash • React 18 • MediaPipe (Simulated)
            </p>
        </div>
      </div>
    </div>
  );
};

export default App;