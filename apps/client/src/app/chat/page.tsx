'use client'

import React, { useState } from 'react'
import LayoutWithSidebar from '../layout-with-sidebar'
import { Button } from '../../components/ui/button'
import { 
  MessageSquare, 
  Send,
  Paperclip,
  Smile,
  Phone,
  Video,
  MoreVertical,
  Search
} from 'lucide-react'

export default function ChatPage() {
  const [message, setMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  
  const conversations = [
    { 
      id: 1, 
      name: 'צוות פרויקט מגדל יוקרה', 
      lastMessage: 'האם התכנית החדשה מוכנה?',
      time: '14:30',
      unread: 2,
      isGroup: true
    },
    { 
      id: 2, 
      name: 'דוד כהן - מהנדס', 
      lastMessage: 'שלחתי את החישובים החדשים',
      time: '13:45',
      unread: 0,
      isGroup: false
    },
    { 
      id: 3, 
      name: 'שרה לוי - אדריכלית', 
      lastMessage: 'מתי נפגש לדיון על התכנית?',
      time: '12:20',
      unread: 1,
      isGroup: false
    },
  ]

  const messages = [
    { id: 1, sender: 'דוד כהן', message: 'שלום, איך הולך הפרויקט?', time: '14:30', isOwn: false },
    { id: 2, sender: 'אני', message: 'הולך מצוין! סיימנו את התכנית הראשונית', time: '14:32', isOwn: true },
    { id: 3, sender: 'דוד כהן', message: 'מעולה! מתי נוכל לראות את החישובים?', time: '14:35', isOwn: false },
    { id: 4, sender: 'אני', message: 'אני אכין אותם עד מחר בבוקר', time: '14:36', isOwn: true },
  ]

  const filteredConversations = conversations.filter(conv => 
    conv.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSendMessage = () => {
    if (message.trim()) {
      // Handle sending message
      console.log('Sending message:', message)
      setMessage('')
    }
  }

  return (
    <LayoutWithSidebar>
      <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900 mb-4">צ\'אט</h1>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="חיפוש שיחות..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conversation) => (
            <div key={conversation.id} className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">{conversation.name}</h3>
                <span className="text-xs text-gray-500">{conversation.time}</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{conversation.lastMessage}</p>
              {conversation.unread > 0 && (
                <div className="flex justify-end">
                  <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                    {conversation.unread}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-medium">ד.כ</span>
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">דוד כהן - מהנדס</h2>
                <p className="text-sm text-gray-500">מחובר</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Phone className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Video className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                msg.isOwn 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white border border-gray-200 text-gray-900'
              }`}>
                <p className="text-sm">{msg.message}</p>
                <p className={`text-xs mt-1 ${
                  msg.isOwn ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {msg.time}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm">
              <Paperclip className="w-4 h-4" />
            </Button>
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="הקלד הודעה..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <Button variant="ghost" size="sm">
              <Smile className="w-4 h-4" />
            </Button>
            <Button 
              onClick={handleSendMessage}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
      </div>
    </LayoutWithSidebar>
  )
}
