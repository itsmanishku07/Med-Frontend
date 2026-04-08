import React, { createContext, useContext, useEffect, useState } from 'react'
import { authAPI } from '../services/mockApi'
import toast from 'react-hot-toast'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const mockUsers = {
    'admin@example.com': {
      uid: 'admin-123',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'ADMIN',
      password: 'password123'
    },
    'recruiter@example.com': {
      uid: 'recruiter-123',
      email: 'recruiter@example.com',
      name: 'Recruiter User',
      role: 'RECRUITER',
      password: 'password123'
    },
    'candidate@example.com': {
      uid: 'candidate-123',
      email: 'candidate@example.com',
      name: 'Candidate User',
      role: 'CANDIDATE',
      password: 'password123'
    }
  }

  useEffect(() => {
    const checkExistingSession = () => {
      const storedUser = localStorage.getItem('mockUser')
      const storedProfile = localStorage.getItem('mockUserProfile')
      
      if (storedUser && storedProfile) {
        setUser(JSON.parse(storedUser))
        setUserProfile(JSON.parse(storedProfile))
      }
      setLoading(false)
    }

    checkExistingSession()
  }, [])

  const generateMockToken = (userData) => {
    return btoa(JSON.stringify({
      uid: userData.uid,
      email: userData.email,
      role: userData.role,
      exp: Date.now() + (24 * 60 * 60 * 1000)
    }))
  }

  const login = async (email, password) => {
    try {
      setLoading(true)
      
      console.log('Login attempt:', { email, password: '***' })
      console.log('Available users:', Object.keys(mockUsers))
      
      const mockUser = mockUsers[email]
      console.log('Found user:', mockUser ? 'Yes' : 'No')
      
      if (!mockUser) {
        console.log('User not found for email:', email)
        throw new Error('Invalid email or password')
      }
      
      if (mockUser.password !== password) {
        console.log('Password mismatch for user:', email)
        throw new Error('Invalid email or password')
      }

      console.log('Login successful for:', email)

      const userData = {
        uid: mockUser.uid,
        email: mockUser.email,
        displayName: mockUser.name
      }

      const profileData = {
        uid: mockUser.uid,
        name: mockUser.name,
        email: mockUser.email,
        role: mockUser.role,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      localStorage.setItem('mockUser', JSON.stringify(userData))
      localStorage.setItem('mockUserProfile', JSON.stringify(profileData))
      localStorage.setItem('mockToken', generateMockToken(mockUser))

      setUser(userData)
      setUserProfile(profileData)
      
      toast.success('Login successful!')
      return { success: true, user: userData }
      
    } catch (error) {
      console.error('Login error:', error)
      toast.error(error.message || 'Login failed')
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const register = async (email, password, userData) => {
    try {
      setLoading(true)
      
      if (mockUsers[email]) {
        throw new Error('Email address is already registered')
      }

      const newUser = {
        uid: `user-${Date.now()}`,
        email: email,
        name: userData.name,
        role: userData.role,
        password: password
      }

      mockUsers[email] = newUser

      const userSession = {
        uid: newUser.uid,
        email: newUser.email,
        displayName: newUser.name
      }

      const profileData = {
        uid: newUser.uid,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      localStorage.setItem('mockUser', JSON.stringify(userSession))
      localStorage.setItem('mockUserProfile', JSON.stringify(profileData))
      localStorage.setItem('mockToken', generateMockToken(newUser))

      setUser(userSession)
      setUserProfile(profileData)
      
      toast.success('Registration successful!')
      return { success: true, user: userSession }
      
    } catch (error) {
      console.error('Registration error:', error)
      toast.error(error.message || 'Registration failed')
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      localStorage.removeItem('mockUser')
      localStorage.removeItem('mockUserProfile')
      localStorage.removeItem('mockToken')
      
      setUser(null)
      setUserProfile(null)
      toast.success('Logged out successfully')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Logout failed')
    }
  }

  const updateProfile = async (profileData) => {
    try {
      const updatedProfile = { ...userProfile, ...profileData }
      localStorage.setItem('mockUserProfile', JSON.stringify(updatedProfile))
      setUserProfile(updatedProfile)
      toast.success('Profile updated successfully')
      return { success: true }
    } catch (error) {
      console.error('Profile update error:', error)
      toast.error('Failed to update profile')
      return { success: false, error: error.message }
    }
  }

  const hasRole = (role) => {
    return userProfile?.role === role
  }

  const hasAnyRole = (roles) => {
    return roles.includes(userProfile?.role)
  }

  const value = {
    user,
    userProfile,
    loading,
    login,
    register,
    logout,
    updateProfile,
    hasRole,
    hasAnyRole,
    isAuthenticated: !!user && !!userProfile,
    isAdmin: userProfile?.role === 'ADMIN',
    isRecruiter: userProfile?.role === 'RECRUITER',
    isCandidate: userProfile?.role === 'CANDIDATE',
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}