import React from 'react';
import { 
  Brain, MessageSquare, Calendar, ShieldCheck, Smartphone, Zap, 
  Activity, ChevronRight, BookOpen, HelpCircle, Heart, Cloud, 
  Users, Database
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AppDocs = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: "AI Medical Report Analysis",
      icon: <Brain className="w-8 h-8 text-purple-600" />,
      description: "Our core technology uses advanced AI to process and understand your medical documents.",
      features: [
        "Instant OCR: Extract text from PDFs and handwritten medical notes.",
        "Smart Extraction: Automatically identifies vitals, diagnoses, and lab results.",
        "Severity Assessment: Flags critical values that require immediate attention.",
        "Specialty Detection: Directs your report to the right medical department automatically."
      ],
      gradient: "from-purple-50 to-indigo-50"
    },
    {
      title: "AI Health Assistant",
      icon: <Zap className="w-8 h-8 text-yellow-600" />,
      description: "A personalized AI that understands your health history and provides instant answers.",
      features: [
        "Report Interrogation: Ask anything like 'What does this hemoglobin level mean?'",
        "Medicine Database: Get detailed info on dosage, side effects, and precautions.",
        "Health Trends: Visualizes your health progress over time with extracted data.",
        "Context-Aware: Understands your previous reports for more accurate health advice."
      ],
      gradient: "from-yellow-50 to-orange-50"
    },
    {
      title: "Real-time Consultations",
      icon: <MessageSquare className="w-8 h-8 text-blue-600" />,
      description: "Seamlessly connect with specialized doctors directly through the platform.",
      features: [
        "Secure Chat: End-to-end communication with your assigned doctor.",
        "Media Sharing: Share images or additional documents during the chat.",
        "Auto-Context: Doctors see your AI-analyzed reports before they start talking.",
        "Read Receipts: Know when your doctor has reviewed your messages."
      ],
      gradient: "from-blue-50 to-cyan-50"
    },
    {
      title: "Appointment Management",
      icon: <Calendar className="w-8 h-8 text-green-600" />,
      description: "Book and manage medical visits with ease based on your report findings.",
      features: [
        "Specialist Matching: Suggests the best doctors for your specific condition.",
        "Real-time Availability: See doctor slots and book instantly.",
        "Automated Reminders: Get notified before your appointment starts.",
        "Digital History: Keep track of all your past and upcoming visits."
      ],
      gradient: "from-green-50 to-emerald-50"
    },
    {
      title: "Medicine Reminders",
      icon: <Heart className="w-8 h-8 text-red-600" />,
      description: "Never miss a dose with our AI-enhanced medication tracking system.",
      features: [
        "Smart Schedules: Set recurring reminders for daily or weekly meds.",
        "AI Info Cards: Each reminder shows vital info about the medicine.",
        "Adherence Tracking: Keep a log of your medication intake.",
        "Multi-User Support: Manage family members' medications easily."
      ],
      gradient: "from-red-50 to-rose-50"
    },
    {
      title: "Security & Privacy",
      icon: <ShieldCheck className="w-8 h-8 text-teal-600" />,
      description: "Your health data is protected with state-of-the-art security measures.",
      features: [
        "Firebase Auth: Secure login with multi-factor authentication support.",
        "Role-Based Access: Patients only see their data; Doctors only see assigned cases.",
        "Encrypted Storage: Your medical files are stored securely in the cloud.",
        "Consent Control: Revoke doctor access to your reports at any time."
      ],
      gradient: "from-teal-50 to-green-50"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full mb-4">
            <BookOpen className="w-4 h-4" />
            <span className="text-sm font-bold uppercase tracking-wider">Documentation</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Everything you need to know about MedReport AI
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our platform combines cutting-edge AI with secure medical coordination to provide you with the most comprehensive health management experience.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sections.map((section, index) => (
            <div 
              key={index} 
              className={`group p-8 rounded-3xl bg-gradient-to-br ${section.gradient} border border-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2`}
            >
              <div className="bg-white p-4 rounded-2xl shadow-sm w-fit mb-6 transition-transform group-hover:scale-110">
                {section.icon}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{section.title}</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                {section.description}
              </p>
              <ul className="space-y-3">
                {section.features.map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-start gap-3 text-sm text-gray-700">
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* System Stats / Infrastructure Section */}
        <div className="mt-20 bg-white rounded-3xl p-8 md:p-12 shadow-2xl border border-gray-100 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 text-blue-50 opacity-10">
            <Activity className="w-64 h-64" />
          </div>
          <div className="relative z-10 max-w-4xl mx-auto">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center justify-center gap-3">
                <Database className="w-8 h-8 text-blue-600" />
                Robust Infrastructure
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-xl h-fit">
                    <Smartphone className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Multi-Platform Access</h4>
                    <p className="text-gray-600 text-sm">Access your reports through our responsive Web Dashboard or native Android Application.</p>
                  </div>
                </div>
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="bg-green-100 p-3 rounded-xl h-fit">
                    <Cloud className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Cloud-Native Processing</h4>
                    <p className="text-gray-600 text-sm">Our backends are optimized for speed, handling complex AI analysis in seconds.</p>
                  </div>
                </div>
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="bg-purple-100 p-3 rounded-xl h-fit">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Admin Control Panel</h4>
                    <p className="text-gray-600 text-sm">Full system transparency with real-time logging and user moderation.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Help Card */}
        <div className="mt-12 flex flex-col items-center">
            <button 
                onClick={() => navigate('/home')}
                className="flex items-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-xl active:scale-95"
            >
                Back to Dashboard
                <ChevronRight className="w-5 h-5" />
            </button>
            <p className="mt-6 text-gray-500 flex items-center gap-2">
                Need more help? <HelpCircle className="w-4 h-4" /> Visit our <span className="text-blue-600 cursor-pointer hover:underline">Help Center</span>
            </p>
        </div>
      </div>
    </div>
  );
};

// Internal icon for bullet points
const CheckCircle = ({ className }) => (
  <svg 
    className={className} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth="2" 
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    ></path>
  </svg>
);

export default AppDocs;
