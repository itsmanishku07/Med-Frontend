import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/FirebaseAuthContext'
import { Send, ArrowLeft, FileText, User, Circle, Image as ImageIcon, X, Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import socketService from '../services/socket'
import api from '../services/api'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import ConfirmationModal from '../components/ConfirmationModal'


export default function ChatRealtime() {
  const { reportId } = useParams()
  const navigate = useNavigate()
  const { userProfile, getToken } = useAuth()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [chat, setChat] = useState(null)
  const [connected, setConnected] = useState(false)
  const [typing, setTyping] = useState(null)
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    initializeChat()

    return () => {
      if (chat?.id) {
        socketService.leaveChat(chat.id)
      }
      socketService.off('new_message')
      socketService.off('user_typing')
      socketService.off('user_joined')
      socketService.off('user_left')
      socketService.disconnect()
    }
  }, [reportId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const initializeChat = async () => {
    try {
      setLoading(true)

      const token = await getToken()
      if (!token) {
        toast.error('Authentication required')
        navigate('/login')
        return
      }

      socketService.connect(token)
      setConnected(true)

      const response = await api.get(`/chats/report/${reportId}`)
      if (response.data.success) {
        const chatData = response.data.chat
        const messagesData = response.data.messages || []

        setChat(chatData)
        const sortedMessages = messagesData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        setMessages(sortedMessages)

        socketService.joinChat(chatData.id, (data) => {
          console.log('Joined chat room:', data)
          if (data.messages) {
            const sortedMessages = data.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
            setMessages(sortedMessages)
          }
        })

        socketService.onNewMessage((message) => {
          console.log('Received new message:', message)
          setMessages(prev => {
            const updated = [...prev, message]
            return updated.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
          })

          if (message.sender_id !== userProfile?.id) {
            socketService.markAsRead(chatData.id)
          }
        })

        socketService.onUserTyping((data) => {
          if (data.user_id !== userProfile?.id) {
            setTyping(data.is_typing ? data.user_name : null)

            if (data.is_typing) {
              setTimeout(() => setTyping(null), 3000)
            }
          }
        })

        socketService.onUserJoined((data) => {
          console.log('User joined:', data)
        })

        socketService.onUserLeft((data) => {
          console.log('User left:', data)
        })
      }
    } catch (error) {
      console.error('Error initializing chat:', error)
      toast.error('Failed to load chat')
    } finally {
      setLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result
      setSelectedImage({
        data: base64String,
        name: file.name,
        type: file.type
      })
      setImagePreview(base64String)
    }
    reader.onerror = () => {
      toast.error('Failed to read image')
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()

    if ((!newMessage.trim() && !selectedImage) || sending || !chat) return

    try {
      setSending(true)

      const messageText = newMessage.trim()
      const tempId = Date.now() // Temporary ID for optimistic update

      const messageType = selectedImage ? 'IMAGE' : 'TEXT'

      const optimisticMessage = {
        id: tempId,
        chat_id: chat.id,
        sender_id: userProfile?.id,
        sender_role: userProfile?.role,
        sender_name: userProfile?.name,
        message_type: messageType,
        content: messageText || null,
        image_data: selectedImage?.data || null,
        file_name: selectedImage?.name || null,
        timestamp: new Date().toISOString(),
        read: false
      }

      setMessages(prev => [...prev, optimisticMessage])

      setNewMessage('')
      handleRemoveImage()

      socketService.sendTyping(chat.id, false)

      socketService.sendMessage(
        chat.id,
        messageText || null,
        messageType,
        selectedImage?.data || null,
        selectedImage?.name || null
      )

    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleTyping = (e) => {
    setNewMessage(e.target.value)

    if (!chat) return

    socketService.sendTyping(chat.id, true)

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      socketService.sendTyping(chat.id, false)
    }, 2000)
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    }
  }

  const groupMessagesByDate = (messages) => {
    const groups = {}
    messages.forEach(msg => {
      const date = formatDate(msg.timestamp)
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(msg)
    })
    return groups
  }

  const handleDeleteChat = async () => {
    setIsDeleteModalOpen(false)
    
    try {
      const response = await api.delete(`/chats/${chat.id}`)
      if (response.data.success) {
        toast.success("Chat deleted successfully")
        navigate('/')
      } else {
        toast.error("Failed to delete chat")
      }
    } catch (error) {
      console.error("Error deleting chat:", error)
      toast.error("An error occurred while deleting the chat")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    )
  }

  if (!chat) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Chat not found</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const messageGroups = groupMessagesByDate(messages)

  return (
    <div className="flex flex-col h-screen bg-gray-50 pt-24">
      { }
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)} // Go back to previous page
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <User className="w-8 h-8 text-gray-400 bg-gray-100 rounded-full p-1.5" />
            <div>
              <h2 className="font-semibold text-gray-900">
                {userProfile?.role === 'DOCTOR' ? 'Patient' : 'Doctor'}
              </h2>
              <div className="flex items-center gap-1">
                <Circle className={`w-2 h-2 ${connected ? 'fill-green-500 text-green-500' : 'fill-gray-400 text-gray-400'}`} />
                <span className="text-xs text-gray-500">
                  {connected ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/report/${reportId}`)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <FileText className="w-4 h-4" />
            View Report
          </button>
          {chat && (
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete Chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Dashboard
          </button>
        </div>
      </div>

      { }
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {Object.entries(messageGroups).map(([date, msgs]) => (
          <div key={date}>
            { }
            <div className="flex items-center justify-center mb-4">
              <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                {date}
              </div>
            </div>

            { }
            <div className="space-y-3">
              {msgs.map((message, index) => {
                const isOwn = message.sender_id === userProfile?.id
                const showAvatar = index === 0 || msgs[index - 1].sender_id !== message.sender_id

                return (
                  <div
                    key={message.id || index}
                    className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {showAvatar && !isOwn && (
                      <User className="w-8 h-8 text-gray-400 bg-gray-200 rounded-full p-1.5 flex-shrink-0" />
                    )}
                    {!showAvatar && !isOwn && <div className="w-8" />}

                    <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}>
                      {showAvatar && !isOwn && (
                        <span className="text-xs text-gray-500 mb-1 px-3">
                          {message.sender_role === 'DOCTOR' ? 'Doctor' : 'Patient'}
                        </span>
                      )}
                      <div
                        className={`px-4 py-2 rounded-2xl ${isOwn
                          ? 'bg-blue-600 text-white rounded-br-sm'
                          : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm'
                          }`}
                      >
                        {message.message_type === 'IMAGE' && message.image_data && (
                          <div className="mb-2">
                            <img
                              src={message.image_data}
                              alt={message.file_name || 'Shared image'}
                              className="max-w-[300px] rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => window.open(message.image_data, '_blank')}
                            />
                          </div>
                        )}
                        {message.content && (
                          <div className="text-sm prose prose-sm max-w-none dark:prose-invert">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 mt-1 px-3">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>

                    {isOwn && <div className="w-8" />}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        { }
        {typing && (
          <div className="flex items-center gap-2">
            <User className="w-8 h-8 text-gray-400 bg-gray-200 rounded-full p-1.5" />
            <div className="bg-white border border-gray-200 px-4 py-2 rounded-2xl rounded-bl-sm">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      { }
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        { }
        {imagePreview && (
          <div className="mb-3 relative inline-block">
            <img
              src={imagePreview}
              alt="Preview"
              className="max-w-[200px] max-h-[200px] rounded-lg border-2 border-blue-500"
            />
            <button
              onClick={handleRemoveImage}
              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            {selectedImage?.name && (
              <p className="text-xs text-gray-500 mt-1 max-w-[200px] truncate">
                {selectedImage.name}
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending || !connected}
            className="p-3 text-gray-600 hover:bg-gray-100 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Attach image"
          >
            <ImageIcon className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            placeholder={selectedImage ? "Add a caption (optional)..." : "Type a message..."}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={sending || !connected}
          />
          <button
            type="submit"
            disabled={(!newMessage.trim() && !selectedImage) || sending || !connected}
            className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        {!connected && (
          <p className="text-xs text-red-500 mt-2 text-center">
            Disconnected. Trying to reconnect...
          </p>
        )}
      </div>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteChat}
        title="Delete Conversation"
        message="Are you sure you want to delete this conversation? All messages will be permanently removed. This action cannot be undone."
        confirmLabel="Delete Chat"
        cancelLabel="Keep Chat"
        type="danger"
        icon={Trash2}
      />
    </div>
  )
}
