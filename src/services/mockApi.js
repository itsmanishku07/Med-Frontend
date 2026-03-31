import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

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
      const mockToken = localStorage.getItem('mockToken')
      if (mockToken) {
        config.headers.Authorization = `Bearer ${mockToken}`
      }
    } catch (error) {
      console.error('Failed to get mock auth token:', error)
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Unauthorized access - redirecting to login')
      localStorage.removeItem('mockUser')
      localStorage.removeItem('mockUserProfile')
      localStorage.removeItem('mockToken')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  validateToken: () => api.get('/auth/validate'),
}

export const resumeAPI = {
  upload: (formData) => api.post('/resumes/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  getMyResumes: () => api.get('/resumes/my-resumes'),
  getResume: (id) => api.get(`/resumes/${id}`),
  deleteResume: (id) => api.delete(`/resumes/${id}`),
  getProcessedResumes: () => api.get('/resumes/processed'),
  reprocessResume: (id) => api.post(`/resumes/${id}/reprocess`),
}

export const jobAPI = {
  create: (jobData) => api.post('/jobs', jobData),
  getAll: () => api.get('/jobs'),
  getById: (id) => api.get(`/jobs/${id}`),
  getMyJobs: () => api.get('/jobs/my-jobs'),
  update: (id, jobData) => api.put(`/jobs/${id}`, jobData),
  delete: (id) => api.delete(`/jobs/${id}`),
}

export const matchAPI = {
  getByJobId: (jobId) => api.get(`/matches/job/${jobId}`),
  getByResumeId: (resumeId) => api.get(`/matches/resume/${resumeId}`),
  updateMatch: (matchId, data) => api.put(`/matches/${matchId}`, data),
  generateMatches: (jobId) => api.post(`/matches/generate/${jobId}`),
}

export const adminAPI = {
  getAllUsers: (limit = 50, startAfter = null) => 
    api.get('/admin/users', { params: { limit, startAfter } }),
  updateUserRole: (uid, role) => 
    api.put(`/admin/users/${uid}/role`, { role }),
  deactivateUser: (uid) => 
    api.put(`/admin/users/${uid}/deactivate`),
  getSystemStats: () => 
    api.get('/admin/stats'),
}

export default api