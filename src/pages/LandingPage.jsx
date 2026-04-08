import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/FirebaseAuthContext'
import { 
  Upload, Activity, Shield, Users, 
  CheckCircle, ArrowRight, FileText, AlertCircle, Clock, TrendingUp
} from 'lucide-react'

function LandingPage() {
  const { isAuthenticated } = useAuth()

  const features = [
    {
      icon: Upload,
      title: 'Easy Report Upload',
      description: 'Upload medical reports in PDF or image format. Our AI extracts patient information, diagnoses, and test results automatically.',
      color: 'from-blue-500 to-cyan-400'
    },
    {
      icon: Activity,
      title: 'AI Medical Analysis',
      description: 'Advanced AI analyzes reports to extract vital signs, lab results, diagnoses, and identifies abnormal findings with severity classification.',
      color: 'from-primary-500 to-secondary-500'
    },
    {
      icon: AlertCircle,
      title: 'Clinical Decision Support',
      description: 'Get AI-powered advisory suggestions for medications, follow-up tests, and alerts for abnormal values. All suggestions reviewed by doctors.',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Users,
      title: 'Doctor Assignment',
      description: 'Critical cases are automatically assigned to available doctors with priority-based alerts for immediate attention.',
      color: 'from-emerald-400 to-teal-500'
    }
  ]

  const stats = [
    { value: '5,000+', label: 'Reports Analyzed', icon: FileText },
    { value: '200+', label: 'Active Doctors', icon: Users },
    { value: '95%', label: 'AI Accuracy', icon: TrendingUp },
    { value: '< 30min', label: 'Avg Response', icon: Clock }
  ]

  const benefits = [
    {
      title: 'For Patients',
      items: [
        'Quick AI analysis of medical reports',
        'Easy access to doctor consultations',
        'Secure storage of medical history',
        'Track report status in real-time'
      ],
      gradient: 'from-primary-50 to-primary-100/50'
    },
    {
      title: 'For Doctors',
      items: [
        'Priority-based case management',
        'AI-assisted clinical insights',
        'Efficient patient communication',
        'Reduced administrative workload'
      ],
      gradient: 'from-secondary-50 to-secondary-100/50'
    }
  ]

  return (
    <div className="min-h-screen pt-16 font-sans">
      {}
      <section className="relative overflow-hidden bg-slate-50 border-b border-gray-100 pb-20 pt-16 md:pt-28 md:pb-32">
        {}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-full pointer-events-none">
          <div className="absolute -top-40 -left-20 w-[600px] h-[600px] bg-primary-300 mix-blend-multiply filter blur-[100px] opacity-30 animate-pulse-slow"></div>
          <div className="absolute top-20 -right-20 w-[500px] h-[500px] bg-secondary-300 mix-blend-multiply filter blur-[100px] opacity-40 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
          <div className="absolute -bottom-40 left-1/4 w-[700px] h-[700px] bg-cyan-300 mix-blend-multiply filter blur-[120px] opacity-30 animate-pulse-slow" style={{ animationDelay: '4s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 bg-white/70 backdrop-blur-md px-5 py-2 rounded-full mb-8 border border-white shadow-soft animate-fade-in-up">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-500"></span>
            </span>
            <span className="text-sm font-semibold text-gray-700">AI-Powered Medical Report Analysis</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold mb-8 leading-tight text-gray-900 tracking-tight animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Smart Healthcare with <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-primary-600 via-secondary-500 to-primary-500 bg-clip-text text-transparent pb-2 inline-block">
              AI Clinical Support
            </span>
          </h1>
          
          <p className="text-lg md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Upload medical reports, get instant AI analysis, and connect with doctors for expert consultation in a highly secure environment.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            {isAuthenticated ? (
              <Link
                to="/"
                className="btn-primary flex items-center justify-center text-lg px-8 py-4 w-full sm:w-auto"
              >
                Go to Dashboard
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="btn-primary flex items-center justify-center text-lg px-8 py-4 w-full sm:w-auto"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <Link
                  to="/login"
                  className="btn-outline flex items-center justify-center text-lg px-8 py-4 w-full sm:w-auto !bg-white/70"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>

          <div className="mt-12 bg-amber-50/80 backdrop-blur-md border border-amber-200/50 rounded-2xl p-4 max-w-2xl mx-auto shadow-sm animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <p className="text-sm text-amber-800 flex items-center justify-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span><strong>Medical Disclaimer:</strong> AI suggestions are advisory only. All medical decisions must be made by licensed healthcare professionals.</span>
            </p>
          </div>
        </div>
      </section>

      {}
      <section className="py-16 bg-white relative -mt-10 mx-4 lg:mx-auto max-w-6xl rounded-3xl shadow-glass border border-gray-100 z-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-primary-50/30"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 px-6 lg:px-12 relative z-10">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-100 transition-colors duration-300">
                  <Icon className="w-8 h-8 text-primary-600 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-2 tracking-tight">
                  {stat.value}
                </div>
                <div className="text-gray-500 font-semibold">{stat.label}</div>
              </div>
            )
          })}
        </div>
      </section>

      {}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 leading-relaxed">
            <h2 className="text-primary-600 font-semibold tracking-wide uppercase text-sm mb-2">Capabilities</h2>
            <h3 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
              How It Works
            </h3>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Advanced AI technology combined with expert medical oversight for unparalleled precision.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className="card card-hover group h-full flex flex-col"
                >
                  <div className={`bg-gradient-to-br ${feature.color} w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg transform group-hover:-rotate-6 transition-transform duration-300`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-3 flex-1">
                    {feature.title}
                  </h4>
                  <p className="text-gray-500 leading-relaxed font-medium">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-secondary-50 rounded-full filter blur-[100px] opacity-70"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              Benefits for Everyone
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-10">
            {benefits.map((benefit, index) => (
              <div key={index} className={`bg-gradient-to-br ${benefit.gradient} rounded-3xl p-10 border border-white/60 shadow-glass hover:shadow-xl transition-all duration-300`}>
                <h3 className="text-3xl font-bold text-gray-900 mb-8 opacity-90">
                  {benefit.title}
                </h3>
                <ul className="space-y-5">
                  {benefit.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-center p-3 bg-white/60 backdrop-blur-sm rounded-xl">
                      <div className="bg-white rounded-full p-1 shadow-sm mr-4 shrink-0">
                        <CheckCircle className="w-5 h-5 text-primary-500" />
                      </div>
                      <span className="text-gray-800 font-medium text-lg">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-[2.5rem] p-12 md:p-16 text-white shadow-2xl relative overflow-hidden">
            
            {}
            <div className="absolute -right-32 -top-32 w-96 h-96 bg-primary-600/30 rounded-full filter blur-[80px]"></div>

            <div className="flex flex-col md:flex-row items-center justify-between relative z-10">
              <div className="mb-10 md:mb-0 md:mr-12 md:max-w-xl">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 border border-white/20">
                  <Shield className="w-8 h-8 text-primary-400" />
                </div>
                <h2 className="text-4xl lg:text-5xl font-extrabold mb-6 tracking-tight">
                  Your Data is Secure
                </h2>
                <p className="text-gray-300 text-xl mb-8 leading-relaxed font-light">
                  We prioritize patient privacy and data security with industry-leading encryption and HIPAA compliant infrastructure.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 mr-3 text-secondary-400" />
                    <span className="font-medium text-gray-200">HIPAA compliant</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 mr-3 text-secondary-400" />
                    <span className="font-medium text-gray-200">End-to-end encryption</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 mr-3 text-secondary-400" />
                    <span className="font-medium text-gray-200">Secure data storage</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 mr-3 text-secondary-400" />
                    <span className="font-medium text-gray-200">Strict access controls</span>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0 animate-float hidden md:block">
                <div className="w-[300px] h-[300px] bg-gradient-to-tr from-primary-500/20 to-secondary-500/20 backdrop-blur-xl border border-white/10 rounded-3xl flex items-center justify-center shadow-2xl">
                  <FileText className="w-40 h-40 text-white/40" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center bg-primary-50 rounded-[3rem] p-16 border border-primary-100 shadow-soft">
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-600 mb-10 font-medium">
            Join thousands of patients and doctors experiencing the future of healthcare.
          </p>
          {!isAuthenticated && (
            <div className="flex flex-col sm:flex-row gap-5 justify-center">
              <Link
                to="/register"
                className="btn-primary flex items-center justify-center text-lg px-8 py-4 w-full sm:w-auto"
              >
                Create Free Account
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                to="/login"
                className="flex items-center justify-center px-8 py-4 bg-white text-gray-800 rounded-xl font-semibold hover:bg-gray-50 transition-all border border-gray-200 shadow-sm w-full sm:w-auto"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </section>

      {}
      <footer className="bg-gray-900 text-gray-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2 lg:col-span-1">
              <Link to="/" className="inline-flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-white tracking-tight">MedReport AI</span>
              </Link>
              <p className="text-sm leading-relaxed mb-6">
                AI-powered medical report analysis bridging the gap between cutting-edge technology and expert human oversight.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-6 tracking-wide">Platform</h4>
              <ul className="space-y-3 text-sm">
                <li><Link to="/register" className="hover:text-primary-400 transition-colors">For Patients</Link></li>
                <li><Link to="/register" className="hover:text-primary-400 transition-colors">For Doctors</Link></li>
                <li><Link to="/login" className="hover:text-primary-400 transition-colors">Sign In</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-6 tracking-wide">Legal</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-primary-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary-400 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-primary-400 transition-colors">HIPAA Compliance</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-6 tracking-wide">Support</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-primary-400 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-primary-400 transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-primary-400 transition-colors">FAQs</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm">
            <p className="mb-4 md:mb-0">&copy; {new Date().getFullYear()} MedReport AI Platform. All rights reserved.</p>
            <p className="text-amber-500/80 font-medium">
              Disclaimer: AI suggestions are advisory only. Consult licensed professionals.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
