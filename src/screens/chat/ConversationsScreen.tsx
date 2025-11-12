import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { getUserConversations, Conversation } from '../../services/chat';
import { COLORS } from '../../constants/theme';

export default function ConversationsScreen({ navigation }: any) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  async function loadConversations() {
    if (!user) return;

    try {
      setLoading(true);
      const data = await getUserConversations(user.id);
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  }

  function formatTime(dateString: string | null) {
    if (!dateString) return '';

    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Ayer';
    } else if (days < 7) {
      return `${days}d`;
    } else {
      return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
    }
  }

  function renderConversation({ item }: { item: Conversation }) {
    const isUnread =
      (item.buyer_id === user?.id && item.unread_count_buyer > 0) ||
      (item.seller_id === user?.id && item.unread_count_seller > 0);

    const unreadCount =
      item.buyer_id === user?.id ? item.unread_count_buyer : item.unread_count_seller;

    return (
      <TouchableOpacity
        className="flex-row items-center p-4 bg-white border-b border-gray-200"
        onPress={() => navigation.navigate('Chat', { conversationId: item.id })}
      >
        {/* Avatar */}
        <View className="mr-3">
          {item.other_user?.avatar_url ? (
            <Image
              source={{ uri: item.other_user.avatar_url }}
              className="w-14 h-14 rounded-full bg-gray-200"
            />
          ) : (
            <View className="w-14 h-14 rounded-full bg-gray-200 items-center justify-center">
              <Text className="text-2xl">👤</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View className="flex-1">
          {/* Name and Product */}
          <View className="flex-row items-center justify-between mb-1">
            <Text
              className={`text-base ${isUnread ? 'font-bold' : 'font-normal'}`}
              numberOfLines={1}
            >
              {item.other_user?.full_name || 'Usuario'}
            </Text>
            {item.last_message_at && (
              <Text className="text-xs text-gray-500 ml-2">
                {formatTime(item.last_message_at)}
              </Text>
            )}
          </View>

          {/* Product Info */}
          {item.product && (
            <Text className="text-xs text-gray-500 mb-1" numberOfLines={1}>
              📦 {item.product.name}
            </Text>
          )}

          {/* Last Message */}
          <View className="flex-row items-center">
            <Text
              className={`flex-1 text-sm ${
                isUnread ? 'font-semibold text-gray-900' : 'text-gray-600'
              }`}
              numberOfLines={1}
            >
              {item.last_message || 'Sin mensajes'}
            </Text>
            {unreadCount > 0 && (
              <View
                className="ml-2 rounded-full items-center justify-center"
                style={{
                  backgroundColor: COLORS.primary,
                  minWidth: 20,
                  height: 20,
                  paddingHorizontal: 6,
                }}
              >
                <Text className="text-white text-xs font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-5 py-4 border-b border-gray-200">
        <Text className="text-2xl font-bold">Mensajes</Text>
      </View>

      {/* Conversations List */}
      {conversations.length === 0 ? (
        <View className="flex-1 items-center justify-center px-5">
          <Text className="text-6xl mb-4">💬</Text>
          <Text className="text-xl font-bold text-gray-900 mb-2">
            No hay conversaciones
          </Text>
          <Text className="text-center text-gray-600">
            Cuando contactes a un vendedor, tus mensajes aparecerán aquí
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
