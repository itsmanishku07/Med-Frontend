import React, { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react'
import { MEDICAL_DISCLAIMER, TERMS_SECTIONS } from '../data/disclaimers'

const TermsModal = ({ isOpen, onClose }) => {
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[9999]" onClose={onClose}>
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

                {/* Header */}
                <div className="bg-white border-b border-gray-100 px-8 py-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <ShieldCheck className="h-6 w-6 text-gray-900" aria-hidden="true" />
                    <div>
                      <Dialog.Title as="h2" className="text-xl font-bold text-gray-900">
                        Legal Compliance & Disclaimers
                      </Dialog.Title>
                      <p className="text-gray-500 text-xs font-medium">Agreement effective as of April 2026</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={onClose}
                  >
                    <X className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>

                {/* Main Content */}
                <div className="bg-white px-8 py-8">
                  <div className="space-y-10">

                    {/* Medical Disclaimer Section */}
                    <section>
                      <div className="flex items-center gap-2 mb-4">
                        <AlertCircle className="w-5 h-5 text-gray-900" />
                        <h4 className="font-bold text-gray-900 uppercase tracking-wide text-sm">{MEDICAL_DISCLAIMER.title}</h4>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                        <p className="text-gray-700 text-sm leading-relaxed font-medium">
                          {MEDICAL_DISCLAIMER.content}
                        </p>
                      </div>
                    </section>

                    {/* Standard Terms Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                      {TERMS_SECTIONS.map((section) => (
                        <section key={section.id}>
                          <h4 className="font-bold text-gray-900 text-sm mb-3 border-b border-gray-100 pb-2">
                            {section.title}
                          </h4>
                          <p className="text-gray-600 text-xs leading-relaxed">
                            {section.content}
                          </p>
                        </section>
                      ))}
                    </div>

                    {/* Highlights */}
                    <div className="border-t border-gray-100 pt-8">
                      <div className="flex items-start gap-4 text-xs text-gray-500 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                        <p>By clicking "Accept Terms", you confirm that you are using this platform for professional health tracking and acknowledge the AI analysis is not a direct medical diagnosis.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="bg-gray-50 px-8 py-6 flex items-center justify-end gap-3 border-t border-gray-200">
                  <button
                    type="button"
                    className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
                    onClick={onClose}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className="bg-gray-900 hover:bg-black text-white px-8 py-2.5 text-sm font-bold rounded-lg transition-all shadow-sm"
                    onClick={onClose}
                  >
                    Accept Terms
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}

export default TermsModal
