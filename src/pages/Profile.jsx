import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { useAuth } from '../contexts/FirebaseAuthContext'
import { useNavigate } from 'react-router-dom'
import api, { appointmentAPI } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import {
  User, Mail, Phone, MapPin, Edit3, Save, X, Plus, Stethoscope, Camera, CheckCircle, Calendar, FileText, Eye
} from 'lucide-react'

const MEDICAL_SPECIALIZATIONS = [
  "Cardiology", "Neurology", "Orthopedics", "Pediatrics", "Dermatology",
  "Gastroenterology", "Endocrinology", "Pulmonology", "Nephrology", "Oncology",
  "Psychiatry", "Radiology", "Pathology", "Anesthesiology", "Emergency Medicine",
  "Family Medicine", "Internal Medicine", "Surgery", "Obstetrics & Gynecology",
  "Ophthalmology", "ENT (Otolaryngology)", "Urology", "Rheumatology",
  "Hematology", "Infectious Disease", "Allergy & Immunology", "Sports Medicine",
  "Geriatrics", "Pain Management", "Critical Care"
]

function Profile() {
  const { updateProfile: updateAuthProfile, userProfile } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState(null)
  const [editingSection, setEditingSection] = useState(null)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    location: '',
    bio: ''
  })

  const [specializations, setSpecializations] = useState([])
  const [showSpecializationDropdown, setShowSpecializationDropdown] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [completedCases, setCompletedCases] = useState([])
  const [loadingCases, setLoadingCases] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  useEffect(() => {
    if (profile?.role === 'DOCTOR' && profile?.id) {
      fetchCompletedCases()
    }
  }, [profile?.id, profile?.role])

  const loadProfile = async () => {
    try {
      const response = await api.get('/auth/profile')

      if (response.data.success) {
        const userData = response.data.user
        setProfile(userData)

        setFormData({
          name: userData.name || '',
          phone: userData.phone || '',
          location: userData.profile?.location || '',
          bio: userData.profile?.bio || ''
        })

        setSpecializations(userData.specializations || [])
      }
    } catch (error) {
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const fetchCompletedCases = async () => {
    if (!profile?.id) {
      console.log('Profile ID not available yet')
      return
    }
    
    try {
      setLoadingCases(true)
      console.log('Fetching completed cases for doctor ID:', profile.id)
      const response = await appointmentAPI.getDoctorCompletedCases(profile.id)
      console.log('Completed cases response:', response.data)
      if (response.data.success) {
        setCompletedCases(response.data.completed_cases || [])
        console.log('Completed cases loaded:', response.data.completed_cases?.length || 0)
      }
    } catch (error) {
      console.error('Error fetching completed cases:', error)
      toast.error('Failed to load completed cases')
    } finally {
      setLoadingCases(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image is too large. Please select an image under 10MB.')
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          const MAX_WIDTH = 800
          const MAX_HEIGHT = 800

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width
              width = MAX_WIDTH
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height
              height = MAX_HEIGHT
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)

          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7)
          setSelectedImage(compressedDataUrl)
        }
        img.src = event.target.result
      }
      reader.onerror = () => {
        toast.error('Failed to read image file')
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Name is required')
      return
    }
    setSaving(true)
    try {
      const response = await api.put('/auth/profile', {
        name: formData.name.trim(),
        phone: formData.phone,
        specializations: specializations,
        profile_picture: selectedImage || profile?.profile_picture,
        profile: {
          location: formData.location,
          bio: formData.bio
        }
      })
      if (response.data.success) {
        toast.success('Profile updated!')
        setProfile(response.data.user)
        setEditingSection(null)
        updateProfile(response.data.user)
      }
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const toggleSpecialization = (spec) => {
    if (specializations.includes(spec)) {
      setSpecializations(specializations.filter(s => s !== spec))
    } else {
      setSpecializations([...specializations, spec])
    }
  }

  const removeSpecialization = (spec) => {
    setSpecializations(specializations.filter(s => s !== spec))
  }

  const handleViewDetails = (appointment) => {
    setSelectedAppointment(appointment)
    setShowDetailsModal(true)
  }

  const handleViewReport = (reportId) => {
    setShowDetailsModal(false)
    navigate(`/report/${reportId}`)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  const isDoctor = profile?.role === 'DOCTOR'

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 pt-28 pb-12 sm:px-6 lg:px-8">
      { }
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-4 border-white/30">
                {(selectedImage || profile?.profile_picture) ? (
                  <img
                    src={selectedImage || profile?.profile_picture}
                    alt={profile?.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl font-bold">
                    {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <label className="absolute bottom-0 right-0 p-1.5 bg-blue-600 rounded-full border-2 border-white cursor-pointer hover:bg-blue-700 transition-colors shadow-lg">
                <Camera className="w-4 h-4 text-white" />
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-4 mb-1">
                <h1 className="text-3xl font-bold truncate">{profile?.name}</h1>
                {(selectedImage || editingSection) && (
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-1.5 bg-white text-blue-600 rounded-full font-bold text-sm hover:bg-blue-50 transition-all shadow-lg active:scale-95 disabled:opacity-50 shrink-0"
                  >
                    {saving ? (
                      <LoadingSpinner size="small" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save Changes
                  </button>
                )}
              </div>
              <p className="text-blue-100 mt-1">{profile?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-white/20">
                  {profile?.role}
                </span>
                {isDoctor && specializations.length > 0 && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-500/30">
                    {specializations.length} Specialization{specializations.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      { }
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <User className="w-5 h-5 mr-2 text-blue-600" />
            Basic Information
          </h2>
          <button
            onClick={() => setEditingSection(editingSection === 'basic' ? null : 'basic')}
            className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
          >
            <Edit3 className="w-4 h-4 mr-1" />
            {editingSection === 'basic' ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {editingSection === 'basic' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="City, Country"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {saving ? (
                  <LoadingSpinner size="small" className="mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoItem
              icon={<Mail className="w-5 h-5 text-indigo-500" />}
              label="Email"
              value={profile?.email}
            />
            <InfoItem
              icon={<Phone className="w-5 h-5 text-green-500" />}
              label="Phone"
              value={profile?.phone || formData.phone}
            />
            <InfoItem
              icon={<MapPin className="w-5 h-5 text-red-500" />}
              label="Location"
              value={formData.location}
            />
            {formData.bio && (
              <div className="md:col-span-2 p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">About</div>
                <p className="text-gray-700">{formData.bio}</p>
              </div>
            )}
          </div>
        )}
      </div>

      { }
      {isDoctor && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Stethoscope className="w-5 h-5 mr-2 text-blue-600" />
              Medical Specializations
            </h2>
            <button
              onClick={() => setEditingSection(editingSection === 'specializations' ? null : 'specializations')}
              className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
            >
              <Edit3 className="w-4 h-4 mr-1" />
              {editingSection === 'specializations' ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {editingSection === 'specializations' ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Select your medical specializations. This helps match you with relevant patient cases.
              </p>

              { }
              <div className="flex flex-wrap gap-2 min-h-[40px] p-3 border-2 border-dashed border-gray-300 rounded-lg">
                {specializations.length === 0 ? (
                  <span className="text-gray-400 text-sm">No specializations selected</span>
                ) : (
                  specializations.map((spec) => (
                    <span
                      key={spec}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center"
                    >
                      {spec}
                      <button
                        onClick={() => removeSpecialization(spec)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>

              { }
              <div className="relative">
                <button
                  onClick={() => setShowSpecializationDropdown(!showSpecializationDropdown)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-left flex items-center justify-between hover:border-blue-500"
                >
                  <span className="text-gray-700">
                    {showSpecializationDropdown ? 'Close' : 'Add Specialization'}
                  </span>
                  <Plus className="w-5 h-5 text-gray-400" />
                </button>

                {showSpecializationDropdown && (
                  <div className="absolute z-10 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {MEDICAL_SPECIALIZATIONS.map((spec) => {
                      const isSelected = specializations.includes(spec)
                      return (
                        <button
                          key={spec}
                          onClick={() => toggleSpecialization(spec)}
                          className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between ${isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                            }`}
                        >
                          <span>{spec}</span>
                          {isSelected && (
                            <span className="text-blue-600 text-sm">✓ Selected</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {saving ? (
                    <LoadingSpinner size="small" className="mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Specializations
                </button>
              </div>
            </div>
          ) : (
            <div>
              {specializations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Stethoscope className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No specializations set</p>
                  <p className="text-sm mt-1">
                    Add your specializations to receive relevant patient cases
                  </p>
                  <button
                    onClick={() => setEditingSection('specializations')}
                    className="mt-3 text-blue-600 hover:underline"
                  >
                    Add Specializations
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {specializations.map((spec) => (
                    <span
                      key={spec}
                      className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Completed Cases Section for Doctors */}
      {isDoctor && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
              Accepted & Completed Cases
            </h2>
            <span className="px-3 py-1 bg-green-50 text-green-700 rounded-lg text-sm font-semibold">
              {completedCases.length} Cases
            </span>
          </div>
          
          {loadingCases ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="large" />
            </div>
          ) : completedCases.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No accepted or completed cases yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Your accepted and completed appointments will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {completedCases.map((appointment) => (
                <div
                  key={appointment.id}
                  className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {appointment.patient_name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <p className="text-sm text-gray-500">
                          {appointment.scheduled_at
                            ? new Date(appointment.scheduled_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : 'Not scheduled'}
                        </p>
                      </div>
                      {appointment.patient_reports && appointment.patient_reports.length > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                          <FileText className="w-4 h-4 text-blue-500" />
                          <p className="text-xs text-blue-600 font-medium">
                            {appointment.patient_reports.length} Report{appointment.patient_reports.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                          appointment.status === 'COMPLETED'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-green-50 text-green-700'
                        }`}
                      >
                        {appointment.status}
                      </span>
                      <button
                        onClick={() => handleViewDetails(appointment)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        See Details
                      </button>
                    </div>
                  </div>
                  {appointment.notes && (
                    <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 font-medium">Patient Notes:</p>
                      <p className="text-sm text-gray-700 mt-1 line-clamp-2">{appointment.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Appointment Details Modal */}
      {showDetailsModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Appointment Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Patient Info */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Patient Information</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-lg font-bold text-gray-900">{selectedAppointment.patient_name}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <p className="text-sm text-gray-600">
                      {selectedAppointment.scheduled_at
                        ? new Date(selectedAppointment.scheduled_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'Not scheduled'}
                    </p>
                  </div>
                  <div className="mt-2">
                    <span
                      className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                        selectedAppointment.status === 'COMPLETED'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-green-50 text-green-700'
                      }`}
                    >
                      {selectedAppointment.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedAppointment.notes && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Patient Notes</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{selectedAppointment.notes}</p>
                  </div>
                </div>
              )}

              {selectedAppointment.doctor_notes && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Your Notes</h4>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-blue-900">{selectedAppointment.doctor_notes}</p>
                  </div>
                </div>
              )}

              {/* Patient Reports */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Patient Medical Reports
                </h4>
                {selectedAppointment.patient_reports && selectedAppointment.patient_reports.length > 0 ? (
                  <div className="space-y-2">
                    {selectedAppointment.patient_reports.map((report) => (
                      <div
                        key={report.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{report.file_name}</p>
                          <div className="flex items-center gap-3 mt-1">
                            {report.medical_specialty && (
                              <span className="text-xs text-gray-500">
                                {report.medical_specialty}
                              </span>
                            )}
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              report.status === 'REVIEWED' ? 'bg-green-100 text-green-700' :
                              report.status === 'ANALYZED' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {report.status}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(report.uploaded_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleViewReport(report.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition"
                        >
                          <Eye className="w-4 h-4" />
                          View Report
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No reports available for this patient</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const InfoItem = ({ icon, label, value }) => {
  if (!value) {
    return (
      <div className="flex items-center p-3 bg-gray-100 rounded-lg border border-dashed">
        {icon}
        <span className="ml-3 text-gray-400 text-sm">{label} not provided</span>
      </div>
    )
  }

  return (
    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
      {icon}
      <div className="ml-3">
        <div className="text-xs text-gray-500">{label}</div>
        <span className="font-medium text-gray-900 text-sm">{value}</span>
      </div>
    </div>
  )
}

export default Profile
