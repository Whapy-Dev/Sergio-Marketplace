-- ============================================
-- CRON JOB para procesar notificaciones
-- ============================================

-- Habilitar pg_cron (ejecutar como superuser)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Crear función que invoca la Edge Function
CREATE OR REPLACE FUNCTION process_pending_notifications()
RETURNS void AS $$
BEGIN
  -- Llamar a la Edge Function cada minuto
  PERFORM net.http_post(
    url := 'https://dhfnfdschxhfwrfaoyqa.supabase.co/functions/v1/send-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoZm5mZHNjaHhoZndyZmFveXFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY0MzI3NSwiZXhwIjoyMDc2MjE5Mjc1fQ.YOUR_SERVICE_ROLE_KEY'
    ),
    body := '{}'::jsonb
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Programar el cron (cada minuto)
-- SELECT cron.schedule('process-notifications', '* * * * *', 'SELECT process_pending_notifications()');

-- ============================================
-- ALTERNATIVA: Trigger inmediato al insertar
-- ============================================

-- Esta función procesa la notificación inmediatamente al insertarse
CREATE OR REPLACE FUNCTION process_notification_immediately()
RETURNS TRIGGER AS $$
BEGIN
  -- Llamar a la Edge Function inmediatamente
  PERFORM net.http_post(
    url := 'https://dhfnfdschxhfwrfaoyqa.supabase.co/functions/v1/send-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
    ),
    body := jsonb_build_object('notification_id', NEW.id)
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Si falla, la notificación queda pending para el cron
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para procesamiento inmediato
DROP TRIGGER IF EXISTS process_notification_on_insert ON notification_history;
CREATE TRIGGER process_notification_on_insert
  AFTER INSERT ON notification_history
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION process_notification_immediately();
