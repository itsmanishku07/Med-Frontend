import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/FirebaseAuthContext'
import { useNavigate } from 'react-router-dom'
import { 
  Activity, AlertCircle, Info, AlertTriangle, Download, 
  Search, RefreshCw, Zap, XCircle, Trash2, Settings 
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../services/api'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

const SystemLogs = () => {
  const { userProfile } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [statistics, setStatistics] = useState(null)
  const [logs, setLogs] = useState([])
  const [pagination, setPagination] = useState({})
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [logSettings, setLogSettings] = useState({ enabled: false, console_enabled: true })
  const [savingSettings, setSavingSettings] = useState(false)
  const [filters, setFilters] = useState({
    hours: 24,
    level: '',
    search: '',
    page: 1
  })

  useEffect(() => {
    if (userProfile?.role !== 'ADMIN') {
      navigate('/')
      return
    }
    loadSettings()
    loadStatistics()
    loadLogs()
  }, [userProfile, filters.page, filters.level, filters.hours])

  const loadSettings = async () => {
    try {
      const response = await api.get('/logs/settings')
      if (response.data.success) {
        setLogSettings(response.data.settings)
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }

  const loadStatistics = async () => {
    try {
      const response = await api.get('/logs/statistics', {
        params: { hours: filters.hours }
      })
      if (response.data.success) {
        setStatistics(response.data.statistics)
      }
    } catch (error) {
      console.error('Failed to load statistics:', error)
      setStatistics({
        total_requests: 0,
        total_errors: 0,
        total_warnings: 0,
        avg_response_time: 0,
        requests_by_hour: {},
        requests_by_endpoint: {},
        status_codes: {},
        recent_errors: []
      })
    } finally {
      setLoading(false)
    }
  }

  const loadLogs = async () => {
    try {
      const response = await api.get('/logs/list', {
        params: {
          page: filters.page,
          per_page: 50,
          level: filters.level,
          search: filters.search,
          hours: filters.hours
        }
      })
      if (response.data.success) {
        setLogs(response.data.logs)
        setPagination(response.data.pagination)
      }
    } catch (error) {
      console.error('Failed to load logs:', error)
    }
  }

  const handleDownload = async () => {
    try {
      const response = await api.get('/logs/download', {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'app.log')
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('Log file downloaded')
    } catch (error) {
      toast.error('Failed to download logs')
    }
  }

  const handleClearLogs = async () => {
    try {
      const response = await api.delete('/logs/clear')
      if (response.data.success) {
        toast.success('Logs cleared successfully')
        setShowClearConfirm(false)
        loadStatistics()
        loadLogs()
      }
    } catch (error) {
      toast.error('Failed to clear logs')
    }
  }

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, page: 1 }))
    loadLogs()
  }

  const handleToggleLogging = async (fileEnabled, consoleEnabled) => {
    setSavingSettings(true)
    try {
      const updates = {}
      if (fileEnabled !== logSettings.enabled) {
        updates.enabled = fileEnabled
      }
      if (consoleEnabled !== logSettings.console_enabled) {
        updates.console_enabled = consoleEnabled
      }
      
      const response = await api.put('/logs/settings', updates)
      if (response.data.success) {
        setLogSettings(response.data.settings)
        toast.success(response.data.message)
        setShowSettings(false)
        if (fileEnabled && !logSettings.enabled) {
          loadStatistics()
          loadLogs()
        }
      }
    } catch (error) {
      toast.error('Failed to update settings')
    } finally {
      setSavingSettings(false)
    }
  }

  const getLevelIcon = (level) => {
    switch (level) {
      case 'ERROR': return <XCircle className="w-4 h-4 text-red-500" />
      case 'WARNING': return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'INFO': return <Info className="w-4 h-4 text-blue-500" />
      default: return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  const getLevelColor = (level) => {
    switch (level) {
      case 'ERROR': return 'bg-red-50 text-red-700 border-red-200'
      case 'WARNING': return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'INFO': return 'bg-blue-50 text-blue-700 border-blue-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!statistics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const requestsChartData = Object.entries(statistics.requests_by_hour || {}).map(([hour, count]) => ({
    hour: new Date(hour).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    requests: count
  }))

  const endpointsChartData = Object.entries(statistics.requests_by_endpoint || {}).map(([endpoint, count]) => ({
    name: endpoint.length > 30 ? endpoint.substring(0, 30) + '...' : endpoint,
    value: count
  }))

  const statusCodesData = Object.entries(statistics.status_codes || {}).map(([code, count]) => ({
    name: code,
    value: count
  }))

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pt-20 sm:pt-24">
      <div className="max-w-7xl mx-auto">
        {}
        {showClearConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-4 sm:p-6 max-w-md w-full shadow-2xl">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">Clear All Logs?</h3>
                  <p className="text-xs sm:text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-sm sm:text-base text-gray-700 mb-6">
                Are you sure you want to delete all log entries? This will permanently remove all logs from the file.
              </p>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearLogs}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm sm:text-base"
                >
                  Clear Logs
                </button>
              </div>
            </div>
          </div>
        )}

        {}
        {showSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-4 sm:p-6 max-w-md w-full shadow-2xl">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">Log Settings</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Configure system logging</p>
                </div>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-sm sm:text-base">Enable File Logging</h4>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      Save application logs to file for monitoring and debugging
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleLogging(!logSettings.enabled, logSettings.console_enabled)}
                    disabled={savingSettings}
                    className={`ml-4 relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                      logSettings.enabled ? 'bg-primary-600' : 'bg-gray-200'
                    } ${savingSettings ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        logSettings.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-sm sm:text-base">Enable Console Logging</h4>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      Print logs to console (requires server restart)
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleLogging(logSettings.enabled, !logSettings.console_enabled)}
                    disabled={savingSettings}
                    className={`ml-4 relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                      logSettings.console_enabled ? 'bg-primary-600' : 'bg-gray-200'
                    } ${savingSettings ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        logSettings.console_enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {logSettings.enabled && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start space-x-2">
                      <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-xs sm:text-sm text-blue-800">
                        <p className="font-semibold mb-1">Logging is enabled</p>
                        <p>Logs are being saved to: <span className="font-mono">{logSettings.log_file_path}</span></p>
                        <p className="mt-1">Log level: <span className="font-semibold">{logSettings.log_level}</span></p>
                      </div>
                    </div>
                  </div>
                )}

                {!logSettings.enabled && (
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="text-xs sm:text-sm text-yellow-800">
                        <p className="font-semibold mb-1">Logging is disabled</p>
                        <p>No logs are being saved. Enable logging to monitor application activity.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium text-sm sm:text-base"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {}
        <div className="flex flex-col space-y-4 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">System Logs</h1>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  logSettings.enabled 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {logSettings.enabled ? 'Logging Active' : 'Logging Disabled'}
                </span>
              </div>
              <p className="text-sm sm:text-base text-gray-600 mt-1">Monitor application activity and performance</p>
            </div>
          </div>

          {}
          {!logSettings.enabled && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-yellow-900">Logging is Currently Disabled</h4>
                  <p className="text-xs sm:text-sm text-yellow-800 mt-1">
                    New logs are not being saved. You can view historical data below, but no new activity will be recorded until logging is enabled.
                  </p>
                  <button
                    onClick={() => setShowSettings(true)}
                    className="mt-2 text-xs sm:text-sm font-semibold text-yellow-900 hover:text-yellow-700 underline"
                  >
                    Enable Logging
                  </button>
                </div>
              </div>
            </div>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <select
              value={filters.hours}
              onChange={(e) => setFilters(prev => ({ ...prev, hours: parseInt(e.target.value) }))}
              className="w-full sm:w-auto px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
            >
              <option value={1}>Last Hour</option>
              <option value={6}>Last 6 Hours</option>
              <option value={24}>Last 24 Hours</option>
              <option value={168}>Last Week</option>
            </select>
            <div className="flex space-x-2 sm:space-x-3">
              <button
                onClick={() => { loadStatistics(); loadLogs(); }}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center space-x-2 text-sm sm:text-base"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center justify-center space-x-2 text-sm sm:text-base"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </button>
              <button
                onClick={() => setShowClearConfirm(true)}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center space-x-2 text-sm sm:text-base"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Clear</span>
              </button>
              <button
                onClick={handleDownload}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center justify-center space-x-2 text-sm sm:text-base"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download</span>
              </button>
            </div>
          </div>
        </div>

        {}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-2 sm:mb-0">
              <p className="text-xs sm:text-sm text-gray-600">Total Requests</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{statistics.total_requests || 0}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-2 sm:mb-0">
              <p className="text-xs sm:text-sm text-gray-600">Errors</p>
              <p className="text-xl sm:text-2xl font-bold text-red-600 mt-1">{statistics.total_errors || 0}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-2 sm:mb-0">
              <p className="text-xs sm:text-sm text-gray-600">Avg Response</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{statistics.avg_response_time || 0}ms</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-2 sm:mb-0">
              <p className="text-xs sm:text-sm text-gray-600">Warnings</p>
              <p className="text-xl sm:text-2xl font-bold text-yellow-600 mt-1">{statistics.total_warnings || 0}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {}
        <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-200">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Requests Over Time</h3>
          {requestsChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200} className="sm:h-[250px]">
              <LineChart data={requestsChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="requests" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] sm:h-[250px] flex items-center justify-center text-gray-500">
              <p className="text-sm">No data available</p>
            </div>
          )}
        </div>

        {}
        <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-200">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Status Codes</h3>
          {statusCodesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200} className="sm:h-[250px]">
              <PieChart>
                <Pie
                  data={statusCodesData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusCodesData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] sm:h-[250px] flex items-center justify-center text-gray-500">
              <p className="text-sm">No data available</p>
            </div>
          )}
        </div>
      </div>

      {}
      {endpointsChartData.length > 0 && (
        <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-200 mb-6 sm:mb-8">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Top Endpoints</h3>
          <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
            <BarChart data={endpointsChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {}
      {statistics.recent_errors && statistics.recent_errors.length > 0 && (
        <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-200 mb-6 sm:mb-8">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Recent Errors</h3>
          <div className="space-y-3">
            {statistics.recent_errors.slice(0, 5).map((error, index) => (
              <div key={index} className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-2 sm:space-y-0">
                  <div className="flex-1">
                    <p className="font-semibold text-red-900 text-sm sm:text-base">{error.error_type}</p>
                    <p className="text-xs sm:text-sm text-red-700 mt-1 break-all">{error.error}</p>
                    {error.path && <p className="text-xs text-red-600 mt-1 break-all">Path: {error.path}</p>}
                  </div>
                  <span className="text-xs text-red-600 whitespace-nowrap">
                    {new Date(error.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {}
      <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-200">
        <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between mb-4">
          <h3 className="text-base sm:text-lg font-bold text-gray-900">Log Entries</h3>
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <select
              value={filters.level}
              onChange={(e) => setFilters(prev => ({ ...prev, level: e.target.value, page: 1 }))}
              className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Levels</option>
              <option value="ERROR">Errors</option>
              <option value="WARNING">Warnings</option>
              <option value="INFO">Info</option>
            </select>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Search logs..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="flex-1 sm:w-64 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <button
                onClick={handleSearch}
                className="px-3 sm:px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex-shrink-0"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-3 max-h-[400px] sm:max-h-[600px] overflow-y-auto">
          {logs.map((log, index) => {
            let parsedData = null
            try {
              if (log.data) {
                parsedData = log.data
              }
            } catch (e) {
            }

            return (
              <div
                key={index}
                className={`rounded-lg border ${getLevelColor(log.level)} overflow-hidden hover:shadow-md transition-shadow`}
              >
                {}
                <div className="flex items-center justify-between px-4 py-2 bg-white bg-opacity-40 border-b border-current border-opacity-20">
                  <div className="flex items-center space-x-3">
                    {getLevelIcon(log.level)}
                    <span className="text-sm font-bold uppercase tracking-wide">{log.level}</span>
                    {log.type && (
                      <span className="text-xs px-2 py-1 bg-white bg-opacity-60 rounded font-semibold">
                        {log.type}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-semibold">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>

                {}
                <div className="p-4">
                  {parsedData ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {}
                      {parsedData.method && (
                        <div className="flex flex-col space-y-1">
                          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Method</span>
                          <span className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded font-mono text-sm font-semibold inline-block w-fit">
                            {parsedData.method}
                          </span>
                        </div>
                      )}
                      
                      {}
                      {parsedData.status_code && (
                        <div className="flex flex-col space-y-1">
                          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Status Code</span>
                          <span className={`px-3 py-1.5 rounded font-mono text-sm font-semibold inline-block w-fit ${
                            parsedData.status_code < 300 ? 'bg-green-100 text-green-800' :
                            parsedData.status_code < 400 ? 'bg-blue-100 text-blue-800' :
                            parsedData.status_code < 500 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {parsedData.status_code}
                          </span>
                        </div>
                      )}

                      {}
                      {parsedData.duration_ms !== undefined && (
                        <div className="flex flex-col space-y-1">
                          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Duration</span>
                          <span className={`px-3 py-1.5 rounded font-mono text-sm font-semibold inline-block w-fit ${
                            parsedData.duration_ms < 100 ? 'bg-green-100 text-green-800' :
                            parsedData.duration_ms < 500 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {parsedData.duration_ms}ms
                          </span>
                        </div>
                      )}

                      {}
                      {parsedData.user_email && (
                        <div className="flex flex-col space-y-1">
                          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">User</span>
                          <span className="px-3 py-1.5 bg-purple-50 text-purple-900 rounded text-sm font-medium inline-block w-fit">
                            {parsedData.user_email}
                          </span>
                        </div>
                      )}

                      {}
                      {parsedData.ip && (
                        <div className="flex flex-col space-y-1">
                          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">IP Address</span>
                          <span className="px-3 py-1.5 bg-gray-100 text-gray-800 rounded font-mono text-sm inline-block w-fit">
                            {parsedData.ip}
                          </span>
                        </div>
                      )}

                      {}
                      {parsedData.path && (
                        <div className="flex flex-col space-y-1 md:col-span-2">
                          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Path</span>
                          <div className="px-3 py-2 bg-gray-50 rounded border border-gray-200">
                            <span className="font-mono text-sm text-gray-900 break-all">{parsedData.path}</span>
                          </div>
                        </div>
                      )}

                      {}
                      {parsedData.error && (
                        <div className="flex flex-col space-y-1 md:col-span-2">
                          <span className="text-xs font-semibold text-red-600 uppercase tracking-wide">Error Details</span>
                          <div className="p-3 bg-red-50 rounded border border-red-200">
                            <div className="flex flex-col space-y-2">
                              {parsedData.error_type && (
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs font-semibold text-red-600">Type:</span>
                                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded font-mono text-xs font-semibold">
                                    {parsedData.error_type}
                                  </span>
                                </div>
                              )}
                              <div className="flex flex-col space-y-1">
                                <span className="text-xs font-semibold text-red-600">Message:</span>
                                <span className="text-sm text-red-900 break-all">{parsedData.error}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {}
                      {parsedData.message && !parsedData.error && (
                        <div className="flex flex-col space-y-1 md:col-span-2">
                          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Message</span>
                          <div className="px-3 py-2 bg-blue-50 rounded border border-blue-200">
                            <span className="text-sm text-gray-900">{parsedData.message}</span>
                          </div>
                        </div>
                      )}

                      {}
                      {parsedData.user_agent && (
                        <div className="flex flex-col space-y-1 md:col-span-2">
                          <details className="group">
                            <summary className="cursor-pointer text-xs font-semibold text-gray-600 uppercase tracking-wide hover:text-gray-900 flex items-center space-x-1">
                              <span>User Agent</span>
                              <svg className="w-4 h-4 transform group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </summary>
                            <div className="mt-2 px-3 py-2 bg-gray-50 rounded border border-gray-200">
                              <p className="font-mono text-xs text-gray-700 break-all">
                                {parsedData.user_agent}
                              </p>
                            </div>
                          </details>
                        </div>
                      )}
                    </div>
                  ) : (
                    
                    <div className="px-3 py-2 bg-gray-50 rounded border border-gray-200">
                      <p className="text-sm font-mono text-gray-800 break-all leading-relaxed">
                        {log.message}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {}
        {pagination.total_pages > 1 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 pt-4 border-t space-y-3 sm:space-y-0">
            <p className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
              Page {pagination.page} of {pagination.total_pages} ({pagination.total} total)
            </p>
            <div className="flex justify-center space-x-2">
              <button
                onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-3 py-1.5 sm:py-1 border border-gray-300 rounded-lg disabled:opacity-50 text-sm"
              >
                Previous
              </button>
              <button
                onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.total_pages}
                className="px-3 py-1.5 sm:py-1 border border-gray-300 rounded-lg disabled:opacity-50 text-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  )
}

export default SystemLogs
