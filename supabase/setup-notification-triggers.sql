-- ============================================
-- SISTEMA DE NOTIFICACIONES - TRIGGERS
-- ============================================

-- 1. Función principal que invoca la Edge Function
CREATE OR REPLACE FUNCTION notify_user()
RETURNS TRIGGER AS $$
DECLARE
  payload JSONB;
BEGIN
  -- Construir payload según el tipo de evento
  payload := jsonb_build_object(
    'event_type', TG_ARGV[0],
    'table_name', TG_TABLE_NAME,
    'record', row_to_json(NEW),
    'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END
  );

  -- Llamar a la Edge Function
  PERFORM net.http_post(
    url := 'https://dhfnfdschxhfwrfaoyqa.supabase.co/functions/v1/send-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := payload
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER: Nuevo mensaje en chat
-- ============================================
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Insertar notificación para el receptor
  INSERT INTO notification_history (user_id, title, body, data, status)
  VALUES (
    NEW.receiver_id,
    'Nuevo mensaje',
    LEFT(NEW.content, 100),
    jsonb_build_object(
      'type', 'new_message',
      'conversation_id', NEW.conversation_id,
      'sender_id', NEW.sender_id
    ),
    'pending'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_message ON messages;
CREATE TRIGGER on_new_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();

-- ============================================
-- TRIGGER: Nueva orden (notifica a los vendedores)
-- Se dispara cuando se insertan items en order_items
-- ============================================
CREATE OR REPLACE FUNCTION notify_new_order_item()
RETURNS TRIGGER AS $$
DECLARE
  product_name TEXT;
  seller_id UUID;
  order_total NUMERIC;
BEGIN
  -- Obtener info del producto y vendedor
  SELECT p.name, p.seller_id INTO product_name, seller_id
  FROM products p
  WHERE p.id = NEW.product_id;

  -- Obtener total de la orden
  SELECT total INTO order_total FROM orders WHERE id = NEW.order_id;

  -- Notificar al vendedor
  INSERT INTO notification_history (user_id, title, body, data, status)
  VALUES (
    seller_id,
    '¡Nueva venta!',
    'Vendiste ' || product_name || ' x' || NEW.quantity,
    jsonb_build_object(
      'type', 'new_order',
      'order_id', NEW.order_id,
      'product_id', NEW.product_id,
      'quantity', NEW.quantity,
      'amount', order_total
    ),
    'pending'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_order_item ON order_items;
CREATE TRIGGER on_new_order_item
  AFTER INSERT ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_order_item();

-- ============================================
-- TRIGGER: Cambio de estado de orden (notifica al comprador)
-- ============================================
CREATE OR REPLACE FUNCTION notify_order_status_change()
RETURNS TRIGGER AS $$
DECLARE
  status_text TEXT;
BEGIN
  -- Solo notificar si el estado cambió
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Texto según estado
  status_text := CASE NEW.status
    WHEN 'confirmed' THEN 'Tu pedido fue confirmado'
    WHEN 'shipped' THEN 'Tu pedido está en camino'
    WHEN 'delivered' THEN 'Tu pedido fue entregado'
    WHEN 'cancelled' THEN 'Tu pedido fue cancelado'
    ELSE 'Tu pedido cambió de estado'
  END;

  -- Notificar al comprador
  INSERT INTO notification_history (user_id, title, body, data, status)
  VALUES (
    NEW.buyer_id,
    'Actualización de pedido',
    status_text,
    jsonb_build_object(
      'type', 'order_status',
      'order_id', NEW.id,
      'old_status', OLD.status,
      'new_status', NEW.status
    ),
    'pending'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_order_status_change ON orders;
CREATE TRIGGER on_order_status_change
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_status_change();

-- ============================================
-- TRIGGER: Nueva reseña (notifica al vendedor)
-- ============================================
CREATE OR REPLACE FUNCTION notify_new_review()
RETURNS TRIGGER AS $$
DECLARE
  product_name TEXT;
  seller_id UUID;
BEGIN
  -- Obtener info del producto
  SELECT p.name, p.seller_id INTO product_name, seller_id
  FROM products p
  WHERE p.id = NEW.product_id;

  -- Notificar al vendedor
  INSERT INTO notification_history (user_id, title, body, data, status)
  VALUES (
    seller_id,
    'Nueva reseña (' || NEW.rating || '★)',
    COALESCE(LEFT(NEW.comment, 100), 'Sin comentario'),
    jsonb_build_object(
      'type', 'new_review',
      'review_id', NEW.id,
      'product_id', NEW.product_id,
      'rating', NEW.rating
    ),
    'pending'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_review ON reviews;
CREATE TRIGGER on_new_review
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_review();

-- ============================================
-- TRIGGER: Producto agregado a favoritos (notifica al vendedor)
-- ============================================
CREATE OR REPLACE FUNCTION notify_product_favorited()
RETURNS TRIGGER AS $$
DECLARE
  product_name TEXT;
  seller_id UUID;
BEGIN
  -- Obtener info del producto
  SELECT p.name, p.seller_id INTO product_name, seller_id
  FROM products p
  WHERE p.id = NEW.product_id;

  -- Solo notificar si hay vendedor (no notificar por cada favorito, puede ser mucho)
  -- Opcional: agregar lógica para limitar frecuencia

  INSERT INTO notification_history (user_id, title, body, data, status)
  VALUES (
    seller_id,
    'Producto en favoritos',
    product_name || ' fue agregado a favoritos',
    jsonb_build_object(
      'type', 'product_favorited',
      'product_id', NEW.product_id
    ),
    'pending'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Opcional: descomentar si quieres notificaciones de favoritos
-- DROP TRIGGER IF EXISTS on_product_favorited ON favorites;
-- CREATE TRIGGER on_product_favorited
--   AFTER INSERT ON favorites
--   FOR EACH ROW
--   EXECUTE FUNCTION notify_product_favorited();

-- ============================================
-- TRIGGER: Stock bajo (notifica al vendedor)
-- ============================================
CREATE OR REPLACE FUNCTION notify_low_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo notificar si el stock bajó a 5 o menos
  IF NEW.stock <= 5 AND (OLD.stock IS NULL OR OLD.stock > 5) THEN
    INSERT INTO notification_history (user_id, title, body, data, status)
    VALUES (
      NEW.seller_id,
      'Stock bajo',
      NEW.name || ' tiene solo ' || NEW.stock || ' unidades',
      jsonb_build_object(
        'type', 'low_stock',
        'product_id', NEW.id,
        'stock', NEW.stock
      ),
      'pending'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_low_stock ON products;
CREATE TRIGGER on_low_stock
  AFTER UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION notify_low_stock();

-- ============================================
-- Índice para procesar notificaciones pendientes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_notifications_pending
  ON notification_history(status)
  WHERE status = 'pending';

-- ============================================
-- Función para obtener notificaciones no leídas
-- ============================================
CREATE OR REPLACE FUNCTION get_unread_notifications_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM notification_history
    WHERE user_id = p_user_id
    AND read_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
