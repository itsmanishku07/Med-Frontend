import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Bell, CheckCircle, AlertCircle, Info, MessageSquare, FileText, 
  Trash2, Check, Filter, Calendar, ArrowLeft
} from 'lucide-react'
import { useAuth } from '../contexts/FirebaseAuthContext'
import { toast } from 'react-hot-toast'
import api from '../services/api'
import ConfirmationModal from '../components/ConfirmationModal'

export default function Notifications() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, unread, read
  const [deleting, setDeleting] = useState(null)
  const [isDeleteAllReadModalOpen, setIsDeleteAllReadModalOpen] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications()
    }
  }, [isAuthenticated])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const response = await api.get('/notifications')
      if (response.data.success) {
        setNotifications(response.data.notifications || [])
      }
    } catch (error) {
      console.error('Failed to load notifications:', error)
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`)
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      )
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/mark-all-read')
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      toast.success('All notifications marked as read')
    } catch (error) {
      console.error('Failed to mark all as read:', error)
      toast.error('Failed to mark all as read')
    }
  }

  const deleteNotification = async (notificationId) => {
    try {
      setDeleting(notificationId)
      await api.delete(`/notifications/${notificationId}`)
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      toast.success('Notification deleted')
    } catch (error) {
      console.error('Failed to delete notification:', error)
      toast.error('Failed to delete notification')
    } finally {
      setDeleting(null)
    }
  }

  const deleteAllRead = async () => {
    setIsDeleteAllReadModalOpen(false)
    const readNotifications = notifications.filter(n => n.is_read)
    if (readNotifications.length === 0) {
      toast.error('No read notifications to delete')
      return
    }

    try {
      await Promise.all(
        readNotifications.map(n => api.delete(`/notifications/${n.id}`))
      )
      setNotifications(prev => prev.filter(n => !n.is_read))
      toast.success(`Deleted ${readNotifications.length} notifications`)
    } catch (error) {
      console.error('Failed to delete notifications:', error)
      toast.error('Failed to delete notifications')
    }
  }

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id)
    
    if (notification.related_id) {
      if (notification.type === 'NEW_MESSAGE') {
        navigate(`/chat/${notification.related_id}`)
      } else if (notification.type.includes('REPORT') || notification.type.includes('DOCTOR')) {
        navigate(`/report/${notification.related_id}`)
      }
    }
  }

  const getIcon = (type) => {
    switch (type) {
      case 'DOCTOR_ACCEPTED':
      case 'DOCTOR_ASSIGNED':
        return <CheckCircle className="w-6 h-6 text-green-500" />
      case 'CRITICAL_ALERT':
      case 'SYSTEM_ALERT':
        return <AlertCircle className="w-6 h-6 text-red-500" />
      case 'NEW_MESSAGE':
        return <MessageSquare className="w-6 h-6 text-blue-500" />
      case 'REPORT_ANALYZED':
      case 'DOCTOR_REVIEWED':
      case 'REPORT_UPLOADED':
        return <FileText className="w-6 h-6 text-purple-500" />
      default:
        return <Info className="w-6 h-6 text-gray-500" />
    }
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }

  const formatFullDate = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read
    if (filter === 'read') return n.is_read
    return true
  })

  const unreadCount = notifications.filter(n => !n.is_read).length

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-600">Please log in to view notifications</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        {}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Bell className="w-8 h-8 text-blue-600" />
                Notifications
              </h1>
              <p className="text-gray-600 mt-1">
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
              </p>
            </div>
          </div>
        </div>

        {}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'unread'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Unread ({unreadCount})
              </button>
              <button
                onClick={() => setFilter('read')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'read'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Read ({notifications.length - unreadCount})
              </button>
            </div>

            {}
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Check className="w-4 h-4" />
                  Mark all read
                </button>
              )}
              {notifications.filter(n => n.is_read).length > 0 && (
                <button
                  onClick={() => setIsDeleteAllReadModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete read
                </button>
              )}
            </div>
          </div>
        </div>

        {}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading notifications...</p>
            </div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {filter === 'unread' ? 'No unread notifications' : 
               filter === 'read' ? 'No read notifications' : 
               'No notifications yet'}
            </h3>
            <p className="text-gray-600">
              {filter === 'all' 
                ? "You'll see notifications here when there's activity"
                : `Switch to "${filter === 'unread' ? 'All' : 'Unread'}" to see other notifications`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-lg shadow-sm border transition-all hover:shadow-md ${
                  !notification.is_read 
                    ? 'border-l-4 border-l-blue-500 bg-blue-50' 
                    : 'border-gray-200'
                }`}
              >
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    {}
                    <div className="flex-shrink-0 mt-1">
                      {getIcon(notification.type)}
                    </div>

                    {}
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">
                          {notification.title}
                        </h3>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                        )}
                      </div>
                      
                      <p className="text-gray-700 text-sm mb-2 line-clamp-2">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatTime(notification.created_at)}
                        </span>
                        <span 
                          className="hover:text-gray-700"
                          title={formatFullDate(notification.created_at)}
                        >
                          {formatFullDate(notification.created_at)}
                        </span>
                      </div>
                    </div>

                    {}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!notification.is_read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            markAsRead(notification.id)
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteNotification(notification.id)
                        }}
                        disabled={deleting === notification.id}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete notification"
                      >
                        {deleting === notification.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent"></div>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {}
        {notifications.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Total: {notifications.length} notifications</span>
              <span>Unread: {unreadCount}</span>
              <span>Read: {notifications.length - unreadCount}</span>
            </div>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={isDeleteAllReadModalOpen}
        onClose={() => setIsDeleteAllReadModalOpen(false)}
        onConfirm={deleteAllRead}
        title="Delete Read Notifications"
        message={`Are you sure you want to delete all ${notifications.filter(n => n.is_read).length} read notifications? This action cannot be undone.`}
        confirmLabel="Delete All Read"
        cancelLabel="Keep Notifications"
        type="danger"
        icon={Trash2}
      />
    </div>
  )
}
