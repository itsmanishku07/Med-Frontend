import React from 'react';
import { User, Stethoscope } from 'lucide-react';

const GoogleRoleModal = ({ isOpen, onSelectRole }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-xl max-w-md w-full overflow-hidden transform transition-all p-8 animate-fade-in-up">
        
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-primary-500/30">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight">Complete Profile</h3>
          <p className="mt-2 text-sm text-gray-500 font-medium">
            How would you like to use MedReport?
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <button 
            onClick={() => onSelectRole('PATIENT')}
            className="relative flex items-center p-4 border-2 border-gray-100 rounded-xl hover:bg-primary-50/50 hover:border-primary-400 transition-all group text-left"
          >
            <div className="flex-shrink-0 w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center group-hover:bg-primary-100 transition-colors">
              <User className="h-6 w-6 text-gray-500 group-hover:text-primary-600" />
            </div>
            <div className="ml-4">
              <span className="block text-lg font-bold text-gray-900 group-hover:text-primary-700 transition-colors">Patient</span>
              <span className="block text-sm text-gray-500 mt-0.5">Upload reports & get AI analysis</span>
            </div>
          </button>

          <button 
            onClick={() => onSelectRole('DOCTOR')}
            className="relative flex items-center p-4 border-2 border-gray-100 rounded-xl hover:bg-secondary-50/50 hover:border-secondary-400 transition-all group text-left"
          >
            <div className="flex-shrink-0 w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center group-hover:bg-secondary-100 transition-colors">
              <Stethoscope className="h-6 w-6 text-gray-500 group-hover:text-secondary-600" />
            </div>
            <div className="ml-4">
              <span className="block text-lg font-bold text-gray-900 group-hover:text-secondary-700 transition-colors">Doctor</span>
              <span className="block text-sm text-gray-500 mt-0.5">Review and manage patients</span>
            </div>
          </button>
        </div>

      </div>
    </div>
  );
};

export default GoogleRoleModal;
