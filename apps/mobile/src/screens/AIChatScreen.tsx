/**
 * AI Chat Screen
 * Construction Master App - Mobile AI Chat
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  Card,
  TextInput,
  Button,
  IconButton,
  List,
  Chip,
  Avatar,
  Title,
  Paragraph,
  FAB,
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useOffline } from '../context/OfflineContext';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type: 'text' | 'suggestion' | 'analysis';
  data?: Record<string, unknown>;
}

type AIChatScreenProps = {
  navigation: {
    goBack: () => void;
  };
  route: {
    params?: { projectId?: string; sheetId?: string };
  };
};

const AIChatScreen: React.FC<AIChatScreenProps> = ({ navigation, route }) => {
  const { user } = useAuth();
  const { isOfflineMode } = useOffline();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [assistantType, setAssistantType] = useState('construction_assistant');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [sheetId, setSheetId] = useState<string | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const { projectId: routeProjectId, sheetId: routeSheetId } = route.params || {};
    setProjectId(routeProjectId);
    setSheetId(routeSheetId);
    loadChatHistory();
  }, []);

  const loadChatHistory = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/ai/chat-history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.data.history || []);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
      type: 'text',
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: inputText,
          assistantType,
          projectId,
          sheetId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: data.data.suggestions || 'תגובה מ-AI',
          sender: 'ai',
          timestamp: new Date(),
          type: 'text',
          data: data.data,
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error('Failed to get AI response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('שגיאה', 'שגיאה בשליחת הודעה');
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    Alert.alert(
      'מחיקת שיחה',
      'האם אתה בטוח שברצונך למחוק את כל השיחה?',
      [
        { text: 'ביטול', style: 'cancel' },
        { text: 'מחק', style: 'destructive', onPress: confirmClearChat },
      ]
    );
  };

  const confirmClearChat = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/ai/chat-history`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ assistantType }),
      });
      setMessages([]);
    } catch (error) {
      console.error('Error clearing chat:', error);
      Alert.alert('שגיאה', 'שגיאה במחיקת השיחה');
    }
  };

  const handleAssistantChange = (type: string) => {
    setAssistantType(type);
    // Load chat history for new assistant
    loadChatHistory();
  };

  const getAssistantInfo = (type: string) => {
    const assistants = {
      construction_assistant: {
        name: 'עוזר ניהול פרויקטים',
        icon: '🏗️',
        description: 'עוזר כללי לניהול פרויקטי בנייה',
      },
      data_analyst: {
        name: 'אנליסט נתונים',
        icon: '📊',
        description: 'ניתוח נתונים ותובנות עסקיות',
      },
      cost_estimator: {
        name: 'מומחה הערכת עלויות',
        icon: '💰',
        description: 'הערכת עלויות ותקציבים',
      },
      safety_advisor: {
        name: 'יועץ בטיחות',
        icon: '🛡️',
        description: 'ייעוץ בטיחות וסיכונים',
      },
    };
    return assistants[type] || assistants.construction_assistant;
  };

  const renderMessage = (message: Message) => (
    <View
      key={message.id}
      style={[
        styles.messageContainer,
        message.sender === 'user' ? styles.userMessage : styles.aiMessage,
      ]}
    >
      <Avatar
        style={styles.avatar}
        icon={message.sender === 'user' ? 'account' : 'robot'}
        size={32}
      />
      <Card style={styles.messageCard}>
        <Card.Content>
          <Paragraph style={styles.messageText}>{message.text}</Paragraph>
          <Paragraph style={styles.timestamp}>
            {message.timestamp.toLocaleTimeString('he-IL')}
          </Paragraph>
        </Card.Content>
      </Card>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        />
        <View style={styles.headerContent}>
          <Title style={styles.headerTitle}>
            {getAssistantInfo(assistantType).name}
          </Title>
          <Chip style={styles.assistantChip}>
            {getAssistantInfo(assistantType).icon}
          </Chip>
        </View>
        <IconButton
          icon="delete"
          onPress={clearChat}
          style={styles.headerButton}
        />
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd()}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Title style={styles.emptyTitle}>שיחה חדשה</Title>
            <Paragraph style={styles.emptyText}>
              שאל את {getAssistantInfo(assistantType).name} כל שאלה
            </Paragraph>
          </View>
        ) : (
          messages.map(renderMessage)
        )}
        {loading && (
          <View style={styles.loadingContainer}>
            <Card style={styles.loadingCard}>
              <Card.Content>
                <Paragraph>מקליד...</Paragraph>
              </Card.Content>
            </Card>
          </View>
        )}
      </ScrollView>

      {/* Assistant Selection */}
      <View style={styles.assistantSelection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['construction_assistant', 'data_analyst', 'cost_estimator', 'safety_advisor'].map(type => (
            <Chip
              key={type}
              selected={assistantType === type}
              onPress={() => handleAssistantChange(type)}
              style={styles.assistantChip}
            >
              {getAssistantInfo(type).name}
            </Chip>
          ))}
        </ScrollView>
      </View>

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="הקלד הודעה..."
          multiline
          maxLength={1000}
          disabled={loading}
        />
        <Button
          mode="contained"
          onPress={sendMessage}
          disabled={!inputText.trim() || loading}
          style={styles.sendButton}
          icon="send"
        >
          שלח
        </Button>
      </View>

      {/* Offline Mode Indicator */}
      {isOfflineMode && (
        <View style={styles.offlineIndicator}>
          <Chip>מצב לא מקוון</Chip>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerButton: {
    margin: 0,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  assistantChip: {
    marginTop: 4,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  aiMessage: {
    justifyContent: 'flex-start',
  },
  avatar: {
    marginHorizontal: 8,
  },
  messageCard: {
    flex: 1,
    maxWidth: '80%',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  loadingContainer: {
    marginBottom: 16,
  },
  loadingCard: {
    backgroundColor: '#e0e0e0',
  },
  assistantSelection: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  textInput: {
    flex: 1,
    marginRight: 8,
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 8,
  },
  offlineIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
});

export default AIChatScreen;
