import React, { useState } from 'react';
import { VERIFIED_PHYSIOS } from '../constants';
import { ShieldCheck, Stethoscope, AlertCircle, ArrowRight, Lock } from 'lucide-react';

interface PhysioLoginProps {
  onLogin: (physio: { name: string; id: string }) => void;
  onCancel: () => void;
}

export const PhysioLogin: React.FC<PhysioLoginProps> = ({ onLogin, onCancel }) => {
  const [licenseId, setLicenseId] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsVerifying(true);

    // Simulate network delay for verification
    setTimeout(() => {
        const physio = VERIFIED_PHYSIOS[licenseId];
        if (physio) {
            onLogin(physio);
        } else {
            setError('License ID not found in the national registry.');
            setIsVerifying(false);
        }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        <div className="text-center mb-8">
           <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg shadow-blue-200 mb-4">
              <Stethoscope size={32} />
           </div>
           <h2 className="text-2xl font-bold text-slate-900">Clinician Portal</h2>
           <p className="text-sm text-slate-500 mt-2">Secure access for verified physiotherapists.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <label className="block text-xs font-bold text-blue-800 uppercase tracking-wide mb-2">Medical License ID</label>
            <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" size={18} />
                <input 
                required
                type="text" 
                className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-blue-200 focus:border-blue-500 focus:ring-0 outline-none bg-white font-mono text-slate-800 placeholder-slate-400"
                placeholder="e.g. PT-88321"
                value={licenseId}
                onChange={e => setLicenseId(e.target.value)}
                />
            </div>
            <p className="text-[10px] text-blue-400 mt-2 text-right">Demo ID: PT-88321</p>
          </div>

          {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
                  <AlertCircle size={16} />
                  <span>{error}</span>
              </div>
          )}

          <div className="pt-2">
            <button 
                type="submit" 
                disabled={isVerifying}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {isVerifying ? 'Verifying Credentials...' : 'Verify & Access Dashboard'}
                {!isVerifying && <ArrowRight size={18} />}
            </button>
            <button type="button" onClick={onCancel} className="w-full mt-3 text-slate-500 hover:text-slate-800 text-sm font-medium py-2">
                Back to Home
            </button>
          </div>
        </form>

        <div className="mt-8 border-t border-slate-100 pt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
            <ShieldCheck size={14} className="text-green-500" />
            <span>Protected by MedSafe Auth</span>
        </div>
      </div>
    </div>
  );
};
