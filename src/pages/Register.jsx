import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/FirebaseAuthContext'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, Mail, Lock, User, Stethoscope } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'
import TermsModal from '../components/TermsModal'
import SignupFlowModal from '../components/SignupFlowModal'

const Register = () => {
  const { register: registerUser, loginWithGoogle, isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [isFlowModalOpen, setIsFlowModalOpen] = useState(false)
  const [pendingSignupData, setPendingSignupData] = useState(null)

  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const password = watch('password')

  React.useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, loading, navigate])

  const onSubmit = async (data) => {
    // Basic validations passed, now open the professional compliance/role modal
    setPendingSignupData(data)
    setIsFlowModalOpen(true)
  }

  const handleFlowComplete = async (selectedRole) => {
    if (!pendingSignupData) return
    
    setIsFlowModalOpen(false)
    setIsLoading(true)
    
    try {
      const response = await authAPI.signupRequest({
        email: pendingSignupData.email,
        password: pendingSignupData.password,
        name: pendingSignupData.name,
        role: selectedRole
      })

      if (response.data.success) {
        setIsEmailSent(true)
        toast.success('Verification email sent!')
      }
    } catch (error) {
      console.error('Registration failed:', error)
      toast.error(error.response?.data?.message || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true)
    try {
      // Role selection and Terms are now handled inside loginWithGoogle -> GoogleRoleModal
      const result = await loginWithGoogle()
      if (result.success) return
    } catch (error) {
      console.error('Google sign-up failed:', error)
      toast.error('Google sign-in failed. Please try again.')
    } finally {
      setIsGoogleLoading(false)
    }
  }

  if (isEmailSent) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary-300 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-pulse-slow"></div>
          <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-secondary-300 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="max-w-md w-full z-10 animate-fade-in-up uppercase">
          <div className="bg-white/80 backdrop-blur-xl p-10 rounded-3xl shadow-glass border border-white/60 text-center">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mb-8">
              <Mail className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-4">Check Your Email</h2>
            <p className="text-gray-600 font-medium leading-relaxed">
              We've sent a verification link to <span className="text-primary-600 font-bold block mt-1">{pendingSignupData?.email || watch('email')}</span>
            </p>
            <div className="mt-10 pt-8 border-t border-gray-100">
              <p className="text-sm text-gray-500 mb-6">Didn't receive the email? Check your spam folder.</p>
              <Link to="/login" className="btn-primary inline-block px-8 py-3 text-sm font-bold tracking-wide">
                Go to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-16 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary-300 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-secondary-300 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-2xl w-full z-10 animate-fade-in-up">
        <div className="bg-white/80 backdrop-blur-xl p-8 sm:p-12 rounded-[2.5rem] shadow-glass border border-white/60">
          <div className="text-center mb-10">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-3xl flex items-center justify-center mb-8 shadow-xl shadow-primary-500/30 transform hover:scale-105 transition-all duration-300">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h2 className="text-4xl font-black text-gray-900 tracking-tight">Join MedReport AI</h2>
            <p className="mt-3 text-gray-500 font-medium text-lg">
              Create your account to start analyzing reports
            </p>
          </div>

          <form className="space-y-8" onSubmit={handleSubmit(onSubmit)}>
            {}
            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={isGoogleLoading || isLoading}
              className="w-full flex items-center justify-center px-4 py-4 border-2 border-gray-100 rounded-2xl shadow-sm bg-white hover:bg-gray-50 text-gray-700 hover:border-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-lg hover:-translate-y-0.5"
            >
              {isGoogleLoading ? (
                <LoadingSpinner size="small" className="mr-2" />
              ) : (
                <svg className="w-6 h-6 mr-3 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              {isGoogleLoading ? 'Connecting...' : 'Continue with Google'}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
              <div className="relative flex justify-center text-sm">
                <span className="px-6 bg-white text-gray-400 font-bold uppercase tracking-widest text-xs">Or use email</span>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                {}
                <div>
                  <label htmlFor="name" className="block text-sm font-bold text-gray-700 mb-2 ml-1 uppercase tracking-wider">Full Name</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                    </div>
                    <input
                      {...register('name', { required: 'Full name is required', minLength: { value: 2, message: 'Minimum 2 characters' }})}
                      type="text"
                      className={`w-full pl-12 pr-5 py-4 bg-gray-50/50 border-2 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all font-medium ${errors.name ? 'border-red-400' : 'border-gray-100 hover:border-gray-200'}`}
                      placeholder="e.g. Jane Smith"
                    />
                  </div>
                  {errors.name && <p className="mt-2 text-sm text-red-500 ml-1 font-bold tracking-tight">{errors.name.message}</p>}
                </div>
                {}
                <div>
                  <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2 ml-1 uppercase tracking-wider">Email Address</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                    </div>
                    <input
                      {...register('email', { required: 'Email is required', pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email address' }})}
                      type="email"
                      className={`w-full pl-12 pr-5 py-4 bg-gray-50/50 border-2 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all font-medium ${errors.email ? 'border-red-400' : 'border-gray-100 hover:border-gray-200'}`}
                      placeholder="jane@example.com"
                    />
                  </div>
                  {errors.email && <p className="mt-2 text-sm text-red-500 ml-1 font-bold tracking-tight">{errors.email.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {}
                <div>
                  <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-2 ml-1 uppercase tracking-wider">Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                    </div>
                    <input
                      {...register('password', { required: 'Password required', minLength: { value: 6, message: 'Min 6 characters' }})}
                      type={showPassword ? 'text' : 'password'}
                      className={`w-full pl-12 pr-12 py-4 bg-gray-50/50 border-2 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all font-medium ${errors.password ? 'border-red-400' : 'border-gray-100 hover:border-gray-200'}`}
                      placeholder="••••••••"
                    />
                    <button type="button" className="absolute inset-y-0 right-0 pr-5 flex items-center" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-5 w-5 text-gray-400 hover:text-primary-600" /> : <Eye className="h-5 w-5 text-gray-400 hover:text-primary-600" />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-2 text-sm text-red-500 ml-1 font-bold tracking-tight">{errors.password.message}</p>}
                </div>

                {}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-bold text-gray-700 mb-2 ml-1 uppercase tracking-wider">Confirm</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                    </div>
                    <input
                      {...register('confirmPassword', { required: 'Confirm password', validate: value => value === password || 'Passwords must match' })}
                      type={showConfirmPassword ? 'text' : 'password'}
                      className={`w-full pl-12 pr-12 py-4 bg-gray-50/50 border-2 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all font-medium ${errors.confirmPassword ? 'border-red-400' : 'border-gray-100 hover:border-gray-200'}`}
                      placeholder="••••••••"
                    />
                    <button type="button" className="absolute inset-y-0 right-0 pr-5 flex items-center" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                      {showConfirmPassword ? <EyeOff className="h-5 w-5 text-gray-400 hover:text-primary-600" /> : <Eye className="h-5 w-5 text-gray-400 hover:text-primary-600" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="mt-2 text-sm text-red-500 ml-1 font-bold tracking-tight">{errors.confirmPassword.message}</p>}
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className="btn-primary w-full py-5 text-xl font-black tracking-widest uppercase shadow-2xl hover:shadow-primary-500/50 transition-all"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <LoadingSpinner size="small" className="mr-3" /> Processing...
                  </span>
                ) : 'Create Account'}
              </button>
            </div>

            <div className="text-center pt-4">
              <p className="text-gray-500 font-bold">
                Already have an account?{' '}
                <Link to="/login" className="text-primary-600 hover:text-primary-700 transition-colors ml-1 decoration-2 underline-offset-4 hover:underline">
                  Sign In
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      <SignupFlowModal 
        isOpen={isFlowModalOpen} 
        onComplete={handleFlowComplete}
        onCancel={() => setIsFlowModalOpen(false)}
      />
      <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
    </div>
  )
}

export default Register