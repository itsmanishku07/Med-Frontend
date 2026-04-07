import { useState, useEffect } from 'react'
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, ChevronRight, MapPin, MessageSquare, Plus, Save } from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../services/api'

export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editFormData, setEditFormData] = useState({
    scheduled_at: '',
    doctor_notes: '',
    status: 'ACCEPTED'
  })

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const response = await api.get('/appointments/doctor')
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

  const handleEdit = (appt) => {
    setEditingId(appt.id)
    setEditFormData({
      scheduled_at: appt.scheduled_at ? appt.scheduled_at.split('.')[0] : '',
      doctor_notes: appt.doctor_notes || '',
      status: appt.status === 'PENDING' ? 'ACCEPTED' : appt.status
    })
  }

  const handleUpdate = async (id) => {
    try {
      const response = await api.put(`/appointments/${id}/status`, editFormData)
      if (response.data.success) {
        toast.success(`Appointment ${editFormData.status.toLowerCase()} successfully`)
        setEditingId(null)
        fetchAppointments()
      }
    } catch (error) {
      console.error('Error updating appointment:', error)
      toast.error('Failed to update appointment')
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50/50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-gray-500 font-medium animate-pulse">Loading consultations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Manage Appointments</h1>
            <p className="text-gray-500 font-medium mt-1">Review and schedule incoming patient consultation requests.</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2">
            <span className="text-sm font-bold text-gray-700">Pending Requests: <span className="text-primary-600">{appointments.filter(a => a.status === 'PENDING').length}</span></span>
          </div>
        </div>

        {appointments.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-200 shadow-sm">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No consultation requests</h3>
            <p className="text-gray-500 max-w-sm mx-auto font-medium">
              You'll see new patient requests here once they book appointments from your profile.
            </p>
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
                        <h3 className="text-lg font-bold text-gray-900">Patient: {appt.patient_name}</h3>
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getStatusColor(appt.status)}`}>
                          {appt.status}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-4 text-sm font-medium text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>Request Date: {new Date(appt.requested_at).toLocaleDateString()}</span>
                        </div>
                        {appt.preferred_time && (
                          <div className="flex items-center gap-1.5 text-secondary-600 bg-secondary-50 px-2 py-0.5 rounded-lg border border-secondary-100">
                            <Clock className="w-4 h-4" />
                            <span className="font-bold text-xs uppercase tracking-tight">Preferred: {new Date(appt.preferred_time).toLocaleString([], {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                        )}
                        {appt.scheduled_at && (
                          <div className="flex items-center gap-1.5 text-primary-600 bg-primary-50 px-2 py-0.5 rounded-lg border border-primary-100">
                            <Clock className="w-4 h-4" />
                            <span className="font-bold">Scheduled: {new Date(appt.scheduled_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 md:self-center">
                    {editingId !== appt.id ? (
                      <button 
                        onClick={() => handleEdit(appt)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-primary-600 text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 hover:-translate-y-0.5 transition-all active:scale-95 group/btn"
                      >
                        {appt.status === 'PENDING' ? 'Accept & Schedule' : 'Update Schedule'}
                        <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    ) : (
                      <button 
                        onClick={() => setEditingId(null)}
                        className="p-2.5 rounded-xl bg-gray-50 text-gray-400 border border-gray-100 hover:bg-gray-100 transition-all font-bold text-xs"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                {editingId === appt.id && (
                  <div className="mt-6 p-6 bg-gray-50/50 rounded-2xl border border-gray-100 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Set Schedule Time</label>
                        <input 
                          type="datetime-local" 
                          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                          value={editFormData.scheduled_at}
                          onChange={(e) => setEditFormData({...editFormData, scheduled_at: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Current Status</label>
                        <select 
                          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                          value={editFormData.status}
                          onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                        >
                          <option value="ACCEPTED">Accept & Schedule</option>
                          <option value="REJECTED">Reject / Decline</option>
                          <option value="COMPLETED">Mark as Completed</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Notes for Patient</label>
                      <textarea 
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                        rows="3"
                        placeholder="Add preparation instructions or welcome note..."
                        value={editFormData.doctor_notes}
                        onChange={(e) => setEditFormData({...editFormData, doctor_notes: e.target.value})}
                      />
                    </div>
                    <button 
                      onClick={() => handleUpdate(appt.id)}
                      className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white px-8 py-3.5 rounded-xl font-bold text-sm shadow-xl shadow-primary-500/30 hover:shadow-primary-500/50 hover:-translate-y-0.5 transition-all active:scale-95"
                    >
                      <Save className="w-5 h-5" />
                      Save Changes & Notify Patient
                    </button>
                  </div>
                )}

                {!editingId && appt.notes && (
                  <div className="mt-6 p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Patient Request Message:</p>
                    <p className="text-sm text-gray-600 font-medium italic">"{appt.notes}"</p>
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
