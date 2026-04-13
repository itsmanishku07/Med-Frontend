import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/FirebaseAuthContext'
import { Upload, FileText, Activity, MessageSquare, AlertCircle, CheckCircle, Clock, AlertTriangle, Info, ChevronRight, Trash2, X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../services/api'
import AnalysisProgressCard from '../components/AnalysisProgressCard'
import ConfirmationModal from '../components/ConfirmationModal'

export default function PatientDashboard() {
  const { userProfile } = useAuth()
  const navigate = useNavigate()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [stats, setStats] = useState({
    totalReports: 0,
    pendingReports: 0,
    reviewedReports: 0,
    criticalAlerts: 0
  })
  const [showFileModal, setShowFileModal] = useState(false)
  const [modalFileData, setModalFileData] = useState(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [reportToDelete, setReportToDelete] = useState(null)
  const [activeFilter, setActiveFilter] = useState('all') // 'all' or 'private'

  const pollRef = useRef(null)

  useEffect(() => {
    fetchReports()
    fetchStats()
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [activeFilter])

  useEffect(() => {
    const hasAnalysing = reports.some(r => r.status === 'ANALYZING' || r.status === 'PENDING')

    if (hasAnalysing && !pollRef.current) {
      pollRef.current = setInterval(async () => {
        const endpoint = activeFilter === 'private' ? '/medical-reports/private-reports' : '/medical-reports/my-reports'
        const updated = await api.get(endpoint).catch(() => null)
        if (!updated) return
        const list = updated.data.reports || []
        setReports(list)
        fetchStats()
        const stillAnalysing = list.some(r => r.status === 'ANALYZING' || r.status === 'PENDING')
        if (!stillAnalysing) {
          clearInterval(pollRef.current)
          pollRef.current = null
          toast.success('Report analysis complete!', { id: 'analysis-done' })
        }
      }, 5000)
    }

    if (!hasAnalysing && pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [reports])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const endpoint = activeFilter === 'private' ? '/medical-reports/private-reports' : '/medical-reports/my-reports'
      const response = await api.get(endpoint)
      setReports(response.data.reports || [])
    } catch (error) {
      console.error('Error fetching reports:', error)
      toast.error('Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await api.get('/medical-reports/stats')
      setStats(response.data.stats || stats)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    const allowedTypes = ['application/pdf', 'application/x-iwork-pages-sffpages', 'application/vnd.apple.pages', 'image/jpeg', 'image/png', 'image/jpg']
    if (!file.name.endsWith('.pages') && !allowedTypes.includes(file.type) && file.type !== '') {
      toast.error('Please upload PDF, Pages, or image files only')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('report_type', 'GENERAL')

    try {
      const response = await api.post('/medical-reports/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000
      })
      
      toast.success('Report uploaded — AI analysis started. Results will appear automatically.')
      fetchReports()
      fetchStats()
    } catch (error) {
      console.error('Error uploading report:', error)
      toast.error(error.response?.data?.message || 'Failed to upload report')
    } finally {
      setUploading(false)
      event.target.value = null
    }
  }

  const handleDeleteReport = async () => {
    if (!reportToDelete) return
    setIsDeleteModalOpen(false)
    
    try {
      toast.loading('Deleting report...', { id: 'delete-report' })
      const response = await api.delete(`/medical-reports/${reportToDelete}`)
      
      if (response.data.success) {
        toast.success('Report deleted successfully', { id: 'delete-report' })
        fetchReports()
        fetchStats()
      } else {
        toast.error('Failed to delete report', { id: 'delete-report' })
      }
    } catch (error) {
      console.error('Error deleting report:', error)
      toast.error('Failed to delete report', { id: 'delete-report' })
    } finally {
      setReportToDelete(null)
    }
  }

  const getSeverityStyle = (severity) => {
    const styles = {
      LOW: 'bg-green-100 text-green-800 border-green-200',
      MEDIUM: 'bg-amber-100 text-amber-800 border-amber-200',
      HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
      CRITICAL: 'bg-red-100 text-red-800 border-red-200'
    }
    return styles[severity] || styles.LOW
  }

  const handleViewOriginal = async (reportId) => {
    try {
      toast.loading('Fetching file...', { id: `fetch-file-${reportId}` })
      const response = await api.get(`/medical-reports/${reportId}/file`, {
        responseType: 'blob'
      })
      
      const file = new Blob([response.data], { type: response.headers['content-type'] })
      const fileURL = URL.createObjectURL(file)
      
      setModalFileData({ url: fileURL, type: response.headers['content-type'], name: 'Medical Report' })
      setShowFileModal(true)
      
      toast.success('File loaded', { id: `fetch-file-${reportId}` })
    } catch (error) {
      console.error('Error fetching file:', error)
      toast.error('Failed to open file', { id: `fetch-file-${reportId}` })
    }
  }

  const getStatusIcon = (status) => {
    const icons = {
      PENDING: <Clock className="w-5 h-5 text-gray-500" />,
      ANALYZING: <Activity className="w-5 h-5 text-primary-500 animate-pulse" />,
      ANALYZED: <CheckCircle className="w-5 h-5 text-green-500" />,
      REVIEWED: <CheckCircle className="w-5 h-5 text-green-600" />,
      FAILED: <AlertCircle className="w-5 h-5 text-red-500" />
    }
    return icons[status] || icons.PENDING
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
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Patient Dashboard</h1>
          <p className="text-gray-600 mt-2 font-medium">Welcome back, <span className="text-primary-600">{userProfile?.name}</span></p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary-500 animate-pulse-slow" />
          <span className="text-sm font-bold text-gray-700">System Status: <span className="text-green-500">Online</span></span>
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card p-6 flex items-center justify-between group">
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Reports</p>
            <p className="text-3xl font-extrabold text-gray-900 mt-2 group-hover:text-primary-600 transition-colors">{stats.totalReports}</p>
          </div>
          <div className="w-14 h-14 bg-blue-50/80 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300 shadow-inner">
            <FileText className="w-7 h-7 text-blue-600" />
          </div>
        </div>

        <div className="card p-6 flex items-center justify-between group">
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Pending Review</p>
            <p className="text-3xl font-extrabold text-gray-900 mt-2 group-hover:text-amber-600 transition-colors">{stats.pendingReports}</p>
          </div>
          <div className="w-14 h-14 bg-amber-50/80 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300 shadow-inner">
            <Clock className="w-7 h-7 text-amber-600" />
          </div>
        </div>

        <div className="card p-6 flex items-center justify-between group">
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Reviewed</p>
            <p className="text-3xl font-extrabold text-gray-900 mt-2 group-hover:text-green-600 transition-colors">{stats.reviewedReports}</p>
          </div>
          <div className="w-14 h-14 bg-green-50/80 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300 shadow-inner">
            <CheckCircle className="w-7 h-7 text-green-600" />
          </div>
        </div>

        <div className="card p-6 flex items-center justify-between group">
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Critical Alerts</p>
            <p className="text-3xl font-extrabold text-gray-900 mt-2 group-hover:text-red-600 transition-colors">{stats.criticalAlerts}</p>
          </div>
          <div className="w-14 h-14 bg-red-50/80 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300 shadow-inner">
            <AlertCircle className="w-7 h-7 text-red-600" />
          </div>
        </div>
      </div>

      {}
      <div className="card border-t-4 border-t-primary-500 p-8 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full opacity-50 mix-blend-multiply blur-xl font-sans"></div>
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Upload Medical Report</h2>
            <p className="text-sm text-gray-500 mt-1 font-medium">Get instant AI-driven preliminary analysis</p>
          </div>
        </div>
        
        <div className="border-2 border-dashed border-gray-300/80 rounded-2xl p-10 text-center hover:border-primary-400 hover:bg-primary-50/30 transition-all duration-300 relative z-10 group">
          <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-primary-100">
            <Upload className="w-10 h-10 text-primary-600" />
          </div>
          <p className="text-gray-800 font-bold text-lg mb-2">
            Drag & drop or click to upload
          </p>
          <p className="text-sm text-gray-500 mb-8 font-medium">
            Supported formats: PDF, Pages, JPG, PNG (Max 10MB)
          </p>
          <label className="inline-block relative">
            <input
              type="file"
              className="hidden"
              accept=".pdf,.pages,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
              disabled={uploading}
            />
            <span className={`px-8 py-3.5 rounded-xl font-bold cursor-pointer inline-flex items-center text-sm tracking-wide ${
              uploading
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'btn-primary shadow-lg shadow-primary-500/30'
            }`}>
              {uploading ? (
                <>
                  <Activity className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  Select File
                </>
              )}
            </span>
          </label>
        </div>
      </div>

      {}
      <div className="card overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-gray-900">My Medical Reports</h2>
          <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm self-start sm:self-auto">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                activeFilter === 'all'
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              All Reports
            </button>
            <button
              onClick={() => setActiveFilter('private')}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                activeFilter === 'private'
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Private Consults
            </button>
          </div>
        </div>
        
        {reports.length === 0 ? (
          <div className="p-16 text-center text-gray-500">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-100 shadow-sm">
              <FileText className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-xl font-bold text-gray-800 mb-2">No reports uploaded yet</p>
            <p className="text-sm text-gray-500 font-medium">Upload your first medical report to get started with AI analysis</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {reports.map((report) => (
              <div key={report.id} className="p-6 hover:bg-gray-50/80 transition-colors group">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <div className="p-2 border border-gray-100 rounded-lg bg-white shadow-sm">
                        {getStatusIcon(report.status)}
                      </div>
                      <h3 className="font-bold text-gray-900 text-lg">{report.file_name}</h3>
                      {report.ai_analysis?.severity_level && (
                        <span className={`px-3.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wide tracking-wider ${
                          getSeverityStyle(report.ai_analysis.severity_level)
                        }`}>
                          {report.ai_analysis.severity_level}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-500 mb-4 font-medium flex items-center">
                      <Clock className="w-4 h-4 mr-1.5 opacity-70" />
                      Uploaded: {new Date(report.uploaded_at).toLocaleDateString('en-US', { 
                        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>

                    {report.ai_analysis && Object.keys(report.ai_analysis).length > 0 && report.status !== 'ANALYZING' && report.status !== 'PENDING' ? (
                      <div className="space-y-3 bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                        {report.ai_analysis.diagnoses?.length > 0 && (
                          <div>
                            <span className="text-sm font-bold text-gray-700 block mb-1">Diagnoses: </span>
                            <div className="flex flex-wrap gap-2">
                              {report.ai_analysis.diagnoses.map((diag, i) => {
                                const displayDiag = typeof diag === 'object' ? (diag.diagnosis || diag.name || JSON.stringify(diag)) : diag;
                                return (
                                  <span key={i} className="inline-block px-3 py-1 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 font-medium">
                                    {displayDiag}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        
                        {report.ai_analysis.abnormal_findings?.length > 0 && (
                          <div className="flex items-center gap-2 mt-2">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                            <span className="text-sm font-bold text-red-600">
                              {report.ai_analysis.abnormal_findings.length} Abnormal finding(s) detected
                            </span>
                          </div>
                        )}

                        {report.assigned_doctor_id && (
                          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <MessageSquare className="w-4 h-4 text-primary-600" />
                            </div>
                            <span className="text-sm font-bold text-primary-700">
                              {report.assigned_doctor_name ? (
                                <>Shared with <span 
                                  className="text-primary-800 hover:underline cursor-pointer"
                                  onClick={() => navigate(`/doctor/${report.assigned_doctor_id}`)}
                                >
                                  Dr. {report.assigned_doctor_name}
                                </span></>
                              ) : (
                                "Doctor assigned for consultation"
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <AnalysisProgressCard
                        status={report.status}
                        uploadedAt={report.uploaded_at}
                      />
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3 lg:flex-col lg:items-end lg:min-w-[160px]">
                    <button
                      onClick={() => navigate(`/report/${report.id}`)}
                      className="btn-outline w-full sm:w-auto lg:w-full flex items-center justify-center group"
                    >
                      View Details
                      <ChevronRight className="w-4 h-4 ml-1.5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </button>
                    <button
                      onClick={() => handleViewOriginal(report.id)}
                      className="btn-outline w-full sm:w-auto lg:w-full flex items-center justify-center text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      View File
                    </button>
                    {report.assigned_doctor_id && (
                      <button
                        onClick={() => navigate(`/chat/${report.id}`)}
                        className="btn-primary w-full sm:w-auto lg:w-full flex items-center justify-center shadow-md shadow-primary-500/20"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Consult Doctor
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setReportToDelete(report.id);
                        setIsDeleteModalOpen(true);
                      }}
                      className="btn-outline w-full sm:w-auto lg:w-full flex items-center justify-center text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 transition-all shadow-sm"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 bg-blue-50/50 border border-blue-200/60 rounded-2xl p-6 flex items-start gap-4 shadow-sm">
        <div className="bg-white p-2 text-blue-600 rounded-full shadow-sm border border-blue-100 shrink-0">
          <Info className="w-6 h-6" />
        </div>
        <div>
          <p className="text-base font-bold text-blue-900">Medical Disclaimer</p>
          <p className="text-sm text-blue-800 font-medium mt-1 leading-relaxed">
            AI-generated analysis and suggestions are for informational purposes only. 
            All medical decisions must be made by licensed healthcare professionals. 
            Always consult with your doctor for proper diagnosis and treatment.
          </p>
        </div>
      </div>

      {showFileModal && modalFileData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-50 rounded-lg">
                  <FileText className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{modalFileData.name}</h3>
                  <p className="text-xs text-gray-500">{modalFileData.type}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={modalFileData.url}
                  download="medical_report"
                  className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  title="Download"
                >
                  <Upload className="w-5 h-5 rotate-180" />
                </a>
                <button
                  onClick={() => {
                    setShowFileModal(false)
                    URL.revokeObjectURL(modalFileData.url)
                  }}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-gray-100 overflow-auto p-4 flex items-center justify-center">
              {modalFileData.type.includes('pdf') ? (
                <iframe
                  src={modalFileData.url}
                  className="w-full h-full rounded-lg shadow-inner bg-white"
                  title="PDF Viewer"
                />
              ) : (
                <img
                  src={modalFileData.url}
                  alt="Medical Report"
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setReportToDelete(null)
        }}
        onConfirm={handleDeleteReport}
        title="Delete Medical Report"
        message="Are you sure you want to delete this report? This action is permanent and cannot be undone."
        confirmLabel="Delete Report"
        cancelLabel="Keep Report"
        type="danger"
        icon={Trash2}
      />
    </div>
  )
}
