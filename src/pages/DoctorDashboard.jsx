import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/FirebaseAuthContext'
import { Users, FileText, AlertTriangle, Clock, CheckCircle, MessageSquare, Bell, ChevronRight, Activity, Archive, Inbox } from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../services/api'

export default function DoctorDashboard() {
  const { userProfile } = useAuth()
  const navigate = useNavigate()
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [viewMode, setViewMode] = useState('ACTIVE')
  const [stats, setStats] = useState({
    totalPatients: 0,
    pendingReviews: 0,
    criticalCases: 0,
    completedToday: 0
  })

  useEffect(() => {
    fetchAssignments()
    fetchStats()
    
    const interval = setInterval(() => {
      fetchAssignments()
      fetchStats()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [filter])

  const fetchAssignments = async () => {
    try {
      const response = await api.get('/medical-reports/my-reports')
      const reports = response.data.reports || []
      
      const mappedAssignments = reports.map(report => ({
        id: report.id,
        report_id: report.id,
        patient_id: report.patient_id,
        patient_name: report.patient_name || 'Patient',
        report_file_name: report.file_name,
        assigned_at: report.assigned_at || report.uploaded_at,
        status: report.status === 'REVIEWED' ? 'COMPLETED' : report.assigned_doctor_id ? 'ACTIVE' : 'PENDING',
        priority: report.ai_analysis?.severity_level || 'LOW',
        ai_analysis: report.ai_analysis,
        is_archived: report.is_archived || false,
        estimated_response_time_minutes: report.ai_analysis?.severity_level === 'CRITICAL' ? 15 : 60
      }))
      
      setAssignments(mappedAssignments)
    } catch (error) {
      console.error('Error fetching assignments:', error)
      toast.error('Failed to load assignments')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await api.get('/medical-reports/stats')
      const reportStats = response.data.stats || {}
      setStats({
        totalPatients: reportStats.totalReports || 0,
        pendingReviews: reportStats.pendingReports || 0,
        criticalCases: reportStats.criticalAlerts || 0,
        completedToday: reportStats.reviewedReports || 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleAcceptAssignment = async (reportId) => {
    try {
      const response = await api.post(`/medical-reports/${reportId}/assign-doctor`, {
        doctor_id: userProfile?.firebase_uid
      })
      
      if (response.data.success) {
        toast.success(response.data.message || 'Case accepted successfully')
        fetchAssignments()
        fetchStats()
      } else {
        toast.error(response.data.message || 'Failed to accept case')
      }
    } catch (error) {
      console.error('Error accepting assignment:', error)
      const errorMessage = error.response?.data?.message || 'Failed to accept assignment'
      toast.error(errorMessage)
    }
  }

  const handleArchiveReport = async (reportId, currentStatus) => {
    try {
      const newStatus = !currentStatus
      toast.loading(newStatus ? 'Archiving report...' : 'Unarchiving report...', { id: 'archive-report' })
      const response = await api.put(`/medical-reports/${reportId}/archive`, {
        is_archived: newStatus
      })
      
      if (response.data.success) {
        toast.success(response.data.message || 'Archive status updated', { id: 'archive-report' })
        fetchAssignments()
      } else {
        toast.error('Failed to update archive status', { id: 'archive-report' })
      }
    } catch (error) {
      console.error('Error toggling archive:', error)
      toast.error('Failed to update archive status', { id: 'archive-report' })
    }
  }

  const getPriorityStyle = (priority) => {
    const styles = {
      LOW: 'bg-blue-100 text-blue-800 border-blue-200',
      MEDIUM: 'bg-amber-100 text-amber-800 border-amber-200',
      HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
      CRITICAL: 'bg-red-100 text-red-800 border-red-200 animate-pulse ring-2 ring-red-400/50'
    }
    return styles[priority] || styles.LOW
  }

  const getPriorityIcon = (priority) => {
    if (priority === 'CRITICAL') {
      return <AlertTriangle className="w-5 h-5" />
    }
    return <Bell className="w-5 h-5" />
  }

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: { text: 'Pending', color: 'bg-gray-100 text-gray-800 border-gray-200' },
      ACTIVE: { text: 'Active', color: 'bg-primary-100 text-primary-800 border-primary-200' },
      COMPLETED: { text: 'Completed', color: 'bg-green-100 text-green-800 border-green-200' }
    }
    const badge = badges[status] || badges.PENDING
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold border tracking-wide uppercase ${badge.color}`}>
        {badge.text}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50/50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-gray-500 font-medium animate-pulse">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 pt-24 pb-12 sm:px-6 lg:px-8 min-h-screen font-sans">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Doctor Dashboard</h1>
          <p className="text-gray-600 mt-2 font-medium">Dr. <span className="text-primary-600">{userProfile?.name}</span></p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary-500 animate-pulse-slow" />
          <span className="text-sm font-bold text-gray-700">System Status: <span className="text-green-500">Online</span></span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card p-6 flex items-center justify-between group">
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Patients</p>
            <p className="text-3xl font-extrabold text-gray-900 mt-2 group-hover:text-primary-600 transition-colors">{stats.totalPatients}</p>
          </div>
          <div className="w-14 h-14 bg-primary-50/80 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300 shadow-inner border border-primary-100">
            <Users className="w-7 h-7 text-primary-600" />
          </div>
        </div>

        <div className="card p-6 flex items-center justify-between group">
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Pending Reviews</p>
            <p className="text-3xl font-extrabold text-gray-900 mt-2 group-hover:text-amber-600 transition-colors">{stats.pendingReviews}</p>
          </div>
          <div className="w-14 h-14 bg-amber-50/80 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300 shadow-inner border border-amber-100">
            <Clock className="w-7 h-7 text-amber-600" />
          </div>
        </div>

        <div className="card p-6 flex items-center justify-between group border-t-4 border-t-red-500 bg-red-50/30">
          <div>
            <p className="text-sm font-bold text-red-600 uppercase tracking-wider">Critical Cases</p>
            <p className="text-3xl font-extrabold text-red-700 mt-2 group-hover:text-red-800 transition-colors">{stats.criticalCases}</p>
          </div>
          <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300 shadow-inner border border-red-200">
            <AlertTriangle className="w-7 h-7 text-red-600" />
          </div>
        </div>

        <div className="card p-6 flex items-center justify-between group">
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Completed Today</p>
            <p className="text-3xl font-extrabold text-gray-900 mt-2 group-hover:text-green-600 transition-colors">{stats.completedToday}</p>
          </div>
          <div className="w-14 h-14 bg-green-50/80 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300 shadow-inner border border-green-100">
            <CheckCircle className="w-7 h-7 text-green-600" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => navigate('/doctor-appointments')}
          className="card p-4 flex items-center gap-4 hover:shadow-lg transition-all group"
        >
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
            <Clock className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-bold text-gray-900">My Appointments</p>
            <p className="text-sm text-gray-500">View scheduled appointments</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
        </button>

        <button
          onClick={() => navigate('/doctor-availability')}
          className="card p-4 flex items-center gap-4 hover:shadow-lg transition-all group border-2 border-green-200"
        >
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center group-hover:bg-green-100 transition-colors">
            <Activity className="w-6 h-6 text-green-600" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-bold text-gray-900">Manage Availability</p>
            <p className="text-sm text-gray-500">Set your working hours</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
        </button>

        <button
          onClick={() => navigate('/chats')}
          className="card p-4 flex items-center gap-4 hover:shadow-lg transition-all group"
        >
          <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center group-hover:bg-purple-100 transition-colors">
            <MessageSquare className="w-6 h-6 text-purple-600" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-bold text-gray-900">Messages</p>
            <p className="text-sm text-gray-500">Chat with patients</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
        </button>
      </div>

      {/* View & Filter Controls */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        {/* Main View Tabs */}
        <div className="bg-white/60 backdrop-blur-md p-1.5 rounded-2xl shadow-sm border border-gray-100 flex inline-flex">
          <button
            onClick={() => setViewMode('ACTIVE')}
            className={`px-5 py-2 font-bold text-sm transition-all rounded-xl flex items-center gap-2 ${
              viewMode === 'ACTIVE'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Inbox className="w-4 h-4" />
            Active
          </button>
          <button
            onClick={() => setViewMode('ARCHIVED')}
            className={`px-5 py-2 font-bold text-sm transition-all rounded-xl flex items-center gap-2 ${
              viewMode === 'ARCHIVED'
                ? 'bg-gray-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Archive className="w-4 h-4" />
            Archived
          </button>
        </div>

        {/* Priority Filters - Only show when ACTIVE */}
        {viewMode === 'ACTIVE' && (
          <div className="bg-white/60 backdrop-blur-md p-1.5 rounded-2xl shadow-sm border border-gray-100 flex gap-2 overflow-x-auto inline-flex">
            {['ALL', 'CRITICAL', 'HIGH', 'PENDING'].map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`px-5 py-2 font-bold text-sm transition-all rounded-xl whitespace-nowrap flex items-center gap-2 ${
                  filter === filterOption
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-500/30'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {filterOption}
                {filterOption === 'CRITICAL' && stats.criticalCases > 0 && (
                  <span className={`px-2 py-0.5 text-xs rounded-full ${filter === 'CRITICAL' ? 'bg-white text-red-600' : 'bg-red-500 text-white'}`}>
                    {stats.criticalCases}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Patient Assignments */}
      <div className="card overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-900">Patient Assignments</h2>
        </div>

        {assignments.length === 0 ? (
          <div className="p-16 text-center text-gray-500">
            <div className="w-24 h-24 bg-gray-50 flex items-center justify-center mx-auto mb-6 rounded-full border border-gray-100 shadow-sm">
              <FileText className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-xl font-bold text-gray-800 mb-2">No assignments found</p>
            <p className="text-sm font-medium text-gray-500">
              {viewMode === 'ARCHIVED' 
                ? 'No archived cases'
                : filter === 'ALL' 
                  ? 'You have no patient assignments at the moment'
                  : `No ${filter.toLowerCase()} priority cases`
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {assignments
              .filter(assignment => {
                if (viewMode === 'ARCHIVED') return assignment.is_archived;
                if (assignment.is_archived) return false;
                
                if (filter === 'ALL') return true;
                if (filter === 'CRITICAL') return assignment.priority === 'CRITICAL';
                if (filter === 'HIGH') return assignment.priority === 'HIGH';
                if (filter === 'PENDING') return assignment.status === 'PENDING';
                return true;
              })
              .map((assignment) => (
              <div
                key={assignment.id}
                className={`p-6 hover:bg-gray-50/80 transition-colors group ${
                  assignment.priority === 'CRITICAL' ? 'bg-red-50/30' : ''
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 shadow-sm uppercase tracking-wide uppercase tracking-wider ${
                        getPriorityStyle(assignment.priority)
                      }`}>
                        {getPriorityIcon(assignment.priority)}
                        {assignment.priority} PRIORITY
                      </span>
                      {getStatusBadge(assignment.status)}
                    </div>

                    <div className="mb-4">
                      <h3 className="font-extrabold text-gray-900 text-xl mb-1">
                        {assignment.patient_name || 'Patient'}
                      </h3>
                      <p className="text-sm text-gray-600 font-medium flex items-center gap-2 mb-1">
                        <FileText className="w-4 h-4 text-gray-400" />
                        Report: <span className="text-gray-900">{assignment.report_file_name}</span>
                      </p>
                      <p className="text-sm text-gray-500 font-medium flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        Assigned: {new Date(assignment.assigned_at).toLocaleString()}
                      </p>
                    </div>

                    {assignment.ai_analysis && (
                      <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                        <p className="text-sm font-bold text-gray-800 mb-3 border-b border-gray-100 pb-2">AI Analysis Summary</p>
                        
                        <div className="space-y-3">
                          {assignment.ai_analysis.severity_level && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-600 w-24">Severity:</span>
                              <span className={`text-sm font-bold px-2 py-0.5 rounded border ${
                                assignment.ai_analysis.severity_level === 'CRITICAL' ? 'bg-red-50 text-red-700 border-red-200' :
                                assignment.ai_analysis.severity_level === 'HIGH' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                assignment.ai_analysis.severity_level === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                'bg-green-50 text-green-700 border-green-200'
                              }`}>
                                {assignment.ai_analysis.severity_level}
                              </span>
                            </div>
                          )}

                          {assignment.ai_analysis.diagnoses?.length > 0 && (
                            <div className="flex items-start gap-2">
                              <span className="text-sm font-semibold text-gray-600 w-24 shrink-0">Diagnoses:</span>
                              <span className="text-sm text-gray-800 font-medium">
                                {assignment.ai_analysis.diagnoses.slice(0, 3).map(d => 
                                  typeof d === 'object' ? (d.diagnosis || d.name || 'Condition') : d
                                ).join(', ')}
                                {assignment.ai_analysis.diagnoses.length > 3 && '...'}
                              </span>
                            </div>
                          )}

                          {assignment.ai_analysis.abnormal_findings?.length > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-red-600 w-24">Abnormal:</span>
                              <span className="text-sm font-bold text-red-600 bg-red-50 px-2 rounded">
                                {assignment.ai_analysis.abnormal_findings.length} finding(s)
                              </span>
                            </div>
                          )}

                          {assignment.ai_analysis.clinical_suggestions?.length > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-blue-600 w-24">Suggestions:</span>
                              <span className="text-sm font-bold text-blue-700">
                                {assignment.ai_analysis.clinical_suggestions.length} suggestion(s) available
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {assignment.status === 'PENDING' && (
                      <div className="flex items-center gap-2 mt-4 text-sm font-bold pb-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-lg inline-flex border border-amber-100">
                        <Clock className="w-4 h-4" />
                        <span>
                          Expected response in {assignment.estimated_response_time_minutes} mins
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3 lg:flex-col lg:items-end lg:min-w-[180px]">
                    {assignment.status === 'PENDING' && (
                      <button
                        onClick={() => handleAcceptAssignment(assignment.id)}
                        className="btn-primary w-full sm:w-auto lg:w-full flex items-center justify-center font-bold tracking-wide"
                      >
                        Accept Case
                      </button>
                    )}
                    
                    <button
                      onClick={() => navigate(`/report/${assignment.report_id}`)}
                      className="btn-outline w-full sm:w-auto lg:w-full flex items-center justify-center group font-bold tracking-wide"
                    >
                      <FileText className="w-4 h-4 mr-1.5 text-primary-500" />
                      View Full Report
                      <ChevronRight className="w-4 h-4 ml-1 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </button>

                    {assignment.status !== 'PENDING' && (
                      <button
                        onClick={() => navigate(`/chat/${assignment.report_id}`)}
                        className="btn-primary w-full sm:w-auto lg:w-full flex items-center justify-center shadow-md shadow-primary-500/20"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Chat with Patient
                      </button>
                    )}

                    <button
                      onClick={() => handleArchiveReport(assignment.report_id, assignment.is_archived)}
                      className="btn-outline w-full sm:w-auto lg:w-full flex items-center justify-center text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-bold tracking-wide"
                    >
                      {assignment.is_archived ? (
                        <><Inbox className="w-4 h-4 mr-2 text-primary-500" /> Unarchive</>
                      ) : (
                        <><Archive className="w-4 h-4 mr-2 text-gray-500" /> Archive</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 bg-blue-50/50 border border-blue-200/60 rounded-2xl p-6 flex items-start gap-4 shadow-sm">
        <div className="bg-white p-2 text-primary-600 rounded-full shadow-sm border border-blue-100 shrink-0">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <p className="text-base font-bold text-blue-900">Clinical Decision Support</p>
          <p className="text-sm text-blue-800 font-medium mt-1 leading-relaxed">
            AI-generated suggestions are advisory only and should be used as clinical decision support. 
            All diagnoses, prescriptions, and medical decisions are the responsibility of the licensed physician.
          </p>
        </div>
      </div>
    </div>
  )
}
