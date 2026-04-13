import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { User, Stethoscope, ShieldCheck, AlertCircle, ArrowRight, CheckCircle2, X } from 'lucide-react';
import { MEDICAL_DISCLAIMER, TERMS_SECTIONS } from '../data/disclaimers';

const SignupFlowModal = ({ isOpen, onComplete, onCancel }) => {
  const [step, setStep] = useState(0); // 0: Terms, 1: Roles

  if (!isOpen) return null;

  const handleRoleSelect = (role) => {
    onComplete(role);
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[9999]" onClose={onCancel}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900/40 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-4xl border border-gray-200">
                
                {step === 0 ? (
                  /* Step 1: Corporate Terms */
                  <>
                    <div className="bg-white border-b border-gray-100 px-8 py-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <ShieldCheck className="h-6 w-6 text-gray-900" aria-hidden="true" />
                        <div>
                          <Dialog.Title as="h2" className="text-xl font-bold text-gray-900">
                            Legal Compliance & Terms
                          </Dialog.Title>
                          <p className="text-gray-500 text-xs font-medium italic">Step 1 of 2: Acknowledgment required</p>
                        </div>
                      </div>
                      <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="bg-white px-8 py-8">
                      <div className="space-y-8">
                        <section>
                          <div className="flex items-center gap-2 mb-3">
                            <AlertCircle className="w-4 h-4 text-gray-900" />
                            <h4 className="font-bold text-gray-900 uppercase tracking-wide text-xs">{MEDICAL_DISCLAIMER.title}</h4>
                          </div>
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                            <p className="text-gray-700 text-sm leading-relaxed font-medium">
                              {MEDICAL_DISCLAIMER.content}
                            </p>
                          </div>
                        </section>

                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                          <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-6 space-y-8">
                            {TERMS_SECTIONS.map((section) => (
                              <section key={section.id}>
                                <h4 className="font-bold text-gray-900 text-xs mb-2 border-b border-gray-50 pb-1 uppercase tracking-wider">
                                  {section.title}
                                </h4>
                                <p className="text-gray-600 text-[13px] leading-relaxed">
                                  {section.content}
                                </p>
                              </section>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-gray-500 font-medium bg-blue-50/30 p-4 rounded-lg border border-blue-100">
                          <CheckCircle2 className="w-4 h-4 text-primary-600 shrink-0" />
                          <p>By proceeding, you explicitly confirm that you have understood the medical disclaimer and terms of service provided above.</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 px-8 py-5 flex items-center justify-end border-t border-gray-200">
                      <button
                        onClick={() => setStep(1)}
                        className="bg-gray-900 hover:bg-black text-white px-8 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center gap-2 shadow-sm"
                      >
                        Accept & Continue
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  /* Step 2: Account Type Selection */
                  <>
                    <div className="bg-white border-b border-gray-100 px-8 py-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <User className="h-6 w-6 text-gray-900" aria-hidden="true" />
                        <div>
                          <Dialog.Title as="h2" className="text-xl font-bold text-gray-900">
                            Select Account Type
                          </Dialog.Title>
                          <p className="text-gray-500 text-xs font-medium italic">Step 2 of 2: Profile configuration</p>
                        </div>
                      </div>
                    </div>

                    <div className="px-8 py-10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <button 
                          onClick={() => handleRoleSelect('PATIENT')}
                          className="flex flex-col items-start text-left p-8 bg-white border border-gray-200 rounded-xl hover:border-gray-900 hover:bg-gray-50 transition-all group"
                        >
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-6 group-hover:bg-gray-900 transition-colors">
                            <User className="h-6 w-6 text-gray-600 group-hover:text-white transition-colors" />
                          </div>
                          <h4 className="text-lg font-bold text-gray-900 mb-1">Patient</h4>
                          <p className="text-gray-500 text-sm leading-relaxed">
                            Upload medical reports and receive intelligent health analysis.
                          </p>
                        </button>

                        <button 
                          onClick={() => handleRoleSelect('DOCTOR')}
                          className="flex flex-col items-start text-left p-8 bg-white border border-gray-200 rounded-xl hover:border-gray-900 hover:bg-gray-50 transition-all group"
                        >
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-6 group-hover:bg-gray-900 transition-colors">
                            <Stethoscope className="h-6 w-6 text-gray-600 group-hover:text-white transition-colors" />
                          </div>
                          <h4 className="text-lg font-bold text-gray-900 mb-1">Health Professional</h4>
                          <p className="text-gray-500 text-sm leading-relaxed">
                            Review patient records and provide expert consultations.
                          </p>
                        </button>
                      </div>

                      <div className="mt-8 pt-8 border-t border-gray-100 text-center">
                        <button
                          onClick={() => setStep(0)}
                          className="text-gray-400 hover:text-gray-600 font-bold text-xs transition-colors py-2 px-4"
                        >
                          Back to Terms
                        </button>
                      </div>
                    </div>
                  </>
                )}

              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default SignupFlowModal;
