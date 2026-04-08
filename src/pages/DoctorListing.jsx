import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, User, Star, MessageSquare, ChevronRight, Award, MapPin, ArrowUpDown } from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../services/api'

export default function DoctorListing() {
  const navigate = useNavigate()
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSpecialization, setSelectedSpecialization] = useState('All')
  const [sortBy, setSortBy] = useState('name')

  useEffect(() => {
    fetchDoctors()
  }, [])

  const fetchDoctors = async () => {
    try {
      setLoading(true)
      const [doctorsRes, reviewsRes] = await Promise.all([
        api.get('/auth/doctors'),
        api.get('/reviews/all-stats').catch(() => ({ data: { stats: {} } }))
      ])
      
      if (doctorsRes.data.success) {
        const doctorsWithRatings = (doctorsRes.data.doctors || []).map(doctor => ({
          ...doctor,
          rating: reviewsRes.data.stats?.[doctor.id] || { average_rating: 0, total_reviews: 0 }
        }))
        setDoctors(doctorsWithRatings)
      }
    } catch (error) {
      console.error('Error fetching doctors:', error)
      toast.error('Failed to load doctors')
    } finally {
      setLoading(false)
    }
  }

  const specializationsList = ['All', ...new Set(doctors.flatMap(d => d.specializations || []))]

  const filteredAndSortedDoctors = doctors
    .filter(doctor => {
      const matchesSearch = doctor.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (doctor.specializations || []).some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesSpec = selectedSpecialization === 'All' || (doctor.specializations || []).includes(selectedSpecialization)
      return matchesSearch && matchesSpec
    })
    .sort((a, b) => {
      if (sortBy === 'rating') {
        if (b.rating.average_rating !== a.rating.average_rating) {
          return b.rating.average_rating - a.rating.average_rating
        }
        return b.rating.total_reviews - a.rating.total_reviews
      } else {
        return (a.name || '').localeCompare(b.name || '')
      }
    })

  const openProfile = (doctorId) => {
    navigate(`/doctor/${doctorId}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50/50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-gray-500 font-medium animate-pulse">Finding specialists...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-4">
            Find the Right <span className="text-primary-600">Specialist</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto font-medium">
            Connect with top-rated medical professionals for expert consultation and care.
          </p>
        </div>

        {}
        <div className="mb-8 space-y-6">
          <div className="relative max-w-2xl mx-auto group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-transform group-focus-within:scale-110">
              <Search className="h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search by name or specialization..."
              className="block w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm hover:shadow-md outline-none text-gray-700 font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="flex items-center gap-2 mr-2 text-gray-500 font-bold text-xs uppercase tracking-widest">
              <Filter className="w-4 h-4" />
              Specializations:
            </div>
            {specializationsList.map((spec) => (
              <button
                key={spec}
                onClick={() => setSelectedSpecialization(spec)}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all border uppercase tracking-wider ${
                  selectedSpecialization === spec
                    ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-500/30'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:text-primary-600'
                }`}
              >
                {spec}
              </button>
            ))}
          </div>

          {}
          <div className="flex items-center justify-center gap-3">
            <div className="flex items-center gap-2 text-gray-500 font-bold text-xs uppercase tracking-widest">
              <ArrowUpDown className="w-4 h-4" />
              Sort By:
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSortBy('rating')}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all border ${
                  sortBy === 'rating'
                    ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/30'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300 hover:text-amber-600'
                }`}
              >
                <Star className="w-3 h-3 inline mr-1" />
                Highest Rating
              </button>
              <button
                onClick={() => setSortBy('name')}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all border ${
                  sortBy === 'name'
                    ? 'bg-gray-600 text-white border-gray-600 shadow-lg shadow-gray-500/30'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Name (A-Z)
              </button>
            </div>
          </div>
        </div>

        {}
        <div className="mb-6 text-center">
          <p className="text-sm text-gray-600 font-medium">
            Showing <span className="font-bold text-gray-900">{filteredAndSortedDoctors.length}</span> {filteredAndSortedDoctors.length === 1 ? 'doctor' : 'doctors'}
            {selectedSpecialization !== 'All' && (
              <span> in <span className="font-bold text-primary-600">{selectedSpecialization}</span></span>
            )}
          </p>
        </div>

        {}
        {filteredAndSortedDoctors.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <User className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-900">No doctors found</h3>
            <p className="mt-2 text-gray-500">Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedDoctors.map((doctor) => (
              <div 
                key={doctor.id} 
                className="group bg-white rounded-3xl border border-gray-100 hover:border-primary-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col"
              >
                {}
                <div className="h-24 bg-gradient-to-br from-primary-50 to-primary-100/50 group-hover:from-primary-600 group-hover:to-secondary-500 transition-all duration-500 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent scale-150 rotate-12" />
                </div>

                <div className="px-6 pb-6 relative flex flex-col flex-1">
                  {}
                  <div className="relative -mt-12 mb-4">
                    <div className="h-24 w-24 rounded-2xl bg-white p-1 shadow-lg group-hover:scale-105 transition-transform duration-300">
                      {doctor.profile_picture ? (
                        <img
                          src={doctor.profile_picture}
                          alt={doctor.name}
                          className="h-full w-full rounded-xl object-cover"
                        />
                      ) : (
                        <div className="h-full w-full rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
                          <span className="text-2xl font-black text-primary-600">
                            {doctor.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mb-2">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-lg font-black text-gray-900 truncate tracking-tight">
                        Dr. {doctor.name}
                      </h3>
                      {doctor.rating?.total_reviews > 0 && (
                        <div className="flex items-center gap-1 text-amber-500 font-bold text-xs bg-amber-50 px-1.5 py-0.5 rounded-lg">
                          <Star className="w-3 h-3 fill-amber-500" />
                          {doctor.rating.average_rating.toFixed(1)}
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-bold text-primary-600 mt-0.5">
                      {doctor.specializations?.[0] || 'Medical Specialist'}
                    </p>
                  </div>

                  <div className="space-y-3 mb-6 flex-1 text-sm text-gray-500 font-medium">
                    {doctor.profile?.experience && (
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-gray-400" />
                        <span>{doctor.profile.experience} Years Experience</span>
                      </div>
                    )}
                    {doctor.profile?.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="truncate">{doctor.profile.location}</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => openProfile(doctor.id)}
                    className="w-full mt-auto flex items-center justify-center gap-2 bg-gray-50 hover:bg-primary-600 text-gray-700 hover:text-white px-4 py-3 rounded-2xl font-bold text-sm transition-all group/btn"
                  >
                    View Profile
                    <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {}
        <div className="mt-16 bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-secondary-500/10 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-4">Can't find a specific specialist?</h2>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto font-medium">
              Upload your medical report and our AI with help match you with the best available doctor for your specific needs.
            </p>
            <button className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 hover:-translate-y-0.5 active:scale-95 group">
              <MessageSquare className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              Upload Medical Report
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
