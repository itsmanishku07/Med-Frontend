import { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Clock, Calendar, AlertCircle, Loader2 } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function DoctorAvailabilityViewer({ isOpen, onClose, doctor }) {
  const [availabilitySlots, setAvailabilitySlots] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  const [loading, setLoading] = useState(true);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    if (isOpen && doctor) {
      fetchDoctorAvailability();
    }
  }, [isOpen, doctor]);

  const fetchDoctorAvailability = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/availability/doctor/${doctor.id}/slots`);
      
      if (response.data.success) {
        setAvailabilitySlots(response.data.slots || []);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
      toast.error('Failed to load doctor availability');
    } finally {
      setLoading(false);
    }
  };

  const getDaySlots = (day) => {
    return availabilitySlots.filter(slot => slot.day_of_week === day);
  };

  if (!doctor) return null;

  return (
    <Transition show={isOpen} as="div">
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-5xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Dialog.Title className="text-2xl font-bold text-white">
                        Dr. {doctor.name}'s Availability
                      </Dialog.Title>
                      <p className="text-blue-100 text-sm mt-1">
                        View available consultation hours
                      </p>
                    </div>
                    <button
                      onClick={onClose}
                      className="text-white hover:bg-white/20 rounded-lg p-2 transition"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                      <p className="text-gray-600">Loading availability...</p>
                    </div>
                  ) : availabilitySlots.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        No Availability Set
                      </h3>
                      <p className="text-gray-600">
                        This doctor hasn't set their availability yet.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Desktop Weekly View */}
                      <div className="hidden lg:block">
                        <div className="grid grid-cols-7 gap-3">
                          {daysOfWeek.map((day) => {
                            const slots = getDaySlots(day);
                            return (
                              <div key={day} className="border border-gray-200 rounded-xl overflow-hidden">
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 border-b border-gray-200">
                                  <div className="font-bold text-gray-900 text-center text-sm">
                                    {day.substring(0, 3)}
                                  </div>
                                  <div className="text-xs text-gray-600 text-center mt-0.5">
                                    {day}
                                  </div>
                                </div>
                                <div className="p-2 min-h-[200px]">
                                  {slots.length === 0 ? (
                                    <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                                      Not available
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      {slots.map((slot, idx) => (
                                        <div
                                          key={idx}
                                          className="bg-green-50 border border-green-200 rounded-lg p-2"
                                        >
                                          <div className="flex items-center gap-1 text-green-900 font-semibold text-xs">
                                            <Clock className="w-3 h-3" />
                                            <span>{slot.start_time}</span>
                                          </div>
                                          <div className="text-green-700 text-xs mt-0.5">
                                            to {slot.end_time}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Mobile List View */}
                      <div className="lg:hidden space-y-3">
                        {daysOfWeek.map((day) => {
                          const slots = getDaySlots(day);
                          return (
                            <div key={day} className="border border-gray-200 rounded-xl overflow-hidden">
                              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-gray-200">
                                <h3 className="font-bold text-gray-900">{day}</h3>
                              </div>
                              <div className="p-4">
                                {slots.length === 0 ? (
                                  <p className="text-gray-500 text-sm">Not available</p>
                                ) : (
                                  <div className="space-y-2">
                                    {slots.map((slot, idx) => (
                                      <div
                                        key={idx}
                                        className="bg-green-50 border border-green-200 rounded-lg p-3"
                                      >
                                        <div className="flex items-center gap-2 text-green-900 font-bold">
                                          <Clock className="w-4 h-4" />
                                          <span>{slot.start_time} - {slot.end_time}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Info Note */}
                      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-blue-900 mb-1">
                            How to book an appointment
                          </p>
                          <p className="text-sm text-blue-700">
                            Click "Book Appointment" in the doctor's profile to request a consultation. 
                            The doctor will confirm your appointment based on their availability.
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 flex justify-end">
                  <button
                    onClick={onClose}
                    className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition"
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
