import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, X, CheckCircle, AlertCircle, Info, MessageSquare, FileText } from 'lucide-react'
import { useAuth } from '../contexts/FirebaseAuthContext'
import { toast } from 'react-hot-toast'
import api from '../services/api'
import socketService from '../services/socket'


function NotificationBell() {
  const { isAuthenticated, userProfile, getToken } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const dropdownRef = useRef(null)
  const lastFetchRef = useRef(0)
  const CACHE_DURATION = 60000 // Cache for 1 minute

  useEffect(() => {
    console.log('🔔 NotificationBell useEffect - isAuthenticated:', isAuthenticated)
    if (isAuthenticated) {
      console.log('🔔 User is authenticated, loading notifications...')
      loadNotifications()
      setupWebSocket()
      
      // Increased polling interval to 2 minutes to reduce requests
      const interval = setInterval(loadNotifications, 120000)
      return () => {
        clearInterval(interval)
        socketService.off('new_notification')
      }
    } else {
      console.log('🔔 User is not authenticated, skipping notification load')
    }
  }, [isAuthenticated])

  const setupWebSocket = async () => {
    try {
      const token = await getToken()
      if (!token) return

      if (!socketService.isConnected()) {
        socketService.connect(token)
      }

      socketService.onNewNotification((notification) => {
        console.log('Received new notification:', notification)
        
        const notificationMessage = notification.message || 'You have a new notification'
        toast.success(notificationMessage, {
          duration: 4000,
          icon: notification.type === 'NEW_MESSAGE' ? '💬' : '🔔',
          onClick: () => {
            if (notification.chat_id) {
              navigate(`/chat/${notification.chat_id}`)
            }
          }
        })
        
        // Force refresh on new notification
        lastFetchRef.current = 0
        loadNotifications()
      })
    } catch (error) {
      console.error('Failed to setup WebSocket notifications:', error)
    }
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadNotifications = async () => {
    // Implement caching to prevent too many requests
    const now = Date.now()
    if (now - lastFetchRef.current < CACHE_DURATION) {
      console.log('🔔 Using cached notifications')
      return
    }

    try {
      // Single API call that returns both notifications and unread count
      const response = await api.get('/notifications', {
        params: { limit: 20 }
      })
      
      if (response.data.success) {
        const notifs = response.data.notifications || []
        setNotifications(notifs)
        
        // Calculate unread count from notifications instead of separate API call
        const count = notifs.filter(n => !n.is_read).length
        setUnreadCount(count)
        
        lastFetchRef.current = now
      }
    } catch (error) {
      console.error('Failed to load notifications:', error)
      // Don't retry immediately on error to avoid hammering the server
      lastFetchRef.current = now
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`)
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/mark-all-read')
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const getIcon = (type) => {
    switch (type) {
      case 'DOCTOR_ACCEPTED':
      case 'DOCTOR_ASSIGNED':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'CRITICAL_ALERT':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      case 'NEW_MESSAGE':
        return <MessageSquare className="w-5 h-5 text-blue-500" />
      case 'REPORT_ANALYZED':
      case 'DOCTOR_REVIEWED':
        return <FileText className="w-5 h-5 text-purple-500" />
      default:
        return <Info className="w-5 h-5 text-gray-500" />
    }
  }

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id)
    setIsOpen(false)
    
    if (notification.related_id) {
      if (notification.type === 'NEW_MESSAGE') {
        navigate(`/chat/${notification.related_id}`)
      } else if (notification.type.includes('REPORT') || notification.type.includes('DOCTOR')) {
        navigate(`/report/${notification.related_id}`)
      }
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
    return date.toLocaleDateString()
  }

  if (!isAuthenticated) return null

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {notifications.length > 0 && unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.is_read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    {getIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                      <p className="text-sm text-gray-600 line-clamp-2">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatTime(notification.created_at)}</p>
                    </div>
                    {!notification.is_read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setIsOpen(false)
                  navigate('/notifications')
                }}
                className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium py-2 hover:bg-blue-50 rounded transition-colors"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationBell
