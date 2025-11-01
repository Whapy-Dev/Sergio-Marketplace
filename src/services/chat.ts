import { supabase } from './supabase';

export interface Conversation {
  id: string;
  buyer_id: string;
  seller_id: string;
  product_id?: string;
  last_message?: string;
  last_message_at: string;
  unread_count_buyer?: number;
  unread_count_seller?: number;
  created_at: string;
  buyer?: any;
  seller?: any;
  product?: any;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: any;
}

// Obtener o crear conversación
export async function getOrCreateConversation(
  buyerId: string,
  sellerId: string,
  productId?: string
) {
  // Primero intentar obtener conversación existente
  let query = supabase
    .from('conversations')
    .select('*')
    .eq('buyer_id', buyerId)
    .eq('seller_id', sellerId);

  if (productId) {
    query = query.eq('product_id', productId);
  } else {
    query = query.is('product_id', null);
  }

  const { data: existing, error: searchError } = await query.single();

  if (existing) {
    return { success: true, data: existing };
  }

  // Si no existe, crear nueva
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      buyer_id: buyerId,
      seller_id: sellerId,
      product_id: productId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating conversation:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

// Obtener conversaciones del usuario
export async function getUserConversations(userId: string) {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order('last_message_at', { ascending: false });

  if (error) {
    console.error('Error getting conversations:', error);
    return [];
  }

  if (!data) return [];

  // Obtener datos de los usuarios y productos manualmente
  const conversationsWithDetails = await Promise.all(
    data.map(async (conv) => {
      // Obtener buyer
      const { data: buyer } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, email')
        .eq('id', conv.buyer_id)
        .single();

      // Obtener seller
      const { data: seller } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, email')
        .eq('id', conv.seller_id)
        .single();

      // Obtener producto si existe
      let product = null;
      if (conv.product_id) {
        const { data: prod } = await supabase
          .from('products')
          .select('id, name, image_url, price')
          .eq('id', conv.product_id)
          .single();
        product = prod;
      }

      return {
        ...conv,
        buyer,
        seller,
        product,
      };
    })
  );

  return conversationsWithDetails;
}

// Enviar mensaje
export async function sendMessage(
  conversationId: string,
  senderId: string,
  receiverId: string,
  content: string
) {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      receiver_id: receiverId,
      content,
    })
    .select()
    .single();

  if (error) {
    console.error('Error sending message:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

// Obtener mensajes de una conversación
export async function getConversationMessages(conversationId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error getting messages:', error);
    return [];
  }

  if (!data) return [];

  // Obtener datos del sender para cada mensaje
  const messagesWithSender = await Promise.all(
    data.map(async (msg) => {
      const { data: sender } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('id', msg.sender_id)
        .single();

      return {
        ...msg,
        sender,
      };
    })
  );

  return messagesWithSender;
}

// Marcar mensajes como leídos
export async function markMessagesAsRead(conversationId: string, userId: string) {
  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', conversationId)
    .eq('receiver_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('Error marking messages as read:', error);
    return { success: false, error: error.message };
  }

  // Resetear contador de no leídos
  const { data: conversation } = await supabase
    .from('conversations')
    .select('buyer_id, seller_id')
    .eq('id', conversationId)
    .single();

  if (conversation) {
    const isBuyer = conversation.buyer_id === userId;
    await supabase
      .from('conversations')
      .update({
        [isBuyer ? 'unread_count_buyer' : 'unread_count_seller']: 0,
      })
      .eq('id', conversationId);
  }

  return { success: true };
}

// Suscribirse a nuevos mensajes (real-time)
export function subscribeToMessages(
  conversationId: string,
  callback: (message: Message) => void
) {
  return supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      async (payload) => {
        // Obtener datos completos del mensaje con sender
        const { data: sender } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .eq('id', payload.new.sender_id)
          .single();

        callback({
          ...payload.new,
          sender,
        } as Message);
      }
    )
    .subscribe();
}