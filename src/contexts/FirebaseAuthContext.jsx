import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  getAdditionalUserInfo
} from 'firebase/auth'
import { auth } from '../config/firebase'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'
import GoogleRoleModal from '../components/GoogleRoleModal'

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
  const [rolePromise, setRolePromise] = useState(null)
  const profileFetchedRef = useRef(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        
        if (!profileFetchedRef.current) {
          profileFetchedRef.current = true
          try {
            const response = await authAPI.getProfile()
            if (response.data.success) {
              setUserProfile(response.data.user)
            }
          } catch (error) {
            console.error('Failed to fetch user profile:', error)
            setUserProfile(null)
            profileFetchedRef.current = false
          } finally {
            setLoading(false)
          }
        } else {
          setLoading(false)
        }
      } else {
        setUser(null)
        setUserProfile(null)
        profileFetchedRef.current = false
        setLoading(false)
      }
    })

    return unsubscribe
  }, [])

  const login = async (email, password) => {
    try {
      setLoading(true)
      const result = await signInWithEmailAndPassword(auth, email, password)
      
      const response = await authAPI.getProfile()
      if (response.data.success) {
        setUserProfile(response.data.user)
        profileFetchedRef.current = true
        toast.success('Login successful!')
        return { success: true, user: result.user }
      }
    } catch (error) {
      console.error('Login error:', error)
      let message = 'Login failed'
      
      if (error.code === 'auth/user-not-found') {
        message = 'No account found with this email'
      } else if (error.code === 'auth/wrong-password') {
        message = 'Incorrect password'
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email address'
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many failed attempts. Please try again later'
      }
      
      toast.error(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const loginWithGoogle = async (role = null) => {
    try {
      setLoading(true)
      const googleProvider = new GoogleAuthProvider()
      googleProvider.setCustomParameters({ prompt: 'select_account' })
      
      const result = await signInWithPopup(auth, googleProvider)
      const additionalInfo = getAdditionalUserInfo(result)
      
      let finalRole = role;
      if (additionalInfo?.isNewUser && !finalRole) {
        finalRole = await new Promise((resolve) => {
          setRolePromise({ resolve });
        });
      } else if (!finalRole) {
        finalRole = 'PATIENT';
      }
      
      const response = await authAPI.autoRegister({ role: finalRole })
      if (response.data.success) {
        setUserProfile(response.data.user)
        profileFetchedRef.current = true
      }
      
      toast.success('Google sign-in successful!')
      return { success: true, user: result.user }
      
    } catch (error) {
      console.error('Google sign-in error:', error)
      let message = 'Google sign-in failed'
      
      if (error.code === 'auth/popup-closed-by-user') {
        message = 'Sign-in cancelled'
      } else if (error.code === 'auth/popup-blocked') {
        message = 'Popup blocked. Please allow popups and try again'
      }
      
      toast.error(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const register = async (email, password, userData) => {
    try {
      setLoading(true)
      
      profileFetchedRef.current = true;
      
      const result = await createUserWithEmailAndPassword(auth, email, password)
      
      const registrationData = {
        name: userData.name,
        email: email,
        role: userData.role
      }
      
      const response = await authAPI.register(registrationData)
      
      if (response.data.success) {
        setUserProfile(response.data.user)
        profileFetchedRef.current = true
        toast.success('Registration successful!')
        return { success: true, user: result.user }
      } else {
        await result.user.delete()
        throw new Error(response.data.message || 'Registration failed')
      }
    } catch (error) {
      console.error('Registration error:', error)
      
      if (auth.currentUser) {
        try {
          await auth.currentUser.delete()
        } catch (delError) {
          console.error("Cleanup of Firebase user failed:", delError)
        }
      }

      let message = 'Registration failed'
      
      if (error.code === 'auth/email-already-in-use') {
        message = 'Email address is already registered'
      } else if (error.code === 'auth/weak-password') {
        message = 'Password should be at least 6 characters'
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email address'
      } else if (error.response?.data?.message) {
        message = error.response.data.message
      }
      
      toast.error(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      setUser(null)
      setUserProfile(null)
      profileFetchedRef.current = false
      toast.success('Logged out successfully')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Logout failed')
    }
  }

  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData)
      if (response.data.success) {
        setUserProfile(response.data.user)
        toast.success('Profile updated successfully')
        return { success: true }
      }
    } catch (error) {
      console.error('Profile update error:', error)
      toast.error('Failed to update profile')
      return { success: false, error: error.message }
    }
  }

  const getToken = async () => {
    try {
      if (user) {
        const token = await user.getIdToken()
        return token
      }
      return null
    } catch (error) {
      console.error('Error getting token:', error)
      return null
    }
  }

  const value = {
    user,
    userProfile,
    loading,
    login,
    loginWithGoogle,
    register,
    logout,
    updateProfile,
    getToken,
    isAuthenticated: !!user && !!userProfile,
    isAdmin: userProfile?.role === 'ADMIN',
    isDoctor: userProfile?.role === 'DOCTOR',
    isPatient: userProfile?.role === 'PATIENT',
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
      <GoogleRoleModal 
        isOpen={!!rolePromise} 
        onSelectRole={(selectedRole) => {
          if (rolePromise) {
            rolePromise.resolve(selectedRole);
            setRolePromise(null);
          }
        }} 
      />
    </AuthContext.Provider>
  )
}