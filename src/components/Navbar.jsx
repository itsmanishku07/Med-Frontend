import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/FirebaseAuthContext'
import { Menu, X, User, LogOut, Activity, Users, Home, FileText, MessageSquare, Bell, Pill } from 'lucide-react'
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

  const handleLogout = async () => {
    await logout()
    navigate('/login')
    setIsMobileMenuOpen(false)
  }

  const isActivePath = (path) => {
    return location.pathname === path
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
      name: 'My Reports',
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
      name: 'My Patients',
      path: '/doctor-dashboard',
      icon: Users,
      show: isDoctor || isAdmin
    },
    {
      name: 'Reminders',
      path: '/medicine-reminders',
      icon: Pill,
      show: isPatient
    },
    {
      name: 'Profile',
      path: '/profile',
      icon: User,
      show: isAuthenticated
    }
  ]

  return (
    <nav className={`fixed w-full top-0 z-50 transition-all duration-300 border-b ${
      scrolled 
        ? 'bg-white/80 backdrop-blur-xl border-gray-200 shadow-sm py-2' 
        : 'bg-white/50 backdrop-blur-md border-transparent py-4'
    }`}>
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex justify-between items-center relative">
          
          {/* Logo Area */}
          <Link to="/" className="flex items-center space-x-3 group relative z-10">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-500 flex items-center justify-center shadow-lg shadow-primary-500/30 group-hover:scale-105 transition-transform duration-300">
              <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent tracking-tight">
              MedReport <span className="text-primary-600">AI</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center justify-center space-x-2 absolute left-1/2 -translate-x-1/2">
            {navItems.filter(item => item.show).map((item) => {
              const Icon = item.icon
              const active = isActivePath(item.path)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 relative group overflow-hidden ${
                    active
                      ? 'text-primary-700 font-semibold bg-primary-50/80 shadow-sm'
                      : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-primary-600' : 'group-hover:text-primary-500 transition-colors'}`} />
                  <span className="text-sm">{item.name}</span>
                </Link>
              )
            })}
          </div>

          {/* Right Side Actions Desktop */}
          <div className="hidden md:flex items-center space-x-4 z-10">
            {isAuthenticated ? (
              <>
                <div className="mr-2">
                  <NotificationBell />
                </div>

                <div className="relative group">
                  <button className="flex items-center space-x-3 p-1 pr-3 rounded-full border border-gray-200 hover:border-primary-200 bg-white shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center shadow-inner">
                      <span className="text-white text-sm font-bold">
                        {userProfile?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-gray-700 hidden lg:block">
                      {userProfile?.name?.split(' ')[0]}
                    </span>
                  </button>
                  
                  {/* Dropdown menu */}
                  <div className="absolute right-0 mt-3 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-glass border border-white/60 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right group-hover:translate-y-0 translate-y-2 z-50">
                    <div className="p-5 border-b border-gray-100 bg-gradient-to-br from-primary-50/50 to-white rounded-t-2xl">
                      <p className="text-base font-bold text-gray-900 truncate">{userProfile?.name}</p>
                      <p className="text-sm text-gray-500 mt-1 truncate">{userProfile?.email}</p>
                      <span className="inline-flex items-center mt-3 px-2.5 py-1 bg-gradient-to-r from-primary-100 to-primary-50 text-primary-800 text-xs font-bold uppercase tracking-wider rounded-md border border-primary-200/50 shadow-sm">
                        {userProfile?.role === 'PATIENT' ? 'Patient' : 
                         userProfile?.role === 'DOCTOR' ? 'Doctor' : 'Administrator'}
                      </span>
                    </div>
                    <div className="p-2 space-y-1">
                      <Link
                        to="/profile"
                        className="flex items-center space-x-3 px-4 py-3 hover:bg-primary-50/80 rounded-xl transition-colors text-gray-700 hover:text-primary-700 font-medium group/item"
                      >
                        <User className="w-5 h-5 text-gray-400 group-hover/item:text-primary-500 transition-colors" />
                        <span>My Profile</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-red-50 rounded-xl transition-colors text-left text-gray-700 hover:text-red-700 font-medium group/item"
                      >
                        <LogOut className="w-5 h-5 text-gray-400 group-hover/item:text-red-500 transition-colors" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="px-5 py-2.5 text-gray-600 hover:text-primary-600 font-medium text-sm transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl font-medium text-sm shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 transition-all hover:-translate-y-0.5 active:scale-95"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors relative z-10"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        <div className={`md:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-glass transition-all duration-300 origin-top overflow-hidden ${
          isMobileMenuOpen ? 'max-h-[500px] opacity-100 visible py-4' : 'max-h-0 opacity-0 invisible py-0'
        }`}>
          <div className="px-4 space-y-1 pb-4">
            {isAuthenticated ? (
              <>
                <div className="p-4 bg-gradient-to-br from-primary-50/50 to-gray-50 rounded-2xl mb-4 border border-gray-100">
                  <p className="font-bold text-gray-900">{userProfile?.name}</p>
                  <p className="text-sm text-gray-500 mt-1">{userProfile?.email}</p>
                  <span className="inline-block mt-3 px-2 py-1 bg-primary-100 text-primary-800 text-xs font-bold uppercase tracking-wider rounded">
                    {userProfile?.role}
                  </span>
                </div>

                {navItems.filter(item => item.show).map((item) => {
                  const Icon = item.icon
                  const active = isActivePath(item.path)
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-colors font-medium ${
                        active
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${active ? 'text-primary-600' : 'text-gray-400'}`} />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}

                <div className="h-px bg-gray-100 my-2"></div>

                <Link
                  to="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center space-x-3 px-4 py-3.5 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors font-medium"
                >
                  <User className="w-5 h-5 text-gray-400" />
                  <span>My Profile</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-4 py-3.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <div className="space-y-3 pt-2">
                <Link
                  to="/home"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-4 py-3.5 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors font-medium"
                >
                  Home
                </Link>
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-4 py-3.5 text-center text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-xl transition-colors font-semibold"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-4 py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl transition-colors font-semibold text-center shadow-lg shadow-primary-500/20"
                >
                  Get Started Free
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar

