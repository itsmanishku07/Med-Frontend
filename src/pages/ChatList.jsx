import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageSquare, Clock, User, Users, Search, Filter } from 'lucide-react'
import { useAuth } from '../contexts/FirebaseAuthContext'
import api from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'


function ChatList() {
  const { userProfile } = useAuth()
  const navigate = useNavigate()
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterUnread, setFilterUnread] = useState(false)

  useEffect(() => {
    loadChats()
  }, [])

  const loadChats = async () => {
    try {
      setLoading(true)
      const response = await api.get('/chats')
      
      if (response.data.success) {
        setChats(response.data.chats || [])
      }
    } catch (error) {
      console.error('Failed to load chats:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredChats = chats.filter(chat => {
    const searchMatch = !searchTerm || 
      (chat.patient_name && chat.patient_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (chat.doctor_name && chat.doctor_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (chat.last_message && chat.last_message.content && chat.last_message.content.toLowerCase().includes(searchTerm.toLowerCase()))

    const unreadMatch = !filterUnread || chat.unread_count > 0

    return searchMatch && unreadMatch
  })

  const formatTime = (timestamp) => {
    if (!timestamp) return ''
    
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  const getOtherParticipant = (chat) => {
    if (userProfile?.role === 'PATIENT') {
      return {
        name: chat.doctor_name || 'Doctor',
        role: 'Doctor'
      }
    } else {
      return {
        name: chat.patient_name || 'Patient',
        role: 'Patient'
      }
    }
  }

  const getLastMessagePreview = (chat) => {
    if (!chat.last_message) return 'No messages yet'
    
    const message = chat.last_message
    if (message.message_type === 'IMAGE') {
      return '📷 Image'
    }
    
    return message.content || 'Message'
  }

  const handleChatClick = (chat) => {
    navigate(`/chat/${chat.report_id}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Messages</h1>
          <p className="text-gray-600">
            {userProfile?.role === 'PATIENT' 
              ? 'Your conversations with doctors' 
              : 'Your conversations with patients'}
          </p>
        </div>

        {}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {}
            <button
              onClick={() => setFilterUnread(!filterUnread)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                filterUnread
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              Unread only
            </button>
          </div>
        </div>

        {}
        {filteredChats.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No conversations"
            description={
              chats.length === 0
                ? userProfile?.role === 'PATIENT'
                  ? "You haven't started any conversations with doctors yet."
                  : "You don't have any patient conversations yet."
                : "No conversations match your search criteria."
            }
          />
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {filteredChats.map((chat) => {
              const participant = getOtherParticipant(chat)
              const lastMessagePreview = getLastMessagePreview(chat)
              
              return (
                <div
                  key={chat.id}
                  onClick={() => handleChatClick(chat)}
                  className="flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                >
                  {}
                  <div className="flex-shrink-0 mr-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      {participant.role === 'Doctor' ? (
                        <User className="w-6 h-6 text-blue-600" />
                      ) : (
                        <Users className="w-6 h-6 text-green-600" />
                      )}
                    </div>
                  </div>

                  {}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {participant.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        {chat.unread_count > 0 && (
                          <span className="bg-blue-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                            {chat.unread_count}
                          </span>
                        )}
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(chat.last_message_at)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 truncate flex-1 mr-2">
                        {lastMessagePreview}
                      </p>
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                        {participant.role}
                      </span>
                    </div>
                  </div>

                  {}
                  {chat.unread_count > 0 && (
                    <div className="flex-shrink-0 ml-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {}
        {chats.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-500">
            Showing {filteredChats.length} of {chats.length} conversations
            {chats.filter(c => c.unread_count > 0).length > 0 && (
              <span className="ml-2">
                • {chats.filter(c => c.unread_count > 0).length} unread
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatList