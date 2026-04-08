import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/FirebaseAuthContext'
import { Users, FileText, Activity, AlertTriangle, TrendingUp, Clock, CheckCircle, XCircle, Search, Filter, Database } from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../services/api'

export default function AdminDashboard() {
  const { userProfile } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDoctors: 0,
    totalPatients: 0,
    totalReports: 0,
    pendingReports: 0,
    analyzedReports: 0,
    criticalCases: 0,
    activeChats: 0
  })
  const [users, setUsers] = useState([])
  const [reports, setReports] = useState([])
  const [selectedTab, setSelectedTab] = useState('overview')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      const statsResponse = await api.get('/admin/dashboard')
      if (statsResponse.data.success) {
        setStats(statsResponse.data.stats)
      }

      const usersResponse = await api.get('/admin/users')
      if (usersResponse.data.success) {
        setUsers(usersResponse.data.users)
      }

      const reportsResponse = await api.get('/medical-reports/my-reports')
      if (reportsResponse.data.success) {
        setReports(reportsResponse.data.reports)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      const newStatus = !currentStatus
      const response = await api.put(`/admin/users/${userId}/status`, {
        active: newStatus
      })

      if (response.data.success) {
        toast.success(`User ${newStatus ? 'activated' : 'deactivated'} successfully`)
        fetchDashboardData()
      }
    } catch (error) {
      console.error('Error toggling user status:', error)
      toast.error('Failed to update user status')
    }
  }

  const handleChangeUserRole = async (userId, newRole) => {
    try {
      const response = await api.put(`/admin/users/${userId}/role`, {
        role: newRole
      })

      if (response.data.success) {
        toast.success(`User role updated to ${newRole}`)
        fetchDashboardData()
      }
    } catch (error) {
      console.error('Error changing user role:', error)
      toast.error('Failed to update user role')
    }
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
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2 font-medium">System management and analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/database-admin')}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition shadow-sm font-semibold"
          >
            <Database className="w-5 h-5" />
            Database Admin
          </button>
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-500 animate-pulse-slow" />
            <span className="text-sm font-bold text-gray-700">System Status: <span className="text-green-500">Online</span></span>
          </div>
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card p-6 flex flex-col justify-between group relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-100 rounded-full opacity-50 blur-xl"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Users</p>
              <p className="text-3xl font-extrabold text-gray-900 mt-1">{stats.totalUsers}</p>
              <p className="text-xs font-bold text-gray-400 mt-1">
                <span className="text-primary-600">{stats.totalDoctors}</span> Docs · <span className="text-purple-600">{stats.totalPatients}</span> Pts
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100 transform group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card p-6 flex flex-col justify-between group relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-green-100 rounded-full opacity-50 blur-xl"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Reports</p>
              <p className="text-3xl font-extrabold text-gray-900 mt-1">{stats.totalReports}</p>
              <p className="text-xs font-bold text-gray-400 mt-1">
                <span className="text-green-600">{stats.analyzedReports}</span> Analyzed
              </p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center border border-green-100 transform group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card p-6 flex flex-col justify-between group border-t-4 border-t-red-500 bg-red-50/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-red-100 rounded-full opacity-50 blur-xl"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-sm font-bold text-red-600 uppercase tracking-wider">Critical Cases</p>
              <p className="text-3xl font-extrabold text-red-700 mt-1 group-hover:text-red-800 transition-colors">{stats.criticalCases}</p>
              <p className="text-xs font-bold text-red-500/70 mt-1">Require attention</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center border border-red-200 transform group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="card p-6 flex flex-col justify-between group relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-purple-100 rounded-full opacity-50 blur-xl"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Active Chats</p>
              <p className="text-3xl font-extrabold text-gray-900 mt-1">{stats.activeChats}</p>
              <p className="text-xs font-bold text-gray-400 mt-1">Ongoing discussions</p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center border border-purple-100 transform group-hover:scale-110 transition-transform">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="mb-6 bg-white/60 backdrop-blur-md p-2 rounded-2xl shadow-sm border border-gray-100 flex gap-2 overflow-x-auto inline-flex">
        {['overview', 'users', 'reports', 'analytics'].map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={`px-6 py-2.5 font-bold text-sm capitalize transition-all rounded-xl whitespace-nowrap flex items-center gap-2 ${
              selectedTab === tab
                ? 'bg-primary-600 text-white shadow-md shadow-primary-500/30'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {}
      {selectedTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {reports.slice(0, 5).map((report) => (
                <div key={report.id} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0 hover:bg-gray-50/50 rounded-xl transition-colors px-2 -mx-2">
                  <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0 pb-1">
                    <p className="text-sm font-bold text-gray-900 truncate">{report.file_name}</p>
                    <p className="text-xs font-medium text-gray-500">
                      {new Date(report.uploaded_at).toLocaleString()}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap border uppercase tracking-wider ${
                    report.status === 'ANALYZED' ? 'bg-green-50 text-green-700 border-green-200' :
                    report.status === 'ANALYZING' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-gray-50 text-gray-700 border-gray-200'
                  }`}>
                    {report.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">System Health</h3>
            <div className="space-y-5">
              <div className="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl border border-gray-100 hover:bg-white hover:shadow-sm transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-sm font-bold text-gray-800">API Status</span>
                </div>
                <span className="text-sm font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-lg border border-green-100">Operational</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl border border-gray-100 hover:bg-white hover:shadow-sm transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-sm font-bold text-gray-800">Database</span>
                </div>
                <span className="text-sm font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-lg border border-green-100">Connected</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl border border-gray-100 hover:bg-white hover:shadow-sm transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-sm font-bold text-gray-800">AI Service</span>
                </div>
                <span className="text-sm font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-lg border border-green-100">Active</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl border border-gray-100 hover:bg-white hover:shadow-sm transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
                  <span className="text-sm font-bold text-gray-800">Storage</span>
                </div>
                <span className="text-sm font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">75% Used</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'users' && (
        <div className="card overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h3 className="text-lg font-bold text-gray-900">User Management</h3>
            <div className="flex items-center gap-2">
              <button className="btn-outline px-3 py-1.5 text-xs inline-flex items-center">
                <Filter className="w-3 h-3 mr-1" />
                Filter
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user.firebase_uid} className="hover:bg-primary-50/30 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                          {user.name?.charAt(0) || 'U'}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-bold text-gray-900">{user.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.role}
                        onChange={(e) => handleChangeUserRole(user.firebase_uid, e.target.value)}
                        className="text-xs font-bold text-gray-700 border border-gray-200 rounded-lg px-2 py-1.5 bg-gray-50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
                      >
                        <option value="PATIENT">Patient</option>
                        <option value="DOCTOR">Doctor</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                        user.is_active 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <button
                        onClick={() => handleToggleUserStatus(user.firebase_uid, user.is_active)}
                        className={`px-4 py-1.5 font-bold rounded-lg transition-all text-xs border ${
                          user.is_active
                            ? 'bg-white text-red-600 border-red-200 hover:bg-red-50 hover:shadow-sm'
                            : 'bg-white text-green-600 border-green-200 hover:bg-green-50 hover:shadow-sm'
                        }`}
                      >
                        {user.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedTab === 'reports' && (
        <div className="card overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h3 className="text-lg font-bold text-gray-900">All Reports</h3>
            <div className="flex items-center gap-2">
              <button className="btn-outline px-3 py-1.5 text-xs inline-flex items-center">
                <Filter className="w-3 h-3 mr-1" />
                Filter
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4">File Name</th>
                  <th className="px-6 py-4">Patient</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Severity</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-primary-50/30 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {report.file_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                      {report.patient_name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${
                        report.status === 'ANALYZED' ? 'bg-green-50 text-green-700 border-green-200' :
                        report.status === 'ANALYZING' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-gray-50 text-gray-700 border-gray-200'
                      }`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {report.ai_analysis?.severity_level ? (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${
                          report.ai_analysis.severity_level === 'CRITICAL' ? 'bg-red-50 text-red-700 border-red-200' :
                          report.ai_analysis.severity_level === 'HIGH' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                          report.ai_analysis.severity_level === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-green-50 text-green-700 border-green-200'
                        }`}>
                          {report.ai_analysis.severity_level}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs font-medium">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                      {new Date(report.uploaded_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <button
                        onClick={() => navigate(`/report/${report.id}`)}
                        className="text-primary-600 hover:text-primary-800 font-bold hover:underline"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Report Statistics</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <span className="text-sm font-bold text-gray-600">Total Reports</span>
                <span className="text-xl font-extrabold text-gray-900 bg-gray-100 px-3 py-1 rounded-lg">{stats.totalReports}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <span className="text-sm font-bold text-gray-600">Analyzed</span>
                <span className="text-xl font-extrabold text-green-700 bg-green-50 px-3 py-1 rounded-lg border border-green-100">{stats.analyzedReports}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <span className="text-sm font-bold text-gray-600">Pending</span>
                <span className="text-xl font-extrabold text-amber-600 bg-amber-50 px-3 py-1 rounded-lg border border-amber-100">{stats.pendingReports}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <span className="text-sm font-bold text-gray-600">Critical</span>
                <span className="text-xl font-extrabold text-red-600 bg-red-50 px-3 py-1 rounded-lg border border-red-100">{stats.criticalCases}</span>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">User Statistics</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <span className="text-sm font-bold text-gray-600">Total Users</span>
                <span className="text-xl font-extrabold text-gray-900 bg-gray-100 px-3 py-1 rounded-lg">{stats.totalUsers}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <span className="text-sm font-bold text-gray-600">Doctors</span>
                <span className="text-xl font-extrabold text-primary-600 bg-primary-50 px-3 py-1 rounded-lg border border-primary-100">{stats.totalDoctors}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <span className="text-sm font-bold text-gray-600">Patients</span>
                <span className="text-xl font-extrabold text-purple-600 bg-purple-50 px-3 py-1 rounded-lg border border-purple-100">{stats.totalPatients}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <span className="text-sm font-bold text-gray-600">Active Chats</span>
                <span className="text-xl font-extrabold text-green-600 bg-green-50 px-3 py-1 rounded-lg border border-green-100">{stats.activeChats}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
