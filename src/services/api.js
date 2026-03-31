import axios from 'axios'
import { auth } from '../config/firebase'
import toast from 'react-hot-toast'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  async (config) => {
    try {
      const user = auth.currentUser
      if (user) {
        const token = await user.getIdToken()
        config.headers.Authorization = `Bearer ${token}`
      }
    } catch (error) {
      console.error('Failed to get auth token:', error)
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname
      const isAuthPage = ['/login', '/register', '/'].includes(currentPath)
      const isProfileRequest = error.config?.url?.includes('/auth/profile')
      if (!isAuthPage && !isProfileRequest) {
        window.location.href = '/login'
      }
    }

    if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.')
    }

    if (error.code === 'ECONNABORTED' || !error.response) {
      toast.error('Network connection issue. Please check your internet.')
    }

    return Promise.reject(error)
  }
)

export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  autoRegister: (data = {}) => api.post('/auth/auto-register', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  validateToken: () => api.get('/auth/validate'),
}

export const medicalReportAPI = {
  upload: (formData) => api.post('/medical-reports/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  }),
  getMyReports: () => api.get('/medical-reports/my-reports'),
  getReport: (id) => api.get(`/medical-reports/${id}`),
  deleteReport: (id) => api.delete(`/medical-reports/${id}`),
  getStats: () => api.get('/medical-reports/stats'),
  analyzeReport: (id) => api.post(`/medical-reports/${id}/analyze`),
  assignDoctor: (id, doctorId) => api.post(`/medical-reports/${id}/assign-doctor`, { doctor_id: doctorId }),
  reviewReport: (id, notes) => api.post(`/medical-reports/${id}/review`, { notes }),
  archiveReport: (id, isArchived) => api.put(`/medical-reports/${id}/archive`, { is_archived: isArchived }),
  updateAiAnalysis: (id, aiAnalysis) => api.put(`/medical-reports/${id}/ai-analysis`, { ai_analysis: aiAnalysis }),
}

export const notificationAPI = {
  getNotifications: (params = {}) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/mark-all-read'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
}

export const chatAPI = {
  getChats: () => api.get('/chats'),
  getChatByReport: (reportId) => api.get(`/chats/report/${reportId}`),
  getMessages: (chatId) => api.get(`/chats/${chatId}/messages`),
  sendMessage: (chatId, message, messageType = 'TEXT', imageData = null, fileName = null) =>
    api.post(`/chats/${chatId}/messages`, {
      message,
      message_type: messageType,
      image_data: imageData,
      file_name: fileName,
    }),
}

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: () => api.get('/admin/users'),
  updateUserRole: (firebaseUid, role) => api.put(`/admin/users/${firebaseUid}/role`, { role }),
  updateUserStatus: (firebaseUid, active) => api.put(`/admin/users/${firebaseUid}/status`, { active }),
}

export default api
