import React, { useState, useRef, useEffect } from 'react';
import { Camera, ArrowLeft, Play, CheckCircle2, ChevronRight, AlertCircle, RefreshCw, Sparkles, Mail, Lock, FileSignature, LogOut, Mic, Square, Loader2, Wand2 } from 'lucide-react';
import { Patient, Exercise, DailyLog } from '../types';
import { getProgressBooster, analyzeVoiceNote } from '../services/geminiService';

interface PatientAppProps {
  patient: Patient;
  onBack: () => void;
  onLogEntry: (log: DailyLog) => void;
  onDischarge: () => Promise<void>;
}

export const PatientApp: React.FC<PatientAppProps> = ({ patient, onBack, onLogEntry, onDischarge }) => {
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  const [isExercising, setIsExercising] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [boosterMsg, setBoosterMsg] = useState<string>("Loading your personalized motivation...");
  const [isDischarging, setIsDischarging] = useState(false);
  
  // Exercise Session State
  const [reps, setReps] = useState(0);
  const [feedback, setFeedback] = useState<string>("Align your body in the frame");
  const [currentAngle, setCurrentAngle] = useState(0);
  const [painScore, setPainScore] = useState(5);
  
  // Voice Note State
  const [isRecording, setIsRecording] = useState(false);
  const [voiceNote, setVoiceNote] = useState<string | null>(null); // Base64
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [voiceAnalysis, setVoiceAnalysis] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  
  // Refs for tracking max values in the loop without causing re-renders
  const maxSessionRomRef = useRef(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Load Motivation on mount
  useEffect(() => {
    getProgressBooster(patient).then(setBoosterMsg);
  }, [patient]);

  // Simulation Logic
  useEffect(() => {
    let interval: any;
    
    if (isExercising && !sessionComplete) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => console.error("Camera error", err));

      interval = setInterval(() => {
        // Mock angle fluctuation (simulating wrist movement)
        setCurrentAngle(prev => {
          const change = Math.floor(Math.random() * 5);
          const increasing = Math.floor(Date.now() / 2000) % 2 === 0;
          let next = increasing ? prev + change : prev - change;
          if (next > 80) next = 80; // Wrist max
          if (next < 0) next = 0;
          
          // Track Max ROM for the session
          if (next > maxSessionRomRef.current) {
              maxSessionRomRef.current = next;
          }
          return next;
        });

        // Mock Rep Counting Logic
        if (Math.random() > 0.98) {
             setReps(r => {
                 const newReps = r + 1;
                 const targetReps = activeExercise ? activeExercise.targetReps : 10;
                 if (newReps >= targetReps) {
                     endSession();
                 }
                 return newReps;
             });
             setFeedback("Great extension! Hold it.");
        } else if (Math.random() > 0.95) {
             setFeedback("Keep your forearm steady.");
        }
      }, 100);
    } else {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach(track => track.stop());
        }
    }

    return () => clearInterval(interval);
  }, [isExercising, sessionComplete, activeExercise]);

  const startSession = (exercise: Exercise) => {
    setActiveExercise(exercise);
    setIsExercising(true);
    setSessionComplete(false);
    setReps(0);
    setVoiceNote(null);
    setVoiceAnalysis(null);
    maxSessionRomRef.current = 0; // Reset max
  };

  const endSession = () => {
    setIsExercising(false);
    setSessionComplete(true);
  };

  const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                chunksRef.current.push(e.data);
            }
        };

        mediaRecorder.onstop = async () => {
            const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = async () => {
                const base64data = reader.result as string;
                setVoiceNote(base64data);
                
                // Process with Gemini Agent
                setIsProcessingVoice(true);
                try {
                    const analysis = await analyzeVoiceNote(base64data);
                    setVoiceAnalysis(analysis);
                } catch (e) {
                    console.error("AI Analysis failed", e);
                } finally {
                    setIsProcessingVoice(false);
                }
            };
            
            // Stop tracks
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
    } catch (err) {
        console.error("Microphone access denied", err);
        alert("Please enable microphone access to record voice notes.");
    }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
      }
  };

  // Helper for demo purposes if mic is unavailable
  const injectDemoAudio = () => {
    // A very short base64 encoded silence/beep wav file for testing functionality
    // This is just a tiny placeholder so the UI shows the audio player
    const dummyAudio = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
    setVoiceNote(dummyAudio);
    setVoiceAnalysis("Transcription: [Demo Audio] I felt a slight twinge in my wrist today, but overall mobility is better. | Keywords: twinge, better, mobility");
  };

  const saveLog = () => {
    const newLog: DailyLog = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        painScore,
        maxRom: maxSessionRomRef.current,
        repsCompleted: reps,
        notes: "Patient self-logged session via mobile app",
        videoUrl: "", // Simulating no video storage for free tier
        voiceNoteBase64: voiceNote || undefined,
        voiceAnalysis: voiceAnalysis || undefined
    };
    
    onLogEntry(newLog);
    alert("Session logged to temporary storage!");
    setSessionComplete(false);
    setActiveExercise(null);
  };

  const handleEndJourney = async () => {
      const confirmEnd = window.confirm("Are you sure? This will delete your temporary session key, wipe all logs, and email the final medical report to you.");
      if (confirmEnd) {
          setIsDischarging(true);
          await onDischarge();
          setIsDischarging(false);
      }
  };

  const physioDisplayName = patient.physioName.split(' ')[0] + '...';
  const exerciseName = activeExercise ? activeExercise.name : '';
  const exerciseTargetReps = activeExercise ? activeExercise.targetReps : 0;
  const exerciseTargetRom = activeExercise ? activeExercise.targetRom : 0;

  // 1. Exercise List View
  if (!activeExercise && !sessionComplete) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <header className="bg-white p-4 shadow-sm flex flex-col sticky top-0 z-20">
          <div className="flex items-center justify-between mb-4">
              <div>
                    <h1 className="font-bold text-lg text-slate-800 leading-tight">Hi, {patient.name}</h1>
                    <p className="text-xs text-slate-500">Physio: {physioDisplayName}</p>
              </div>
              <button 
                onClick={onBack} 
                className="flex items-center gap-2 text-slate-500 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors border border-slate-200 hover:border-red-200"
              >
                <span className="text-xs font-bold">Log Out</span>
                <LogOut size={16} />
              </button>
          </div>
          
          {/* Progress Booster */}
          <div className="bg-gradient-to-r from-orange-100 to-amber-100 p-3 rounded-lg border border-orange-200 flex gap-3 items-start">
            <Sparkles className="text-orange-500 shrink-0 mt-1" size={18} />
            <div>
                <h3 className="text-xs font-bold text-orange-800 uppercase tracking-wide mb-1">Daily Progress Booster</h3>
                <p className="text-sm text-orange-900 leading-snug">{boosterMsg}</p>
            </div>
          </div>
        </header>
        
        <main className="flex-1 p-4 space-y-4 pb-20">
          <div className="bg-blue-600 rounded-xl p-5 text-white shadow-lg shadow-blue-200">
             <div className="flex justify-between items-start">
                <div>
                    <p className="text-blue-100 text-sm mb-1">Recovery Phase</p>
                    <h2 className="text-xl font-bold">{patient.injury}</h2>
                </div>
                <div className="bg-white/20 p-2 rounded-lg">
                    <RefreshCw size={20} />
                </div>
             </div>
             <div className="mt-4 flex gap-2">
                <div className="h-2 flex-1 bg-blue-500 rounded-full overflow-hidden">
                    <div className="h-full bg-white w-2/3"></div>
                </div>
                <span className="text-xs font-medium">65%</span>
             </div>
          </div>

          <h3 className="font-semibold text-slate-700 mt-2">Today's Exercises</h3>
          <div className="space-y-3">
            {patient.prescribedExercises.map(ex => (
              <div key={ex.id} onClick={() => startSession(ex)} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between active:scale-95 transition-transform cursor-pointer">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                        <Play size={20} fill="currentColor" />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800 text-sm sm:text-base">{ex.name}</h4>
                        <p className="text-xs text-slate-500">{ex.targetReps} Reps • {ex.targetRom}° Target</p>
                    </div>
                 </div>
                 <ChevronRight className="text-slate-300" />
              </div>
            ))}
          </div>

          <h3 className="font-semibold text-slate-700 mt-4 flex items-center gap-2">
              <FileSignature size={18} className="text-purple-600" />
              Clinical Reports
          </h3>
          <div className="space-y-3">
              {patient.weeklyReports && patient.weeklyReports.length > 0 ? (
                  patient.weeklyReports.map(report => (
                      <div key={report.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                          <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded">{report.title}</span>
                              <span className="text-xs text-slate-400">{report.date}</span>
                          </div>
                          <p className="text-sm text-slate-700 leading-relaxed">
                              "{report.content}"
                          </p>
                          <p className="text-xs text-right text-slate-500 mt-2 font-medium">- {report.physioName}</p>
                      </div>
                  ))
              ) : (
                  <div className="text-center p-6 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                      <p className="text-sm text-slate-400">No reports from your physio yet.</p>
                  </div>
              )}
          </div>

          <div className="pt-8 pb-4">
             <button 
                onClick={handleEndJourney} 
                disabled={isDischarging}
                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-red-100 text-red-600 rounded-xl font-semibold hover:bg-red-50 transition-colors disabled:opacity-50 text-sm sm:text-base"
             >
                {isDischarging ? <RefreshCw className="animate-spin" size={18} /> : <Mail size={18} />}
                {isDischarging ? "Generating Report..." : "Close Case & Email Report"}
             </button>
             <p className="text-center text-xs text-slate-400 mt-2">This will erase your temporary access key and logs.</p>
          </div>
        </main>
      </div>
    );
  }

  // 2. Completion & Logging View
  if (sessionComplete) {
    return (
        <div className="min-h-screen bg-white flex flex-col p-6 animate-in fade-in slide-in-from-bottom-8">
            <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 size={40} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Great Job!</h2>
                <p className="text-slate-500 mt-2">You completed {reps} reps of {exerciseName}.</p>

                <div className="w-full mt-12 space-y-6">
                    {/* Pain Slider */}
                    <div className="bg-slate-50 p-6 rounded-2xl">
                        <label className="block text-left text-sm font-semibold text-slate-700 mb-4">How was your pain level?</label>
                        <div className="flex justify-between items-center mb-2 px-1">
                            <span className="text-xs text-slate-500">No Pain</span>
                            <span className="text-xs text-slate-500">Severe</span>
                        </div>
                        <input 
                            type="range" 
                            min="0" max="10" 
                            value={painScore} 
                            onChange={(e) => setPainScore(parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <div className="text-center mt-4 font-bold text-3xl text-blue-600">{painScore}</div>
                    </div>

                    {/* Voice Note Section */}
                    <div className="bg-slate-50 p-6 rounded-2xl">
                        <label className="block text-left text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                            <Mic size={16} className="text-purple-600"/>
                            How do you feel? (Voice Note)
                        </label>
                        
                        {!voiceNote && !isRecording && (
                             <div className="space-y-2">
                                 <button 
                                    onClick={startRecording}
                                    className="w-full py-4 border-2 border-dashed border-purple-200 rounded-xl text-purple-600 font-medium hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
                                 >
                                    <Mic size={20} />
                                    Tap to Record
                                 </button>
                                 <button 
                                    onClick={injectDemoAudio}
                                    className="w-full py-2 text-xs text-slate-400 hover:text-purple-600 font-medium flex items-center justify-center gap-1"
                                 >
                                    <Wand2 size={12} /> Simulate Demo Note (No Mic)
                                 </button>
                             </div>
                        )}

                        {isRecording && (
                            <button 
                                onClick={stopRecording}
                                className="w-full py-4 bg-red-50 text-red-600 rounded-xl font-bold border border-red-200 animate-pulse flex items-center justify-center gap-2"
                            >
                                <Square size={20} fill="currentColor" />
                                Stop Recording...
                            </button>
                        )}

                        {voiceNote && (
                            <div className="space-y-3">
                                <audio controls src={voiceNote} className="w-full h-10" />
                                <div className="flex items-center justify-between text-xs text-slate-400">
                                    <span className="text-green-600 font-medium flex items-center gap-1">
                                        <CheckCircle2 size={12} /> Recorded
                                    </span>
                                    <button onClick={() => {setVoiceNote(null); setVoiceAnalysis(null);}} className="text-red-400 hover:text-red-600">Delete</button>
                                </div>
                                {isProcessingVoice ? (
                                    <div className="flex items-center gap-2 text-xs text-slate-500 bg-white p-2 rounded border border-slate-100">
                                        <Loader2 size={12} className="animate-spin text-purple-600" />
                                        Gemini Agent is analyzing audio...
                                    </div>
                                ) : voiceAnalysis ? (
                                    <div className="text-xs text-left bg-purple-50 p-3 rounded-lg border border-purple-100 text-purple-900">
                                        <div className="flex items-center gap-1 font-bold mb-1 text-purple-700">
                                            <Sparkles size={10} /> AI Insight:
                                        </div>
                                        {voiceAnalysis}
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <button onClick={saveLog} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-lg shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all mb-4">
                Save & Finish
            </button>
        </div>
    );
  }

  // 3. Active Exercise (Vision) View - Optimized for Mobile
  return (
    <div className="fixed inset-0 bg-black flex flex-col h-full w-full">
       <div className="relative flex-1 bg-slate-900 overflow-hidden w-full">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="absolute inset-0 w-full h-full object-cover opacity-80"
          />
          
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <div className="relative w-64 h-64 border-2 border-white/20 rounded-full flex items-center justify-center">
                {/* Hand/Wrist Sim */}
                <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)] z-10"></div>
                <div 
                  className="absolute top-1/2 left-1/2 w-24 h-2 bg-blue-400 origin-left rounded-full"
                  style={{ transform: `rotate(-${currentAngle + 90}deg)` }}
                ></div>
                <div className="absolute bottom-10 text-white font-mono text-xl font-bold bg-black/50 px-3 py-1 rounded">
                    {currentAngle}°
                </div>
             </div>
          </div>

          <div className="absolute top-0 left-0 right-0 p-6 pt-12 bg-gradient-to-b from-black/80 to-transparent text-white z-20">
             <div className="flex justify-between items-start">
                 <div>
                     <h3 className="font-bold text-lg leading-tight">{exerciseName}</h3>
                     <p className="text-blue-200 text-sm flex items-center gap-2 mt-1">
                        <RefreshCw size={14} /> Tracking Active
                     </p>
                 </div>
                 <div className="text-right">
                    <div className="text-4xl font-bold">{reps} <span className="text-base font-normal text-white/60">/ {exerciseTargetReps}</span></div>
                    <div className="text-xs text-white/60 uppercase tracking-wider">Reps</div>
                 </div>
             </div>
          </div>
       </div>

       <div className="bg-slate-900 p-6 pb-8 rounded-t-3xl -mt-6 relative z-30 border-t border-slate-800">
           <div className="flex items-center gap-4 mb-6">
                <div className={`p-3 rounded-full ${feedback.includes('Great') ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'} shrink-0`}>
                    {feedback.includes('Great') ? <CheckCircle2 /> : <AlertCircle />}
                </div>
                <p className="text-white font-medium text-lg leading-tight">
                    {feedback}
                </p>
           </div>
           
           <button 
             onClick={endSession}
             className="w-full py-4 bg-white/10 text-white rounded-xl font-semibold border border-white/10 hover:bg-white/20 transition-all active:scale-95"
           >
             End Session Early
           </button>
       </div>
    </div>
  );
};