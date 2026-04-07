import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/FirebaseAuthContext'
import { Menu, X, User, LogOut, Activity, Users, Home, FileText, MessageSquare, Bell, Pill, Calendar, ChevronRight, Clock } from 'lucide-react'
import NotificationBell from './NotificationBell'

const Navbar = () => {
  const { isAuthenticated, userProfile, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const isPatient = userProfile?.role === 'PATIENT'
  const isDoctor = userProfile?.role === 'DOCTOR'
  const isAdmin = userProfile?.role === 'ADMIN'

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
    setIsMobileMenuOpen(false)
  }

  const isActivePath = (path) => {
    if (path === '/' && location.pathname !== '/') return false
    return location.pathname.startsWith(path)
  }

  const navItems = [
    {
      name: 'Home',
      path: '/home',
      icon: Home,
      show: !isAuthenticated
    },
    {
      name: 'Dashboard',
      path: '/',
      icon: Activity,
      show: isAuthenticated
    },
    {
      name: 'Reports',
      path: '/patient-dashboard',
      icon: FileText,
      show: isPatient || isAdmin
    },
    {
      name: 'Messages',
      path: '/chats',
      icon: MessageSquare,
      show: isAuthenticated
    },
    {
      name: 'Doctors',
      path: '/doctors',
      icon: Users,
      show: isPatient || isAdmin
    },
    {
      name: 'Appointments',
      path: isPatient ? '/my-appointments' : '/doctor-appointments',
      icon: Calendar,
      show: isPatient || isDoctor
    },
    {
      name: 'Availability',
      path: '/doctor-availability',
      icon: Clock,
      show: isDoctor
    },
    {
      name: 'Patients',
      path: '/doctor-dashboard',
      icon: Users,
      show: isDoctor || isAdmin
    },
    {
      name: 'Reminders',
      path: '/medicine-reminders',
      icon: Pill,
      show: isPatient
    }
  ]

  return (
    <nav className={`fixed w-full top-0 z-50 transition-all duration-500 ${
      scrolled 
        ? 'bg-white/90 backdrop-blur-xl border-b border-gray-200 shadow-sm py-2' 
        : 'bg-transparent py-4 border-b border-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-12">
          
          {/* Logo Area */}
          <Link to="/" className="flex items-center group z-50 shrink-0">
            <div className="flex items-center justify-center group-hover:scale-105 transition-all duration-300">
              <img src="/logo.svg" alt="MedReport AI" className="h-14 w-auto" />
            </div>
          </Link>

          {/* Desktop Navigation - Hidden on lg and smaller if items are many, but here we use lg as breakpoint */}
          <div className="hidden lg:flex items-center justify-center flex-1 px-8 space-x-1">
            {navItems.filter(item => item.show).map((item) => {
              const Icon = item.icon
              const active = isActivePath(item.path)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-xl transition-all duration-200 ${
                    active
                      ? 'text-primary-700 font-semibold bg-primary-50'
                      : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm tracking-wide">{item.name}</span>
                </Link>
              )
            })}
          </div>

          {/* Right side actions - Desktop */}
          <div className="hidden lg:flex items-center space-x-4 z-50">
            {isAuthenticated ? (
              <>
                <NotificationBell />
                <div className="relative group">
                  <button className="flex items-center space-x-3 p-1 pr-3 rounded-full border border-transparent hover:border-gray-200 hover:bg-gray-50 transition-all">
                    <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center shadow-md">
                      <span className="text-white text-xs font-bold uppercase">
                        {userProfile?.name?.charAt(0)}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-gray-700 hidden xl:block">
                      {userProfile?.name?.split(' ')[0]}
                    </span>
                  </button>
                  
                  {/* Hover Dropdown */}
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-2 group-hover:translate-y-0">
                    <div className="p-4 border-b border-gray-50">
                      <p className="text-sm font-bold text-gray-900 truncate">{userProfile?.name}</p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{userProfile?.email}</p>
                    </div>
                    <div className="p-1.5">
                      <Link to="/profile" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium">My Profile</span>
                      </Link>
                      <button onClick={handleLogout} className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors">
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm font-medium">Log Out</span>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login" className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-primary-600">
                  Sign In
                </Link>
                <Link to="/register" className="px-5 py-2.5 text-sm font-bold text-white bg-primary-600 rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-500/20 transition-all active:scale-95">
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Actions (Icons) */}
          <div className="flex lg:hidden items-center space-x-3 z-50">
            {isAuthenticated && <NotificationBell />}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-all"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-30 transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Slider */}
      <div className={`lg:hidden fixed inset-y-0 right-0 w-4/5 max-w-sm bg-white z-40 shadow-2xl transition-all duration-300 ease-in-out transform ${
        isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="h-full flex flex-col pt-20 pb-6 px-6 overflow-y-auto">
          {isAuthenticated ? (
            <>
              {/* Mobile Profile Header */}
              <div className="mb-8 p-5 bg-gradient-to-br from-gray-50 to-white rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-primary-500/20">
                    {userProfile?.name?.charAt(0)}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h4 className="text-lg font-bold text-gray-900 truncate">{userProfile?.name}</h4>
                    <p className="text-xs text-gray-500 truncate">{userProfile?.email}</p>
                    <div className="mt-2 flex">
                      <span className="px-2 py-0.5 bg-primary-50 text-primary-700 text-[10px] font-bold uppercase tracking-wider rounded border border-primary-100">
                        {userProfile?.role}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Nav Links */}
              <div className="space-y-1 flex-1">
                {navItems.filter(item => item.show).map((item) => {
                  const Icon = item.icon
                  const active = isActivePath(item.path)
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      className={`flex items-center justify-between p-4 rounded-2xl transition-all ${
                        active ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <Icon className={`w-5 h-5 ${active ? 'text-primary-600' : 'text-gray-400'}`} />
                        <span className="font-bold text-base">{item.name}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${active ? 'text-primary-400' : 'text-gray-300'}`} />
                    </Link>
                  )
                })}
              </div>

              {/* Mobile Actions */}
              <div className="mt-auto space-y-3 pt-6 border-t border-gray-100">
                <Link to="/profile" className="flex items-center space-x-4 p-4 text-gray-600 font-bold hover:text-primary-600 transition-colors">
                  <User className="w-5 h-5 text-gray-400" />
                  <span>Account Settings</span>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-4 p-4 bg-red-50 text-red-600 rounded-2xl font-bold active:bg-red-100 transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Log Out</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col h-full">
              <div className="space-y-4">
                <Link to="/home" className="flex items-center justify-between p-4 text-gray-800 font-bold text-lg border-b border-gray-50">
                  Home
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </Link>
              </div>
              <div className="mt-auto space-y-4">
                <Link to="/login" className="block w-full py-4 text-center font-bold text-gray-700 bg-gray-100 rounded-2xl active:bg-gray-200 transition-colors">
                  Sign In
                </Link>
                <Link to="/register" className="block w-full py-4 text-center font-bold text-white bg-primary-600 rounded-2xl shadow-lg shadow-primary-500/30 active:scale-95 transition-all">
                  Get Started Free
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar

