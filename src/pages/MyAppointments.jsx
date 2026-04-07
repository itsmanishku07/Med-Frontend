import { useState, useEffect } from 'react'
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, ChevronRight, MapPin, MessageSquare } from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../services/api'

export default function MyAppointments() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const response = await api.get('/appointments/patient')
      if (response.data.success) {
        setAppointments(response.data.appointments)
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
      toast.error('Failed to load appointments')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACCEPTED': return 'bg-green-50 text-green-700 border-green-200'
      case 'PENDING': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'REJECTED': return 'bg-red-50 text-red-700 border-red-200'
      case 'CANCELLED': return 'bg-gray-100 text-gray-600 border-gray-200'
      case 'COMPLETED': return 'bg-blue-50 text-blue-700 border-blue-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const formatDateTime = (isoString) => {
    if (!isoString) return 'Not scheduled yet'
    return new Date(isoString).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50/50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-gray-500 font-medium animate-pulse">Loading your appointments...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">My Appointments</h1>
          <p className="text-gray-500 font-medium mt-1">Track your consultation requests and scheduled meetings.</p>
        </div>

        {appointments.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-200 shadow-sm">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No appointments yet</h3>
            <p className="text-gray-500 max-w-sm mx-auto mb-8 font-medium">
              You haven't requested any appointments. Browse our doctor directory to find a specialist.
            </p>
            <button
              onClick={() => window.location.href = '/doctors'}
              className="bg-primary-600 text-white px-8 py-3.5 rounded-2xl font-bold text-sm shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 hover:-translate-y-0.5 transition-all active:scale-95"
            >
              Find Doctors
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appt) => (
              <div
                key={appt.id}
                className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all duration-300 group"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center shrink-0 shadow-inner">
                      <User className="w-7 h-7 text-primary-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-bold text-gray-900">Dr. {appt.doctor_name}</h3>
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getStatusColor(appt.status)}`}>
                          {appt.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm font-medium text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar className={`w-4 h-4 ${appt.scheduled_at ? 'text-primary-500' : 'text-gray-400'}`} />
                          <span className={appt.scheduled_at ? 'text-gray-900 font-bold' : ''}>
                            {appt.scheduled_at ? formatDateTime(appt.scheduled_at) : 'Awaiting Schedule'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>Request Date: {new Date(appt.requested_at).toLocaleDateString()}</span>
                        </div>
                        {appt.preferred_time && (
                          <div className="flex items-center gap-1.5 text-primary-600">
                            <Clock className="w-4 h-4" />
                            <span>Preferred: {new Date(appt.preferred_time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 md:self-center">
                    {appt.status === 'ACCEPTED' && (
                      <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-primary-50 text-primary-700 px-6 py-2.5 rounded-xl font-bold text-xs hover:bg-primary-100 transition-all border border-primary-200/50">

                      </button>
                    )}
                    <button className="p-2.5 rounded-xl border border-gray-100 text-gray-400 hover:bg-gray-50 transition-all">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {appt.preferred_time && (
                  <div className="mt-6 p-4 bg-primary-50/50 rounded-xl border border-primary-100">
                    <p className="text-[10px] font-black text-primary-400 uppercase tracking-widest mb-1">Your Suggested Time:</p>
                    <p className="text-sm text-primary-700 font-bold">{formatDateTime(appt.preferred_time)}</p>
                  </div>
                )}

                {appt.notes && (
                  <div className={`${appt.preferred_time ? 'mt-3' : 'mt-6'} p-4 bg-gray-50/50 rounded-xl border border-gray-100`}>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Your Message:</p>
                    <p className="text-sm text-gray-600 font-medium italic">"{appt.notes}"</p>
                  </div>
                )}

                {appt.doctor_notes && (
                  <div className="mt-3 p-4 bg-primary-50/30 rounded-xl border border-primary-100/50">
                    <p className="text-[10px] font-black text-primary-400 uppercase tracking-widest mb-1">Doctor's Response:</p>
                    <p className="text-sm text-primary-700 font-medium italic">"{appt.doctor_notes}"</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
