import React, { useState } from 'react';
import { UserRole } from '../types';
import { ShieldCheck, UserPlus } from 'lucide-react';

interface RegistrationFormProps {
  onRegister: (role: UserRole, details: any) => void;
  onCancel: () => void;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({ onRegister, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    email: '',
    physioName: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API call to register and get session key
    onRegister(UserRole.PATIENT, formData);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        <div className="text-center mb-8">
           <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full mx-auto flex items-center justify-center mb-4">
              <UserPlus size={24} />
           </div>
           <h2 className="text-2xl font-bold text-slate-900">Patient Registration</h2>
           <p className="text-sm text-slate-500 mt-2">Connect to your Physiotherapist's Server</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input 
              required
              type="text" 
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="e.g. Ishaan"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Age</label>
                <input 
                required
                type="number" 
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="24"
                value={formData.age}
                onChange={e => setFormData({...formData, age: e.target.value})}
                />
            </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <input disabled type="text" value="Patient" className="w-full px-4 py-2 rounded-lg bg-slate-100 text-slate-500 border border-slate-200" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email ID</label>
            <input 
              required
              type="email" 
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="ishaan@example.com"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Physio Name</label>
            <input 
              required
              type="text" 
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="e.g. Shrikant Tiwari"
              value={formData.physioName}
              onChange={e => setFormData({...formData, physioName: e.target.value})}
            />
          </div>

          <div className="pt-4">
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-blue-200">
                Connect Securely
            </button>
            <button type="button" onClick={onCancel} className="w-full mt-3 text-slate-500 hover:text-slate-800 text-sm font-medium">
                Cancel
            </button>
          </div>
        </form>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
            <ShieldCheck size={14} />
            <span>End-to-End Encrypted Session</span>
        </div>
      </div>
    </div>
  );
};
