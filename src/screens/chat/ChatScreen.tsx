import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getConversationMessages, 
  sendMessage, 
  markMessagesAsRead,
  subscribeToMessages,
  type Message 
} from '../../services/chat';
import { COLORS } from '../../constants/theme';

export default function ChatScreen({ route, navigation }: any) {
  const { conversationId, otherUser, product } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadMessages();
    markAsRead();

    // Suscribirse a mensajes en tiempo real
    const subscription = subscribeToMessages(conversationId, (message) => {
      setMessages(prev => [...prev, message]);
      markAsRead();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [conversationId]);

  async function loadMessages() {
    setLoading(true);
    const data = await getConversationMessages(conversationId);
    setMessages(data);
    setLoading(false);
  }

  async function markAsRead() {
    if (user) {
      await markMessagesAsRead(conversationId, user.id);
    }
  }

  async function handleSend() {
    if (!newMessage.trim() || !user || sending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    const result = await sendMessage(conversationId, user.id, messageText);
    
    setSending(false);
  }

  function formatTime(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-AR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-200 flex-row items-center">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
          <Text className="text-primary text-2xl font-bold">←</Text>
        </TouchableOpacity>

        <View className="w-10 h-10 rounded-full bg-primary items-center justify-center mr-3">
          {otherUser?.avatar_url ? (
            <Image 
              source={{ uri: otherUser.avatar_url }}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <Text className="text-white">👤</Text>
          )}
        </View>

        <View className="flex-1">
          <Text className="text-base font-bold text-gray-900">
            {otherUser?.full_name || 'Usuario'}
          </Text>
          {product && (
            <Text className="text-xs text-gray-600" numberOfLines={1}>
              {product.name}
            </Text>
          )}
        </View>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Mensajes */}
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            className="flex-1 px-4"
            contentContainerStyle={{ paddingVertical: 16 }}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
          >
            {messages.map((message) => {
              const isMine = message.sender_id === user?.id;
              
              return (
                <View
                  key={message.id}
                  className={`mb-3 ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <View
                    className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                      isMine ? 'bg-primary' : 'bg-white'
                    }`}
                    style={!isMine ? { borderWidth: 1, borderColor: '#E0E0E0' } : { backgroundColor: COLORS.primary }}
                  >
                    <Text className={`text-base ${isMine ? 'text-white' : 'text-gray-900'}`}>
                      {message.content}
                    </Text>
                    <Text className={`text-xs mt-1 ${isMine ? 'text-white opacity-70' : 'text-gray-500'}`}>
                      {formatTime(message.created_at)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}

        {/* Input de mensaje */}
        <View className="bg-white px-4 py-3 border-t border-gray-200">
          <View className="flex-row items-center">
            <TextInput
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Escribe un mensaje..."
              placeholderTextColor="#999999"
              className="flex-1 bg-gray-100 rounded-full px-4 py-3 text-base mr-2"
              multiline
              maxLength={500}
              editable={!sending}
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={!newMessage.trim() || sending}
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{
                backgroundColor: newMessage.trim() && !sending ? COLORS.primary : '#D1D5DB'
              }}
            >
              {sending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text className="text-white text-xl">➤</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}