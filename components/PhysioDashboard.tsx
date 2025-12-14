import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Activity, AlertTriangle, FileText, ChevronLeft, Bot, BadgeCheck, Users, BrainCircuit, ArrowLeft, Send, Sparkles, Video, Edit2, Save, X, Mail, Menu, LogOut, Mic, Volume2, UserPlus, Phone, Lock, CheckCircle2 } from 'lucide-react';
import { Patient, DailyLog } from '../types';
import { analyzePatientProgress, getRecoveryPrediction } from '../services/geminiService';
import { INJURY_LIBRARY, PROTOCOL_MAPPING } from '../constants';
import ReactMarkdown from 'react-markdown';

interface PhysioDashboardProps {
  patients: Patient[];
  onBack: () => void;
  currentPhysio?: { name: string; id: string };
  onPatientUpdate: (patient: Patient) => void;
  onAddPatient: (patient: Patient) => void;
}

export const PhysioDashboard: React.FC<PhysioDashboardProps> = ({ patients, onBack, currentPhysio, onPatientUpdate, onAddPatient }) => {
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0].id);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Local state for the selected patient to allow graph editing
  const [activePatient, setActivePatient] = useState<Patient>(patients[0]);

  // AI State
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Bot State
  const [botInjury, setBotInjury] = useState<string>(activePatient.injuryType);
  const [botPrediction, setBotPrediction] = useState<string | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);

  // Edit/Review State
  const [editingLog, setEditingLog] = useState<DailyLog | null>(null);
  const [reportText, setReportText] = useState('');
  const [reportTitle, setReportTitle] = useState(`Week ${Math.ceil(activePatient.logs.length / 3)} Update`);
  const [isSendingReport, setIsSendingReport] = useState(false);

  // New Patient Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addStep, setAddStep] = useState(1); // 1: Phone, 2: OTP, 3: Details/Injury
  const [newPatientData, setNewPatientData] = useState({
      phone: '',
      otp: '',
      name: '',
      age: '',
      injuryType: Object.keys(INJURY_LIBRARY)[0]
  });
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  useEffect(() => {
    const p = patients.find(p => p.id === selectedPatientId) || patients[0];
    setActivePatient(p);
    setBotInjury(p.injuryType);
    setAnalysis(null);
    setBotPrediction(null);
    setEditingLog(null);
    setReportText('');
    setIsSidebarOpen(false); // Close sidebar on selection (mobile UX)
  }, [selectedPatientId, patients]);

  const chartData = activePatient.logs.map((log, index) => ({
    date: log.date.split('-').slice(1).join('/'), // MM/DD
    rom: log.maxRom,
    pain: log.painScore,
    benchmark: activePatient.benchmarkRom[Math.min(index, activePatient.benchmarkRom.length - 1)] || 0
  }));

  const handleAIAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const result = await analyzePatientProgress(activePatient);
      setAnalysis(result);
    } catch (e) {
      setAnalysis("Failed to connect to AI service.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePrediction = async () => {
      if (!botInjury) return;
      setIsPredicting(true);
      const injuryProfile = INJURY_LIBRARY[botInjury];
      if (!injuryProfile) {
          setBotPrediction("Error: Selected injury protocol configuration not found.");
          setIsPredicting(false);
          return;
      }
      try {
          const result = await getRecoveryPrediction(activePatient, injuryProfile);
          setBotPrediction(result);
      } catch (e) {
          setBotPrediction("Bot unavailable. Please check your API connection.");
      } finally {
          setIsPredicting(false);
      }
  };

  const handleSaveLog = () => {
      if (!editingLog) return;
      
      const updatedLogs = activePatient.logs.map(log => 
          log.id === editingLog.id ? editingLog : log
      );
      
      const updatedPatient = {
          ...activePatient,
          logs: updatedLogs
      };
      
      setActivePatient(updatedPatient);
      onPatientUpdate(updatedPatient);
      setEditingLog(null);
  };

  const handleSendReport = () => {
      if (!reportText.trim()) return;
      setIsSendingReport(true);
      
      // Simulate API call
      setTimeout(() => {
          const physioName = currentPhysio ? currentPhysio.name : 'Physiotherapist';
          const newReport = {
              id: `r${Date.now()}`,
              date: new Date().toISOString().split('T')[0],
              title: reportTitle,
              content: reportText,
              physioName: physioName
          };
          
          const updatedPatient = {
              ...activePatient,
              weeklyReports: [newReport, ...activePatient.weeklyReports]
          };

          setActivePatient(updatedPatient);
          onPatientUpdate(updatedPatient); // Propagate change to App state
          
          setReportText('');
          setIsSendingReport(false);
          alert(`Report "${reportTitle}" sent to patient's dashboard!`);
      }, 800);
  };

  const physioInitials = (currentPhysio && currentPhysio.name) 
    ? currentPhysio.name.split(' ').map(n => n[0]).join('').slice(0, 2) 
    : "MD";

  const physioDisplayName = (currentPhysio && currentPhysio.name) ? currentPhysio.name : "Clinician";

  // --- New Patient Logic ---
  const handleSendOtp = () => {
      if (newPatientData.phone.length < 10) return alert("Please enter a valid phone number.");
      setOtpSent(true);
      setAddStep(2);
  };

  const handleVerifyOtp = () => {
      if (newPatientData.otp !== '1234') return alert("Invalid OTP. (Hint: Use 1234)");
      setOtpVerified(true);
      setAddStep(3);
  };

  const createNewCase = () => {
      const injuryInfo = INJURY_LIBRARY[newPatientData.injuryType];
      const protocol = PROTOCOL_MAPPING[newPatientData.injuryType];
      
      if (!protocol) return alert("System Error: Protocol not found for this injury.");

      const newPatient: Patient = {
          id: `p${Date.now()}`,
          name: newPatientData.name,
          age: parseInt(newPatientData.age) || 30,
          email: `${newPatientData.name.toLowerCase().replace(' ', '.')}@example.com`,
          physioName: physioDisplayName,
          injury: injuryInfo.name,
          injuryType: newPatientData.injuryType,
          startDate: new Date().toISOString().split('T')[0],
          status: 'On Track',
          prescribedExercises: protocol.exercises, // Auto-populated
          benchmarkRom: protocol.benchmarks, // Auto-populated
          logs: [],
          weeklyReports: []
      };

      onAddPatient(newPatient);
      setSelectedPatientId(newPatient.id);
      setIsAddModalOpen(false);
      
      // Reset State
      setAddStep(1);
      setNewPatientData({ phone: '', otp: '', name: '', age: '', injuryType: Object.keys(INJURY_LIBRARY)[0] });
      setOtpSent(false);
      setOtpVerified(false);
      alert("Case Created Successfully! Treatment plan auto-assigned.");
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden relative">
      
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* NEW PATIENT MODAL */}
      {isAddModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                  <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
                      <div className="flex items-center gap-2">
                        <UserPlus size={20} className="text-blue-400" />
                        <h3 className="font-bold">Open New Case</h3>
                      </div>
                      <button onClick={() => setIsAddModalOpen(false)} className="hover:text-slate-300"><X size={20} /></button>
                  </div>
                  
                  <div className="p-6">
                      {/* Progress Bar */}
                      <div className="flex items-center gap-2 mb-8">
                          <div className={`h-2 flex-1 rounded-full ${addStep >= 1 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
                          <div className={`h-2 flex-1 rounded-full ${addStep >= 2 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
                          <div className={`h-2 flex-1 rounded-full ${addStep >= 3 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
                      </div>

                      {/* STEP 1: Phone */}
                      {addStep === 1 && (
                          <div className="space-y-4">
                              <div className="text-center">
                                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                      <Phone size={24} />
                                  </div>
                                  <h4 className="font-bold text-slate-800">Connect to Patient</h4>
                                  <p className="text-sm text-slate-500">Enter patient's mobile number to verify.</p>
                              </div>
                              <div>
                                  <label className="text-xs font-bold text-slate-500 uppercase">Mobile Number</label>
                                  <input 
                                    type="tel" 
                                    placeholder="+1 (555) 000-0000"
                                    className="w-full p-3 border border-slate-300 rounded-lg mt-1 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                                    value={newPatientData.phone}
                                    onChange={e => setNewPatientData({...newPatientData, phone: e.target.value})}
                                  />
                              </div>
                              <button onClick={handleSendOtp} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors">
                                  Send Verification OTP
                              </button>
                          </div>
                      )}

                      {/* STEP 2: OTP */}
                      {addStep === 2 && (
                          <div className="space-y-4">
                               <div className="text-center">
                                  <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                      <Lock size={24} />
                                  </div>
                                  <h4 className="font-bold text-slate-800">Verify Connection</h4>
                                  <p className="text-sm text-slate-500">Enter code sent to {newPatientData.phone}</p>
                              </div>
                              <div>
                                  <label className="text-xs font-bold text-slate-500 uppercase">One-Time Password</label>
                                  <input 
                                    type="text" 
                                    placeholder="Enter 1234"
                                    className="w-full p-3 border border-slate-300 rounded-lg mt-1 focus:ring-2 focus:ring-purple-500 outline-none font-mono text-center tracking-widest text-xl"
                                    maxLength={4}
                                    value={newPatientData.otp}
                                    onChange={e => setNewPatientData({...newPatientData, otp: e.target.value})}
                                  />
                              </div>
                              <button onClick={handleVerifyOtp} className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors">
                                  Verify Secure Link
                              </button>
                          </div>
                      )}

                      {/* STEP 3: Details & Auto-Protocol */}
                      {addStep === 3 && (
                          <div className="space-y-4">
                               <div className="flex items-center gap-2 bg-green-50 text-green-700 p-3 rounded-lg border border-green-100 text-sm mb-4">
                                  <CheckCircle2 size={16} />
                                  <span className="font-semibold">Secure connection established.</span>
                               </div>

                               <div className="grid grid-cols-2 gap-4">
                                   <div>
                                       <label className="text-xs font-bold text-slate-500 uppercase">Patient Name</label>
                                       <input 
                                          type="text" 
                                          placeholder="Full Name"
                                          className="w-full p-2 border border-slate-300 rounded-lg mt-1 outline-none focus:border-blue-500"
                                          value={newPatientData.name}
                                          onChange={e => setNewPatientData({...newPatientData, name: e.target.value})}
                                       />
                                   </div>
                                   <div>
                                       <label className="text-xs font-bold text-slate-500 uppercase">Age</label>
                                       <input 
                                          type="number" 
                                          placeholder="30"
                                          className="w-full p-2 border border-slate-300 rounded-lg mt-1 outline-none focus:border-blue-500"
                                          value={newPatientData.age}
                                          onChange={e => setNewPatientData({...newPatientData, age: e.target.value})}
                                       />
                                   </div>
                               </div>

                               <div>
                                   <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                       <BrainCircuit size={14} className="text-blue-600" />
                                       Select Injury (Auto-Protocol)
                                   </label>
                                   <select 
                                      className="w-full p-3 border-2 border-blue-100 rounded-lg mt-1 bg-white focus:border-blue-500 outline-none font-medium text-slate-700"
                                      value={newPatientData.injuryType}
                                      onChange={e => setNewPatientData({...newPatientData, injuryType: e.target.value})}
                                   >
                                       {Object.values(INJURY_LIBRARY).map(inj => (
                                           <option key={inj.id} value={inj.id}>{inj.name}</option>
                                       ))}
                                   </select>
                                   <p className="text-[10px] text-slate-500 mt-1">
                                       *Selecting an injury will automatically generate the exercise plan and ROM benchmarks.
                                   </p>
                               </div>

                               <button onClick={createNewCase} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg mt-2">
                                   Create Case & Assign Plan
                               </button>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* Sidebar - Responsive */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out
        lg:static lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                    <Users size={20} />
                </div>
                <h2 className="text-lg font-bold text-slate-800">
                    Patients
                </h2>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-500 hover:text-slate-800">
                <X size={24} />
            </button>
        </div>

        {/* New Case Button */}
        <div className="p-4">
            <button 
                onClick={() => setIsAddModalOpen(true)}
                className="w-full bg-slate-900 text-white p-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg hover:bg-slate-800 transition-all active:scale-95"
            >
                <UserPlus size={18} />
                New Case
            </button>
        </div>

        <div className="flex-1 overflow-y-auto">
            {patients.map(p => (
                <button
                    key={p.id}
                    onClick={() => setSelectedPatientId(p.id)}
                    className={`w-full text-left p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors group ${selectedPatientId === p.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''}`}
                >
                    <div className="flex justify-between items-start">
                        <p className={`font-semibold ${selectedPatientId === p.id ? 'text-blue-700' : 'text-slate-700'}`}>{p.name}</p>
                        {selectedPatientId === p.id && <ChevronLeft className="text-blue-600 rotate-180" size={16} />}
                    </div>
                    <p className="text-xs text-slate-500 truncate">{p.injury}</p>
                </button>
            ))}
        </div>

        {/* Logout Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <button 
                onClick={onBack}
                className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all font-medium"
            >
                <LogOut size={20} />
                Log Out
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-4 lg:px-6 py-4 flex items-center justify-between shadow-sm z-10">
            <div className="flex items-center gap-3">
                {/* Mobile Menu Toggle */}
                <button 
                    onClick={() => setIsSidebarOpen(true)}
                    className="lg:hidden p-2 -ml-2 hover:bg-slate-100 rounded-lg text-slate-600"
                >
                    <Menu size={24} />
                </button>
                <div>
                    <h1 className="text-xl lg:text-2xl font-bold text-slate-800 truncate max-w-[200px] lg:max-w-none">{activePatient.name}</h1>
                    <p className="text-xs lg:text-sm text-slate-500">Status: {activePatient.status}</p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold text-slate-800">{physioDisplayName}</p>
                    <div className="flex items-center justify-end gap-1.5 text-xs text-white font-medium bg-green-600 px-3 py-1 rounded-full shadow-sm shadow-green-200">
                        <BadgeCheck size={14} fill="currentColor" className="text-white" /> 
                        <span className="hidden md:inline">Verified</span>
                    </div>
                </div>
                <div className="w-9 h-9 lg:w-10 lg:h-10 bg-slate-800 rounded-full flex items-center justify-center text-white font-bold border-2 border-slate-200 shadow-sm shrink-0">
                    {physioInitials}
                </div>
            </div>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-6 w-full bg-slate-50/50">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Main Chart Section */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* Chart Card */}
                <div className="bg-white p-4 lg:p-6 rounded-xl shadow-sm border border-slate-100 relative">
                     {editingLog && (
                        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl animate-in fade-in p-4">
                            <div className="bg-white border-2 border-blue-100 shadow-2xl p-6 rounded-2xl w-full max-w-sm h-full overflow-y-auto">
                                <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                        <Edit2 size={16} className="text-blue-600" />
                                        Log Details
                                    </h4>
                                    <button onClick={() => setEditingLog(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                                </div>
                                <div className="space-y-4">
                                    <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between border border-slate-200">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Video size={18} />
                                            <span className="text-sm font-medium">Session Recording</span>
                                        </div>
                                        <button className="text-xs bg-slate-800 text-white px-3 py-1.5 rounded hover:bg-slate-700 transition-colors">
                                            Play Video
                                        </button>
                                    </div>
                                    
                                    {/* Voice Note Playback for Physio */}
                                    {editingLog.voiceNoteBase64 && (
                                        <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                                            <div className="flex items-center gap-2 text-purple-700 mb-2">
                                                <Mic size={16} />
                                                <span className="text-sm font-bold">Patient Voice Note</span>
                                            </div>
                                            <audio controls src={editingLog.voiceNoteBase64} className="w-full h-8 mb-2" />
                                            {editingLog.voiceAnalysis && (
                                                <div className="text-xs bg-white p-2 rounded border border-purple-100 text-slate-600 mt-2">
                                                    <div className="font-bold text-purple-600 flex items-center gap-1 mb-1">
                                                        <Sparkles size={10} /> Gemini Analysis:
                                                    </div>
                                                    {editingLog.voiceAnalysis}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 uppercase">Max ROM (°)</label>
                                        <input 
                                            type="number" 
                                            value={editingLog.maxRom} 
                                            onChange={e => setEditingLog({...editingLog, maxRom: parseInt(e.target.value)})}
                                            className="w-full mt-1 p-2 border border-slate-300 rounded focus:border-blue-500 outline-none" 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 uppercase">Pain Score</label>
                                        <input 
                                            type="number" 
                                            value={editingLog.painScore} 
                                            onChange={e => setEditingLog({...editingLog, painScore: parseInt(e.target.value)})}
                                            className="w-full mt-1 p-2 border border-slate-300 rounded focus:border-blue-500 outline-none" 
                                        />
                                    </div>
                                    <button 
                                        onClick={handleSaveLog}
                                        className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 mt-2 flex items-center justify-center gap-2"
                                    >
                                        <Save size={16} /> Update Graph
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        <Activity className="text-blue-500" size={20} />
                        Recovery Curve
                        </h3>
                        <div className="text-xs text-slate-400 hidden sm:block">
                            Click a log to review.
                        </div>
                    </div>
                    <div className="h-[250px] lg:h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} label={{ value: 'ROM (°)', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8' } }} />
                            <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px' }} />
                            <Legend wrapperStyle={{ fontSize: '12px', marginTop: '10px' }} />
                            <Line type="monotone" dataKey="rom" name="Patient ROM" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                            <Line type="monotone" dataKey="benchmark" name="Target" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                        </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Report Generation Section */}
                <div className="bg-white p-4 lg:p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <Mail className="text-purple-500" size={20} />
                        Weekly Report
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                        <input 
                            type="text" 
                            placeholder="Report Title"
                            value={reportTitle}
                            onChange={(e) => setReportTitle(e.target.value)}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-200 outline-none text-sm font-semibold"
                        />
                        <textarea 
                            placeholder="Draft clinical feedback..."
                            className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-200 outline-none text-sm resize-none"
                            value={reportText}
                            onChange={(e) => setReportText(e.target.value)}
                        ></textarea>
                        <div className="flex justify-end">
                            <button 
                                onClick={handleSendReport}
                                disabled={isSendingReport || !reportText}
                                className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
                            >
                                {isSendingReport ? 'Sending...' : 'Send to Patient'}
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Dark Mode Injury Predictor Bot */}
                <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 overflow-hidden flex flex-col min-h-[300px]">
                    <div className="p-4 bg-slate-950/50 border-b border-slate-800 flex items-center justify-between">
                        <h3 className="font-semibold text-slate-100 flex items-center gap-2">
                            <BrainCircuit className="text-purple-400" size={20} />
                            <span className="hidden sm:inline">Injury</span> Predictor Bot
                        </h3>
                        <span className="text-xs bg-purple-900/50 text-purple-300 border border-purple-700/50 px-2 py-0.5 rounded-full">AI Active</span>
                    </div>

                    <div className="p-4 lg:p-6 space-y-6 flex-1 bg-gradient-to-b from-slate-900 to-slate-950">
                        <div className="flex gap-4 animate-in slide-in-from-left-4 fade-in duration-500">
                            <div className="w-10 h-10 rounded-full bg-purple-900/30 border border-purple-700/50 flex items-center justify-center shrink-0">
                                <Bot size={20} className="text-purple-300" />
                            </div>
                            <div className="bg-slate-800 p-4 rounded-r-2xl rounded-bl-2xl text-slate-200 text-sm border border-slate-700 shadow-sm max-w-[85%]">
                                <p>Confirm the injury protocol for <strong>{activePatient.name}</strong> to begin analysis.</p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 animate-in slide-in-from-right-4 fade-in duration-500 delay-100">
                            <div className="flex flex-col items-end gap-2 max-w-[85%]">
                                <div className="bg-blue-600 p-2 pl-3 pr-2 rounded-l-2xl rounded-br-2xl text-white text-sm shadow-md flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
                                    <span className="text-blue-100 text-xs uppercase font-bold tracking-wider hidden sm:inline">Protocol:</span>
                                    <select 
                                        value={botInjury}
                                        onChange={(e) => setBotInjury(e.target.value)}
                                        className="bg-blue-700/50 hover:bg-blue-700 transition-colors border border-blue-400/30 text-white text-sm rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-white/50 cursor-pointer outline-none [&>option]:text-slate-900 [&>option]:bg-white max-w-[150px]"
                                    >
                                        {Object.values(INJURY_LIBRARY).map(inj => (
                                            <option key={inj.id} value={inj.id}>{inj.name}</option>
                                        ))}
                                    </select>
                                    <button 
                                        onClick={handlePrediction}
                                        disabled={isPredicting}
                                        className="bg-white text-blue-600 p-2 rounded-full hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                        title="Run Prediction"
                                    >
                                        {isPredicting ? <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div> : <Send size={14} fill="currentColor" />}
                                    </button>
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0 text-slate-400 font-bold border border-slate-700">
                                {physioInitials}
                            </div>
                        </div>

                        {botPrediction && !isPredicting && (
                            <div className="flex gap-4 animate-in fade-in slide-in-from-left-2 duration-500">
                                <div className="w-10 h-10 rounded-full bg-purple-900/30 border border-purple-700/50 flex items-center justify-center shrink-0">
                                    <Bot size={20} className="text-purple-300" />
                                </div>
                                <div className="space-y-2 max-w-[90%]">
                                    <div className="bg-black text-white p-5 rounded-xl border border-slate-700 shadow-xl ring-1 ring-white/10">
                                        <div className="prose prose-invert prose-sm max-w-none leading-relaxed">
                                            <ReactMarkdown>{botPrediction}</ReactMarkdown>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 pl-2">
                                        <Sparkles size={12} className="text-purple-400" />
                                        <p className="text-[10px] text-slate-500">Generated by Gemini 2.5 Flash</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Sidebar / Logs */}
            <div className="space-y-6">
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-6 text-white shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
                        <Bot size={120} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    Clinical Notes
                                </h3>
                                <p className="text-indigo-100 text-xs mt-1">AI Progress Summary</p>
                            </div>
                        </div>
                        
                        {!analysis ? (
                            <button 
                            onClick={handleAIAnalysis}
                            disabled={isAnalyzing}
                            className="w-full py-3 bg-white text-indigo-700 rounded-lg font-semibold hover:bg-indigo-50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed text-sm shadow-sm"
                            >
                            {isAnalyzing ? 'Analyzing Logs...' : 'Generate Summary'}
                            </button>
                        ) : (
                            <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 text-xs animate-in fade-in border border-white/20">
                            <div className="flex justify-between items-center mb-2 border-b border-white/20 pb-2">
                                <span className="font-semibold text-indigo-100">AI Report</span>
                                <button onClick={() => setAnalysis(null)} className="hover:text-white text-indigo-200 transition-colors">Reset</button>
                            </div>
                            <div className="prose prose-invert prose-sm max-h-[300px] overflow-y-auto custom-scrollbar">
                                <ReactMarkdown>{analysis}</ReactMarkdown>
                            </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white p-4 lg:p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <Video className="text-slate-400" size={20} />
                    Video Review
                </h3>
                <div className="space-y-4">
                    {activePatient.logs.length === 0 && (
                        <div className="text-center p-4 text-slate-400 text-sm italic bg-slate-50 rounded-lg">
                            No logs recorded yet.
                        </div>
                    )}
                    {activePatient.logs.slice().reverse().slice(0, 5).map((log) => (
                    <div 
                        key={log.id} 
                        onClick={() => setEditingLog(log)}
                        className={`flex items-start gap-3 pb-3 border-b border-slate-50 last:border-0 last:pb-0 p-2 rounded-lg cursor-pointer transition-all ${editingLog && editingLog.id === log.id ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-slate-50'}`}
                    >
                        <div className="mt-1 relative">
                            <div className="w-2 h-2 rounded-full bg-blue-500 ring-4 ring-blue-50"></div>
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <p className="text-sm font-medium text-slate-800">{log.date}</p>
                                <div className="flex gap-2">
                                    {log.voiceNoteBase64 && (
                                        <span className="text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                                            <Mic size={10} /> Voice
                                        </span>
                                    )}
                                    {log.videoUrl && (
                                        <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div> Rec
                                        </span>
                                    )}
                                </div>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">ROM: {log.maxRom}° • Pain: {log.painScore}/10</p>
                            {log.notes && (
                                <p className="text-xs text-slate-600 italic mt-1 bg-slate-50 p-1.5 rounded">"{log.notes}"</p>
                            )}
                        </div>
                    </div>
                    ))}
                </div>
                </div>
            </div>

            </div>
        </main>
      </div>
    </div>
  );
};