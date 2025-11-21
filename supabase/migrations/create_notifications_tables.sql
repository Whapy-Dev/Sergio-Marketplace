-- Push notification tokens table
CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL,
  platform VARCHAR(20) NOT NULL, -- 'ios', 'android', 'web'
  device_name VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, token)
);

-- Notification templates
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  data JSONB, -- Additional data to send
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Notification history
CREATE TABLE IF NOT EXISTS notification_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  template_key VARCHAR(100),
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  status VARCHAR(20) DEFAULT 'sent', -- 'sent', 'delivered', 'failed'
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_push_tokens_user ON push_tokens(user_id);
CREATE INDEX idx_push_tokens_active ON push_tokens(is_active);
CREATE INDEX idx_notification_history_user ON notification_history(user_id);
CREATE INDEX idx_notification_history_created ON notification_history(created_at);

-- RLS policies
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;

-- Users can manage their own tokens
CREATE POLICY "Users can manage own push tokens" ON push_tokens
  FOR ALL USING (user_id = auth.uid());

-- Admin can see all tokens
CREATE POLICY "Admin can view all push tokens" ON push_tokens
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Admin can manage templates
CREATE POLICY "Admin full access on notification_templates" ON notification_templates
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Public can read active templates
CREATE POLICY "Public can read active templates" ON notification_templates
  FOR SELECT USING (is_active = true);

-- Users can view their own notification history
CREATE POLICY "Users can view own notifications" ON notification_history
  FOR SELECT USING (user_id = auth.uid());

-- System can insert notifications
CREATE POLICY "System can insert notifications" ON notification_history
  FOR INSERT WITH CHECK (true);

-- Users can update their own (mark as read)
CREATE POLICY "Users can update own notifications" ON notification_history
  FOR UPDATE USING (user_id = auth.uid());

-- Insert default notification templates
INSERT INTO notification_templates (key, title, body) VALUES
  ('order_confirmed', 'Pedido Confirmado', 'Tu pedido #{{order_number}} ha sido confirmado'),
  ('order_shipped', 'Pedido Enviado', 'Tu pedido #{{order_number}} está en camino'),
  ('order_delivered', 'Pedido Entregado', 'Tu pedido #{{order_number}} ha sido entregado'),
  ('payment_received', 'Pago Recibido', 'Recibimos tu pago de ${{amount}}'),
  ('new_message', 'Nuevo Mensaje', '{{sender_name}} te envió un mensaje'),
  ('product_approved', 'Producto Aprobado', 'Tu producto "{{product_name}}" fue aprobado'),
  ('withdrawal_approved', 'Retiro Aprobado', 'Tu retiro de ${{amount}} fue aprobado'),
  ('withdrawal_completed', 'Retiro Completado', 'Tu retiro de ${{amount}} fue transferido'),
  ('sale_made', 'Nueva Venta', 'Vendiste {{product_name}} por ${{amount}}'),
  ('promo_generic', 'Promoción', '{{message}}')
ON CONFLICT (key) DO NOTHING;
