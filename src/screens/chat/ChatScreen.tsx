import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import {
  getConversationWithMessages,
  sendMessage,
  subscribeToMessages,
  Message,
  ConversationWithDetails,
} from '../../services/chat';
import { COLORS } from '../../constants/theme';

export default function ChatScreen({ route, navigation }: any) {
  const { conversationId } = route.params;
  const { user } = useAuth();
  const [conversation, setConversation] = useState<ConversationWithDetails | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadConversation();

    // Suscribirse a nuevos mensajes
    const unsubscribe = subscribeToMessages(conversationId, (message) => {
      setMessages((prev) => [...prev, message]);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return () => {
      unsubscribe();
    };
  }, [conversationId]);

  async function loadConversation() {
    if (!user) return;

    try {
      setLoading(true);
      const data = await getConversationWithMessages(conversationId, user.id);
      if (data) {
        setConversation(data);
        setMessages(data.messages);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }, 100);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    if (!newMessage.trim() || !user || !conversation) return;

    const otherUserId = conversation.buyer_id === user.id ? conversation.seller_id : conversation.buyer_id;

    try {
      setSending(true);
      const message = await sendMessage(conversationId, user.id, otherUserId, newMessage.trim());
      if (message) {
        setNewMessage('');
        // El mensaje se agregará automáticamente por la suscripción en tiempo real
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  }

  function formatMessageTime(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  }

  function renderMessage({ item, index }: { item: Message; index: number }) {
    const isMyMessage = item.sender_id === user?.id;
    const showDate =
      index === 0 ||
      new Date(item.created_at).toDateString() !==
        new Date(messages[index - 1].created_at).toDateString();

    return (
      <View>
        {/* Date Separator */}
        {showDate && (
          <View className="items-center my-3">
            <View className="bg-gray-200 rounded-full px-3 py-1">
              <Text className="text-xs text-gray-600">
                {new Date(item.created_at).toLocaleDateString('es-AR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
            </View>
          </View>
        )}

        {/* Message Bubble */}
        <View
          className={`mb-2 px-4 ${isMyMessage ? 'items-end' : 'items-start'}`}
        >
          <View
            className={`rounded-2xl px-4 py-2 max-w-[75%] ${
              isMyMessage ? 'bg-blue-500' : 'bg-gray-200'
            }`}
          >
            <Text
              className={`text-base ${isMyMessage ? 'text-white' : 'text-gray-900'}`}
            >
              {item.content}
            </Text>
            <Text
              className={`text-xs mt-1 ${
                isMyMessage ? 'text-blue-100' : 'text-gray-500'
              }`}
            >
              {formatMessageTime(item.created_at)}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!conversation) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <Text className="text-gray-600">Conversación no encontrada</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-200">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
            <Text className="text-2xl">←</Text>
          </TouchableOpacity>

          <View className="flex-row items-center flex-1">
            {conversation.other_user?.avatar_url ? (
              <Image
                source={{ uri: conversation.other_user.avatar_url }}
                className="w-10 h-10 rounded-full bg-gray-200 mr-3"
              />
            ) : (
              <View className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center mr-3">
                <Text className="text-xl">👤</Text>
              </View>
            )}

            <View className="flex-1">
              <Text className="text-base font-bold" numberOfLines={1}>
                {conversation.other_user?.full_name || 'Usuario'}
              </Text>
              {conversation.product && (
                <Text className="text-xs text-gray-500" numberOfLines={1}>
                  {conversation.product.name}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Product Card */}
        {conversation.product && (
          <TouchableOpacity
            className="bg-blue-50 mx-4 my-2 p-3 rounded-xl flex-row items-center"
            onPress={() =>
              navigation.navigate('ProductDetail', { productId: conversation.product?.id })
            }
          >
            <View className="w-16 h-16 rounded-lg bg-gray-200 mr-3 overflow-hidden">
              {conversation.product.image_url ? (
                <Image
                  source={{ uri: conversation.product.image_url }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-full h-full items-center justify-center">
                  <Text className="text-2xl">📦</Text>
                </View>
              )}
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-gray-900" numberOfLines={2}>
                {conversation.product.name}
              </Text>
              <Text className="text-base font-bold text-blue-600 mt-1">
                ${conversation.product.price.toLocaleString('es-AR')}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: 10, paddingBottom: 10 }}
          onContentSizeChange={() => {
            if (messages.length > 0) {
              flatListRef.current?.scrollToEnd({ animated: true });
            }
          }}
        />

        {/* Input */}
        <View className="flex-row items-center px-4 py-3 bg-white border-t border-gray-200">
          <TextInput
            className="flex-1 bg-gray-100 rounded-full px-4 py-3 text-base mr-2"
            placeholder="Escribe un mensaje..."
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            className="rounded-full items-center justify-center"
            style={{
              backgroundColor: newMessage.trim() ? COLORS.primary : '#D1D5DB',
              width: 44,
              height: 44,
            }}
            onPress={handleSend}
            disabled={!newMessage.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-white text-xl">➤</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
