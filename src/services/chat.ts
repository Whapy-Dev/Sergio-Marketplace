import { supabase } from './supabase';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  image_url?: string;
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  buyer_id: string;
  seller_id: string;
  product_id: string;
  last_message: string | null;
  last_message_at: string | null;
  unread_count_buyer: number;
  unread_count_seller: number;
  created_at: string;
  updated_at: string;
  product?: {
    id: string;
    name: string;
    image_url: string | null;
    price: number;
  };
  other_user?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

export interface ConversationWithDetails extends Conversation {
  messages: Message[];
}

// Obtener todas las conversaciones del usuario actual
export async function getUserConversations(userId: string): Promise<Conversation[]> {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        product:products(id, name, image_url, price)
      `)
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }

    // Obtener info del otro usuario para cada conversación
    const conversationsWithUsers = await Promise.all(
      (data || []).map(async (conv) => {
        const otherUserId = conv.buyer_id === userId ? conv.seller_id : conv.buyer_id;

        const { data: userData } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .eq('id', otherUserId)
          .single();

        return {
          ...conv,
          other_user: userData || { id: otherUserId, full_name: 'Usuario', avatar_url: null },
        };
      })
    );

    return conversationsWithUsers as Conversation[];
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}

// Obtener una conversación específica con sus mensajes
export async function getConversationWithMessages(
  conversationId: string,
  userId: string
): Promise<ConversationWithDetails | null> {
  try {
    // Obtener conversación
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select(`
        *,
        product:products(id, name, image_url, price)
      `)
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      console.error('Error fetching conversation:', convError);
      return null;
    }

    // Obtener mensajes
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return null;
    }

    // Obtener info del otro usuario
    const otherUserId = conversation.buyer_id === userId ? conversation.seller_id : conversation.buyer_id;
    const { data: userData } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .eq('id', otherUserId)
      .single();

    // Marcar mensajes como leídos
    await markMessagesAsRead(conversationId, userId);

    return {
      ...conversation,
      other_user: userData || { id: otherUserId, full_name: 'Usuario', avatar_url: null },
      messages: messages || [],
    } as ConversationWithDetails;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

// Crear o obtener una conversación
export async function getOrCreateConversation(
  buyerId: string,
  sellerId: string,
  productId: string
): Promise<string | null> {
  try {
    // Buscar conversación existente
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('buyer_id', buyerId)
      .eq('seller_id', sellerId)
      .eq('product_id', productId)
      .single();

    if (existing) {
      return existing.id;
    }

    // Crear nueva conversación
    const { data: newConv, error } = await supabase
      .from('conversations')
      .insert({
        buyer_id: buyerId,
        seller_id: sellerId,
        product_id: productId,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return null;
    }

    return newConv.id;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

// Enviar un mensaje
export async function sendMessage(
  conversationId: string,
  senderId: string,
  receiverId: string,
  content: string,
  imageUrl?: string
): Promise<Message | null> {
  try {
    const messageData: any = {
      conversation_id: conversationId,
      sender_id: senderId,
      receiver_id: receiverId,
      content: content.trim() || (imageUrl ? '📷 Imagen' : ''),
    };

    if (imageUrl) {
      messageData.image_url = imageUrl;
    }

    const { data, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      return null;
    }

    // Actualizar conversación
    await supabase
      .from('conversations')
      .update({
        last_message: content.trim(),
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId);

    return data as Message;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

// Marcar mensajes como leídos
export async function markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
  try {
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .eq('receiver_id', userId)
      .eq('is_read', false);

    // Resetear contador de no leídos
    const { data: conversation } = await supabase
      .from('conversations')
      .select('buyer_id')
      .eq('id', conversationId)
      .single();

    if (conversation) {
      const field = conversation.buyer_id === userId ? 'unread_count_buyer' : 'unread_count_seller';
      await supabase
        .from('conversations')
        .update({ [field]: 0 })
        .eq('id', conversationId);
    }
  } catch (error) {
    console.error('Error marking messages as read:', error);
  }
}

// Suscribirse a nuevos mensajes en tiempo real
export function subscribeToMessages(
  conversationId: string,
  onNewMessage: (message: Message) => void
) {
  const subscription = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        onNewMessage(payload.new as Message);
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}

// Obtener conteo total de mensajes no leídos
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const { data } = await supabase
      .from('conversations')
      .select('buyer_id, unread_count_buyer, unread_count_seller')
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);

    if (!data) return 0;

    return data.reduce((total, conv) => {
      return total + (conv.buyer_id === userId ? conv.unread_count_buyer : conv.unread_count_seller);
    }, 0);
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
}
