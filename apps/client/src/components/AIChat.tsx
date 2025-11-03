/**
 * AI Chat Component
 * Construction Master App - AI Assistant Interface
 */

import React, { useState, useRef, useEffect } from 'react';
import { useAI } from '@/hooks/useAI';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Loader2, Send, Bot, User, Trash2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: any;
}

interface AIChatProps {
  projectId?: string;
  sheetId?: string;
  assistantType?: string;
  className?: string;
}

export const AIChat: React.FC<AIChatProps> = ({
  projectId,
  sheetId,
  assistantType = 'construction_assistant',
  className = '',
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { 
    loading, 
    error, 
    chatWithAI, 
    getAvailableAssistants 
  } = useAI();
  
  const [availableAssistants, setAvailableAssistants] = useState<any[]>([]);
  const [selectedAssistant, setSelectedAssistant] = useState(assistantType);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load available assistants on mount
  useEffect(() => {
    const loadAssistants = async () => {
      const response = await getAvailableAssistants();
      if (response.success) {
        setAvailableAssistants(response.data || []);
      }
    };
    loadAssistants();
  }, [getAvailableAssistants]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    try {
      const response = await chatWithAI({
        message: inputMessage.trim(),
        projectId,
        sheetId,
        assistantType: selectedAssistant,
      });

      if (response.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.data?.suggestions || response.data?.message || 'תגובה התקבלה',
          timestamp: new Date(),
          metadata: response.data?.metadata,
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `שגיאה: ${response.error || 'בעיה בשירות ה-AI'}`,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (err) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `שגיאה: ${err instanceof Error ? err.message : 'שגיאה לא ידועה'}`,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearHistory = () => {
    setMessages([]);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('he-IL', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const selectedAssistantInfo = availableAssistants.find(a => a.id === selectedAssistant);

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      {!isExpanded ? (
        // Collapsed state - Chat button
        <Button
          onClick={() => setIsExpanded(true)}
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700"
        >
          <Bot className="h-6 w-6" />
        </Button>
      ) : (
        // Expanded state - Chat interface
        <Card className="w-96 h-[500px] shadow-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bot className="h-5 w-5" />
                עוזר AI
              </CardTitle>
              <div className="flex items-center gap-2">
                {selectedAssistantInfo && (
                  <Badge variant="secondary" className="text-xs">
                    {selectedAssistantInfo.icon} {selectedAssistantInfo.name}
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(false)}
                  className="h-8 w-8 p-0"
                >
                  ×
                </Button>
              </div>
            </div>
            
            {/* Assistant Selector */}
            {availableAssistants.length > 0 && (
              <select
                aria-label="בחר עוזר AI"
                title="בחר עוזר AI"
                value={selectedAssistant}
                onChange={(e) => setSelectedAssistant(e.target.value)}
                className="w-full p-2 border rounded-md text-sm"
              >
                {availableAssistants.map((assistant) => (
                  <option key={assistant.id} value={assistant.id}>
                    {assistant.icon} {assistant.name}
                  </option>
                ))}
              </select>
            )}
          </CardHeader>

          <CardContent className="p-0 flex flex-col h-[calc(100%-80px)]">
            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <Bot className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>שלום! איך אני יכול לעזור לך היום?</p>
                  </div>
                )}
                
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {message.role === 'assistant' && (
                          <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        )}
                        {message.role === 'user' && (
                          <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {formatTime(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg px-3 py-2 flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">מעבד בקשה...</span>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Error Display */}
            {error && (
              <div className="px-4 py-2 bg-red-50 border-t border-red-200">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="שאל שאלה..."
                  disabled={loading}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || loading}
                  size="sm"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
                {messages.length > 0 && (
                  <Button
                    onClick={clearHistory}
                    variant="outline"
                    size="sm"
                    className="px-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

