import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { getUserConversations, type Conversation } from '../../services/chat';
import { COLORS } from '../../constants/theme';

export default function ConversationsScreen({ navigation }: any) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  // Auto-refresh cada 10 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        loadConversations(true);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [user]);

  async function loadConversations(silent = false) {
    if (!user) return;
    
    if (!silent) setLoading(true);
    const data = await getUserConversations(user.id);
    setConversations(data);
    if (!silent) setLoading(false);
    setRefreshing(false);
  }

  function onRefresh() {
    setRefreshing(true);
    loadConversations(true);
  }

  function getOtherUser(conversation: Conversation) {
    return conversation.buyer_id === user?.id ? conversation.seller : conversation.buyer;
  }

  function formatTime(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="px-4 py-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">Mensajes</Text>
        <Text className="text-sm text-gray-600 mt-1">
          {conversations.length} {conversations.length === 1 ? 'conversación' : 'conversaciones'}
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : conversations.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-6xl mb-4">💬</Text>
          <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
            No hay conversaciones
          </Text>
          <Text className="text-base text-gray-600 text-center mb-6">
            Inicia una conversación con un vendedor desde un producto
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Home')}
            className="bg-primary rounded-xl px-6 py-3"
            style={{ backgroundColor: COLORS.primary }}
          >
            <Text className="text-white font-semibold">Explorar productos</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView 
          className="flex-1"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
        >
          {conversations.map((conversation) => {
            const otherUser = getOtherUser(conversation);
            
            return (
              <TouchableOpacity
                key={conversation.id}
                onPress={() => navigation.navigate('Chat', { 
                  conversationId: conversation.id,
                  otherUser,
                  product: conversation.product
                })}
                className="flex-row items-center px-4 py-4 border-b border-gray-100 active:bg-gray-50"
              >
                {/* Avatar */}
                <View className="relative mr-3">
                  <View className="w-14 h-14 rounded-full bg-primary items-center justify-center overflow-hidden">
                    {otherUser?.avatar_url ? (
                      <Image 
                        source={{ uri: otherUser.avatar_url }}
                        className="w-14 h-14"
                        resizeMode="cover"
                      />
                    ) : (
                      <Text className="text-white text-xl">👤</Text>
                    )}
                  </View>
                </View>

                {/* Info */}
                <View className="flex-1">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-base font-bold text-gray-900">
                      {otherUser?.full_name || 'Usuario'}
                    </Text>
                    <Text className="text-xs text-gray-500 font-medium">
                      {formatTime(conversation.last_message_at)}
                    </Text>
                  </View>

                  {conversation.product && (
                    <View className="flex-row items-center mb-1">
                      <View className="w-6 h-6 rounded bg-gray-100 items-center justify-center mr-2">
                        {conversation.product.image_url ? (
                          <Image 
                            source={{ uri: conversation.product.image_url }}
                            className="w-6 h-6 rounded"
                            resizeMode="cover"
                          />
                        ) : (
                          <Text className="text-xs">📦</Text>
                        )}
                      </View>
                      <Text className="text-xs text-gray-600 flex-1" numberOfLines={1}>
                        {conversation.product.name}
                      </Text>
                    </View>
                  )}

                  <Text 
                    className="text-sm text-gray-600" 
                    numberOfLines={1}
                  >
                    {conversation.last_message || 'Sin mensajes'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
          <View className="h-20" />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}