import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/FirebaseAuthContext'
import LoadingSpinner from '../components/LoadingSpinner'


export default function Dashboard() {
  const { userProfile, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && userProfile) {
      switch (userProfile.role) {
        case 'PATIENT':
          navigate('/patient-dashboard', { replace: true })
          break
        case 'DOCTOR':
          navigate('/doctor-dashboard', { replace: true })
          break
        case 'ADMIN':
          navigate('/admin-dashboard', { replace: true })
          break
        default:
          navigate('/patient-dashboard', { replace: true })
      }
    }
  }, [userProfile, loading, navigate])

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <LoadingSpinner />
    </div>
  )
}
