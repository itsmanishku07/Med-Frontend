import React, { useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, Mail, Phone, Award, BookOpen, Calendar, MapPin, Star, MessageSquare, Send, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../services/api'

export default function DoctorProfileModal({ isOpen, onClose, doctor }) {
  const [isBooking, setIsBooking] = React.useState(false)
  const [bookingNotes, setBookingNotes] = React.useState('')
  const [preferredTime, setPreferredTime] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)

  if (!doctor) return null

  const handleBookAppointment = async () => {
    if (!isBooking) {
      setIsBooking(true)
      return
    }

    try {
      setSubmitting(true)
      const response = await api.post('/appointments/request', {
        doctor_id: doctor.id,
        notes: bookingNotes,
        preferred_time: preferredTime
      })

      if (response.data.success) {
        toast.success('Appointment request sent to Dr. ' + doctor.name)
        setIsBooking(false)
        setBookingNotes('')
        onClose()
      }
    } catch (error) {
      console.error('Error booking appointment:', error)
      toast.error(error.response?.data?.message || 'Failed to send request')
    } finally {
      setSubmitting(false)
    }
  }

  const specializations = doctor.specializations || []
  const profile = doctor.profile || {}

  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-3xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                {/* Header Background */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-primary-600 to-secondary-500" />
                
                {/* Close Button */}
                <button
                  type="button"
                  className="absolute top-4 right-4 z-10 rounded-full bg-white/20 p-2 text-white hover:bg-white/30 transition-colors backdrop-blur-md"
                  onClick={onClose}
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="relative bg-white px-4 pb-4 pt-5 sm:p-8 mt-12 rounded-t-[2.5rem]">
                  <div className="sm:flex sm:items-start gap-6">
                    {/* Avatar */}
                    <div className="relative -mt-20 mb-4 sm:mb-0">
                      <div className="h-32 w-32 rounded-3xl bg-white p-1 shadow-xl">
                        {doctor.profile_picture ? (
                          <img
                            src={doctor.profile_picture}
                            alt={doctor.name}
                            className="h-full w-full rounded-[1.25rem] object-cover"
                          />
                        ) : (
                          <div className="h-full w-full rounded-[1.25rem] bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center border-2 border-white">
                            <span className="text-4xl font-black text-primary-600">
                              {doctor.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="absolute -bottom-2 -right-2 bg-green-500 border-4 border-white h-8 w-8 rounded-full shadow-lg" title="Online" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Dialog.Title as="h3" className="text-2xl font-black text-gray-900 tracking-tight">
                          Dr. {doctor.name}
                        </Dialog.Title>
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg text-xs font-bold">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          4.9
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {specializations.map((spec, idx) => (
                          <span 
                            key={idx}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-primary-50 text-primary-700 border border-primary-100 uppercase tracking-wider"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-6">
                        {profile.experience && (
                          <div className="flex items-center gap-2 text-gray-600 bg-gray-50 p-2 rounded-xl border border-gray-100">
                            <Award className="w-4 h-4 text-primary-500" />
                            <span className="text-xs font-bold">{profile.experience} Years Exp.</span>
                          </div>
                        )}
                        {profile.education && (
                          <div className="flex items-center gap-2 text-gray-600 bg-gray-50 p-2 rounded-xl border border-gray-100">
                            <BookOpen className="w-4 h-4 text-primary-500" />
                            <span className="text-xs font-bold">{profile.education}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 mt-6">
                    {/* Bio Section */}
                    {isBooking ? (
                      <div className="bg-primary-50/50 p-6 rounded-2xl border border-primary-100 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <h4 className="text-sm font-black text-primary-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                          Request Consultation
                          <div className="h-px flex-1 bg-primary-200" />
                        </h4>
                        <div className="grid grid-cols-1 gap-4 mb-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-primary-400 uppercase tracking-widest ml-1 leading-none">Suggested Time (Optional)</label>
                            <input 
                              type="datetime-local" 
                              className="w-full bg-white border border-primary-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                              value={preferredTime}
                              onChange={(e) => setPreferredTime(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-primary-400 uppercase tracking-widest ml-1 leading-none">Reason for Consultation</label>
                            <textarea
                              className="w-full bg-white border border-primary-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                              rows="3"
                              placeholder="Briefly describe your symptoms..."
                              value={bookingNotes}
                              onChange={(e) => setBookingNotes(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      profile.bio && (
                        <div>
                          <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-2 flex items-center gap-2">
                            About Doctor
                            <div className="h-px flex-1 bg-gray-100" />
                          </h4>
                          <p className="text-sm text-gray-600 leading-relaxed font-medium">
                            {profile.bio}
                          </p>
                        </div>
                      )
                    )}

                    {/* Contact Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                          Contact Info
                          <div className="h-px flex-1 bg-gray-100" />
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 group">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100 group-hover:bg-blue-600 transition-colors duration-300">
                              <Mail className="w-4 h-4 text-blue-600 group-hover:text-white transition-colors" />
                            </div>
                            <span className="text-sm font-bold text-gray-600">{doctor.email}</span>
                          </div>
                          {doctor.phone && (
                            <div className="flex items-center gap-3 group">
                              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center border border-green-100 group-hover:bg-green-600 transition-colors duration-300">
                                <Phone className="w-4 h-4 text-green-600 group-hover:text-white transition-colors" />
                              </div>
                              <span className="text-sm font-bold text-gray-600">{doctor.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                          Availability
                          <div className="h-px flex-1 bg-gray-100" />
                        </h4>
                        <div className="space-y-3">
                          {profile.availability && (
                            <div className="flex items-center gap-3 group">
                              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center border border-purple-100 group-hover:bg-purple-600 transition-colors duration-300">
                                <Calendar className="w-4 h-4 text-purple-600 group-hover:text-white transition-colors" />
                              </div>
                              <span className="text-sm font-bold text-gray-600">{profile.availability}</span>
                            </div>
                          )}
                          {profile.location && (
                            <div className="flex items-center gap-3 group">
                              <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center border border-orange-100 group-hover:bg-orange-600 transition-colors duration-300">
                                <MapPin className="w-4 h-4 text-orange-600 group-hover:text-white transition-colors" />
                              </div>
                              <span className="text-sm font-bold text-gray-600">{profile.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                      <button
                        type="button"
                        disabled={submitting}
                        className={`flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm shadow-lg transition-all active:scale-95 group ${
                          isBooking 
                            ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-green-500/30 hover:shadow-green-500/50' 
                            : 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-primary-500/30 hover:shadow-primary-500/50'
                        } hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed`}
                        onClick={handleBookAppointment}
                      >
                        {submitting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isBooking ? (
                          <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        ) : (
                          <MessageSquare className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                        )}
                        {isBooking ? 'Submit Request' : 'Book Appointment'}
                      </button>
                      <button
                        type="button"
                        className="px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-bold text-sm transition-all active:scale-95"
                        onClick={() => {
                          if (isBooking) {
                            setIsBooking(false)
                          } else {
                            onClose()
                          }
                        }}
                      >
                        {isBooking ? 'Back' : 'Close'}
                      </button>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
