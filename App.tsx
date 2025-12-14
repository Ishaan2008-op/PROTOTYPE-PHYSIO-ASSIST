import React, { useState, useEffect } from 'react';
import { UserRole, Patient, DailyLog } from './types';
import { MOCK_PATIENTS } from './constants';
import { PhysioDashboard } from './components/PhysioDashboard';
import { PatientApp } from './components/PatientApp';
import { RegistrationForm } from './components/RegistrationForm';
import { PhysioLogin } from './components/PhysioLogin';
import { Stethoscope, User, ShieldCheck } from 'lucide-react';
import { generateDischargeReport } from './services/geminiService';

const STORAGE_KEY = 'physio_app_data_v1';

const App: React.FC = () => {
  const [currentRole, setCurrentRole] = useState<UserRole>(UserRole.NONE);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isPhysioLoggingIn, setIsPhysioLoggingIn] = useState(false);
  
  // -- UNIFIED PERSISTENT STATE --
  // We load the full list of patients from storage once. 
  // If empty, we seed it with MOCK_PATIENTS.
  const [patientsList, setPatientsList] = useState<Patient[]>(() => {
      try {
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved) {
              return JSON.parse(saved);
          }
      } catch (e) {
          console.error("Failed to load persistence:", e);
      }
      return MOCK_PATIENTS;
  });
  
  // Sync back to storage on any change
  useEffect(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(patientsList));
  }, [patientsList]);

  // Current logged in user state
  const [currentPatient, setCurrentPatient] = useState<Patient>(patientsList[0]);
  const [currentPhysio, setCurrentPhysio] = useState<{name: string, id: string} | undefined>(undefined);

  // Sync currentPatient with the list if the list updates (e.g., Log added)
  useEffect(() => {
      const freshData = patientsList.find(p => p.id === currentPatient.id);
      if (freshData && freshData !== currentPatient) {
          setCurrentPatient(freshData);
      }
  }, [patientsList, currentPatient.id]);

  const reset = () => {
    setCurrentRole(UserRole.NONE);
    setIsRegistering(false);
    setIsPhysioLoggingIn(false);
    setCurrentPhysio(undefined);
  };

  const handleRegistration = (role: UserRole, details: any) => {
    // 1. Check if this patient already exists (e.g. created by Physio via "New Case")
    const existingPatient = patientsList.find(p => p.email.toLowerCase() === details.email.toLowerCase());

    if (existingPatient) {
        // Log in as existing
        setCurrentPatient(existingPatient);
    } else {
        // Register new
        const newPatient: Patient = {
            ...MOCK_PATIENTS[0], // Base off mock template
            id: `p${Date.now()}`,
            name: details.name,
            age: parseInt(details.age) || 25,
            email: details.email,
            physioName: details.physioName,
            // Reset logs/reports for a truly new user
            logs: [],
            weeklyReports: []
        };
        setPatientsList(prev => [newPatient, ...prev]);
        setCurrentPatient(newPatient);
    }
    
    setCurrentRole(role);
    setIsRegistering(false);
  };

  const handlePhysioLogin = (physio: {name: string, id: string}) => {
      setCurrentPhysio(physio);
      setCurrentRole(UserRole.PHYSIO);
      setIsPhysioLoggingIn(false);
  };

  const updatePatientData = (updatedPatient: Patient) => {
      setPatientsList(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
  };

  const handleLogEntry = (log: DailyLog) => {
    // Create updated patient object
    const updatedPatient = {
        ...currentPatient,
        logs: [...currentPatient.logs, log]
    };
    // Update global list (will sync back to currentPatient via useEffect)
    updatePatientData(updatedPatient);
  };

  const handlePatientUpdate = (updatedPatient: Patient) => {
      updatePatientData(updatedPatient);
  };

  const handleAddPatient = (newPatient: Patient) => {
      setPatientsList(prev => [newPatient, ...prev]);
  };

  const handleDischarge = async () => {
      const report = await generateDischargeReport(currentPatient);
      alert(`SYSTEM: Emailing discharge report to ${currentPatient.email}...\n\nSubject: Recovery Journey Complete\n\n${report.substring(0, 150)}...\n\n(See console for full report)`);
      console.log("FULL DISCHARGE REPORT:", report);

      // Remove from list or archive? For demo, we just reset their logs.
      const resetPatient = {
          ...currentPatient,
          logs: [],
          weeklyReports: [],
          status: 'On Track' as const
      };
      updatePatientData(resetPatient);
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