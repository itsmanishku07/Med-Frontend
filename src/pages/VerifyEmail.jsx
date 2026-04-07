import React, { useEffect, useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'
import { CheckCircle, XCircle, Loader2, Home } from 'lucide-react'
import toast from 'react-hot-toast'

const VerifyEmail = () => {
    const [searchParams] = useSearchParams()
    const [status, setStatus] = useState('verifying') // verifying, success, error
    const [message, setMessage] = useState('')
    const token = searchParams.get('token')
    const navigate = useNavigate()

    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                setStatus('error')
                setMessage('Invalid verification link. No token found.')
                return
            }

            try {
                const response = await authAPI.signupVerify({ token })
                if (response.data.success) {
                    setStatus('success')
                    setMessage(response.data.message)
                    toast.success('Email verified successfully!')
                } else {
                    setStatus('error')
                    setMessage(response.data.message || 'Verification failed')
                }
            } catch (error) {
                console.error('Verification error:', error)
                setStatus('error')
                setMessage(error.response?.data?.message || 'An error occurred during verification. The link might be expired.')
            }
        }

        verifyToken()
    }, [token])

    return (
        <div className="min-h-screen pt-16 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
            {/* Animated Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-300 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-pulse-slow"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary-300 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="max-w-md w-full z-10 animate-fade-in-up">
                <div className="bg-white/80 backdrop-blur-xl p-10 rounded-3xl shadow-glass border border-white/60 text-center">
                    
                    {status === 'verifying' && (
                        <div className="py-8">
                            <div className="flex justify-center mb-6">
                                <Loader2 className="w-16 h-16 text-primary-600 animate-spin" />
                            </div>
                            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-2">Verifying Your Email</h2>
                            <p className="text-gray-500 font-medium">Please wait while we confirm your account...</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="py-8">
                            <div className="flex justify-center mb-6">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center shadow-inner">
                                    <CheckCircle className="w-12 h-12 text-green-600" />
                                </div>
                            </div>
                            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-4">Email Verified!</h2>
                            <p className="text-gray-600 font-medium leading-relaxed mb-10">
                                {message}
                            </p>
                            <Link to="/login" className="btn-primary w-full py-4 text-base font-bold tracking-wide">
                                Proceed to Login
                            </Link>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="py-8">
                            <div className="flex justify-center mb-6">
                                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center shadow-inner">
                                    <XCircle className="w-12 h-12 text-red-600" />
                                </div>
                            </div>
                            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-4">Verification Failed</h2>
                            <p className="text-gray-600 font-medium leading-relaxed mb-6">
                                {message}
                            </p>
                            <div className="space-y-3">
                                <Link to="/register" className="btn-primary w-full py-4 text-base font-bold tracking-wide">
                                    Try Signing Up Again
                                </Link>
                                <Link to="/home" className="flex items-center justify-center space-x-2 text-gray-500 hover:text-primary-600 font-semibold transition-colors mt-4">
                                    <Home className="w-4 h-4" />
                                    <span>Back to Home</span>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default VerifyEmail
