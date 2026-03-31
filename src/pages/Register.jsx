import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/FirebaseAuthContext'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, Mail, Lock, User, Stethoscope } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

const Register = () => {
  const { register: registerUser, loginWithGoogle, isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const password = watch('password')

  React.useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, loading, navigate])

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      const result = await registerUser(data.email, data.password, {
        name: data.name,
        role: data.role
      })
      if (result.success) return
    } catch (error) {
      console.error('Registration failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true)
    try {
      // Get the currently selected role from the form, default to PATIENT
      const selectedRole = watch('role') || 'PATIENT'
      const result = await loginWithGoogle(selectedRole)
      if (result.success) return
    } catch (error) {
      console.error('Google sign-up failed:', error)
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const roleOptions = [
    {
      value: 'PATIENT',
      label: 'Patient',
      description: 'Upload reports & get analysis',
      icon: User
    },
    {
      value: 'DOCTOR',
      label: 'Doctor',
      description: 'Review patient reports',
      icon: Stethoscope
    }
  ]

  return (
    <div className="min-h-screen pt-16 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary-300 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-secondary-300 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-xl w-full z-10 animate-fade-in-up">
        <div className="bg-white/80 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-glass border border-white/60">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-primary-500/30 transform hover:scale-105 transition-transform duration-300">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Create Account</h2>
            <p className="mt-3 text-sm text-gray-500 font-medium">
              Join our medical report analysis platform
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Google Signup */}
            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={isGoogleLoading || isLoading}
              className="w-full flex items-center justify-center px-4 py-3.5 border border-gray-200 rounded-xl shadow-sm bg-white/50 hover:bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold hover:-translate-y-0.5"
            >
              {isGoogleLoading ? (
                <LoadingSpinner size="small" className="mr-2" />
              ) : (
                <svg className="w-5 h-5 mr-3 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              {isGoogleLoading ? 'Signing up...' : 'Sign up with Google'}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white/80 text-gray-500 font-medium rounded-full">Or register with email</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Full Name</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                    </div>
                    <input
                      {...register('name', { required: 'Name required', minLength: { value: 2, message: 'Min 2 chars' }})}
                      type="text"
                      className={`w-full pl-11 pr-4 py-3 bg-white/50 border rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all ${errors.name ? 'border-red-400' : 'border-gray-200 hover:border-gray-300'}`}
                      placeholder="Jane Doe"
                    />
                  </div>
                  {errors.name && <p className="mt-1 text-sm text-red-500 ml-1 font-medium">{errors.name.message}</p>}
                </div>
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Email</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                    </div>
                    <input
                      {...register('email', { required: 'Email required', pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email' }})}
                      type="email"
                      className={`w-full pl-11 pr-4 py-3 bg-white/50 border rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all ${errors.email ? 'border-red-400' : 'border-gray-200 hover:border-gray-300'}`}
                      placeholder="user@example.com"
                    />
                  </div>
                  {errors.email && <p className="mt-1 text-sm text-red-500 ml-1 font-medium">{errors.email.message}</p>}
                </div>
              </div>

              {/* Account Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2.5 ml-1">Account Type</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {roleOptions.map((option) => {
                    const Icon = option.icon
                    return (
                      <label key={option.value} className="relative flex items-start p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-primary-50/50 hover:border-primary-200 transition-all group">
                        <input
                          {...register('role', { required: 'Please select account type' })}
                          type="radio"
                          value={option.value}
                          className="mt-1 h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500 bg-white"
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex items-center text-gray-900 group-hover:text-primary-700 transition-colors">
                            <Icon className="h-4 w-4 mr-1.5" />
                            <span className="font-bold text-sm tracking-wide">{option.label}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
                        </div>
                      </label>
                    )
                  })}
                </div>
                {errors.role && <p className="mt-1.5 text-sm text-red-500 ml-1 font-medium">{errors.role.message}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                    </div>
                    <input
                      {...register('password', { required: 'Required', minLength: { value: 6, message: 'Min 6 chars' }})}
                      type={showPassword ? 'text' : 'password'}
                      className={`w-full pl-11 pr-10 py-3 bg-white/50 border rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all ${errors.password ? 'border-red-400' : 'border-gray-200 hover:border-gray-300'}`}
                      placeholder="Create password"
                    />
                    <button type="button" className="absolute inset-y-0 right-0 pr-4 flex items-center" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-5 w-5 text-gray-400 hover:text-primary-600" /> : <Eye className="h-5 w-5 text-gray-400 hover:text-primary-600" />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1 text-sm text-red-500 ml-1 font-medium">{errors.password.message}</p>}
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Confirm Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                    </div>
                    <input
                      {...register('confirmPassword', { required: 'Required', validate: value => value === password || 'No match' })}
                      type={showConfirmPassword ? 'text' : 'password'}
                      className={`w-full pl-11 pr-10 py-3 bg-white/50 border rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all ${errors.confirmPassword ? 'border-red-400' : 'border-gray-200 hover:border-gray-300'}`}
                      placeholder="Confirm password"
                    />
                    <button type="button" className="absolute inset-y-0 right-0 pr-4 flex items-center" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                      {showConfirmPassword ? <EyeOff className="h-5 w-5 text-gray-400 hover:text-primary-600" /> : <Eye className="h-5 w-5 text-gray-400 hover:text-primary-600" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="mt-1 text-sm text-red-500 ml-1 font-medium">{errors.confirmPassword.message}</p>}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className="btn-primary w-full py-3.5 text-base font-bold tracking-wide"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <LoadingSpinner size="small" className="mr-2" /> Creating account...
                  </span>
                ) : 'Create Account'}
              </button>
            </div>

            <div className="text-center mt-6">
              <p className="text-sm font-medium text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="text-primary-600 hover:text-primary-700 font-bold transition-colors">
                  Sign In
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Register