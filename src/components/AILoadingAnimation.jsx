import { useState, useEffect } from 'react'
import { Brain, Loader2, Activity } from 'lucide-react'

const contextMessages = {
  default: [
    "Loading your content...",
    "Preparing data...",
    "Almost ready...",
    "Just a moment..."
  ],
  interview: [
    "Analyzing candidate profile...",
    "Identifying key qualifications...",
    "Matching requirements...",
    "Preparing assessment questions...",
    "Generating interview framework...",
    "Finalizing questions...",
    "Almost complete..."
  ],
  jobs: [
    "Loading opportunities...",
    "Fetching job listings...",
    "Preparing details...",
    "Almost ready..."
  ],
  applications: [
    "Loading applications...",
    "Fetching status updates...",
    "Preparing information...",
    "Almost ready..."
  ],
  profile: [
    "Loading profile...",
    "Fetching information...",
    "Preparing data...",
    "Almost ready..."
  ],
  resume: [
    "Processing document...",
    "Analyzing content...",
    "Extracting information...",
    "Almost ready..."
  ],
  dashboard: [
    "Loading dashboard...",
    "Fetching data...",
    "Preparing overview...",
    "Almost ready..."
  ],
  search: [
    "Searching database...",
    "Finding matches...",
    "Preparing results...",
    "Almost ready..."
  ]
}

function AILoadingAnimation({ 
  message = "Loading...", 
  context = "default",
  size = "large",
  showFacts = false 
}) {
  const [currentMessage, setCurrentMessage] = useState(0)
  const [dots, setDots] = useState('')

  const messages = contextMessages[context] || contextMessages.default

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setCurrentMessage(prev => (prev + 1) % messages.length)
    }, 2000)

    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.')
    }, 400)

    return () => {
      clearInterval(messageInterval)
      clearInterval(dotsInterval)
    }
  }, [messages.length])

  if (size === "small") {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-blue-100 animate-spin">
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-600 rounded-full" />
          </div>
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 animate-pulse flex items-center justify-center">
            <Activity className="w-6 h-6 text-white" />
          </div>
        </div>
        <p className="text-blue-600 font-medium text-sm animate-pulse">
          {messages[currentMessage]}{dots}
        </p>
      </div>
    )
  }

  if (size === "medium") {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6">
        <div className="relative w-24 h-24 mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-blue-100 animate-[spin_3s_linear_infinite]">
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-600 rounded-full" />
          </div>
          <div className="absolute inset-3 rounded-full border-4 border-indigo-200 animate-[ping_2s_ease-in-out_infinite]" />
          <div className="absolute inset-5 rounded-full bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 animate-pulse flex items-center justify-center shadow-lg">
            <Brain className="w-8 h-8 text-white" />
          </div>
        </div>

        <h3 className="text-lg font-semibold text-gray-800 mb-2 text-center">{message}</h3>
        
        <p className="text-blue-600 font-medium animate-pulse mb-4">
          {messages[currentMessage]}{dots}
        </p>

        <div className="w-48 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-full animate-loading" />
        </div>

        <style>{`
          @keyframes loading {
            0% { width: 0%; margin-left: 0%; }
            50% { width: 60%; margin-left: 20%; }
            100% { width: 0%; margin-left: 100%; }
          }
          .animate-loading { animation: loading 1.5s ease-in-out infinite; }
        `}</style>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-8">
      <div className="relative w-32 h-32 mb-8">
        <div className="absolute inset-0 rounded-full border-4 border-blue-100 animate-[spin_3s_linear_infinite]">
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-blue-600 rounded-full" />
        </div>
        
        <div className="absolute inset-4 rounded-full border-4 border-indigo-200 animate-[ping_2s_ease-in-out_infinite]" />
        
        <div className="absolute inset-6 rounded-full bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 animate-pulse flex items-center justify-center shadow-lg shadow-blue-500/50">
          <Brain className="w-12 h-12 text-white animate-bounce" />
        </div>
      </div>

      <h3 className="text-xl font-semibold text-gray-800 mb-2 text-center">
        {message}
      </h3>

      <div className="h-8 flex items-center justify-center mb-6">
        <p className="text-blue-600 font-medium animate-pulse">
          {messages[currentMessage]}{dots}
        </p>
      </div>

      <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden mb-6">
        <div className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-full animate-loading" />
      </div>

      <style>{`
        @keyframes loading {
          0% { width: 0%; margin-left: 0%; }
          50% { width: 70%; margin-left: 15%; }
          100% { width: 0%; margin-left: 100%; }
        }
        .animate-loading { animation: loading 2s ease-in-out infinite; }
      `}</style>
    </div>
  )
}

export default AILoadingAnimation
