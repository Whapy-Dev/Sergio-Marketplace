import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationPayload {
  user_id: string
  title: string
  body: string
  data?: Record<string, any>
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Process pending notifications
    const { data: notifications, error: fetchError } = await supabase
      .from('notification_history')
      .select('*')
      .eq('status', 'pending')
      .limit(100)

    if (fetchError) {
      throw fetchError
    }

    if (!notifications || notifications.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pending notifications' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const results = []

    for (const notification of notifications) {
      try {
        // Get user's push tokens
        const { data: tokens } = await supabase
          .from('push_tokens')
          .select('token')
          .eq('user_id', notification.user_id)
          .eq('is_active', true)

        // Send push notifications
        if (tokens && tokens.length > 0) {
          const pushResults = await Promise.all(
            tokens.map(t => sendExpoPush(t.token, {
              title: notification.title,
              body: notification.body,
              data: notification.data,
            }))
          )

          const anySuccess = pushResults.some(r => r)

          // Update notification status
          await supabase
            .from('notification_history')
            .update({
              status: anySuccess ? 'sent' : 'failed',
              updated_at: new Date().toISOString()
            })
            .eq('id', notification.id)

          results.push({
            id: notification.id,
            status: anySuccess ? 'sent' : 'failed',
            tokens_count: tokens.length
          })
        } else {
          // No tokens, mark as sent anyway (user might not have push enabled)
          await supabase
            .from('notification_history')
            .update({
              status: 'sent',
              updated_at: new Date().toISOString()
            })
            .eq('id', notification.id)

          results.push({
            id: notification.id,
            status: 'no_tokens'
          })
        }

        // Send email for important notifications
        const emailTypes = ['new_order', 'order_status', 'low_stock']
        if (notification.data?.type && emailTypes.includes(notification.data.type)) {
          await sendEmail(supabase, notification)
        }

      } catch (error) {
        console.error(`Error processing notification ${notification.id}:`, error)

        await supabase
          .from('notification_history')
          .update({ status: 'failed' })
          .eq('id', notification.id)

        results.push({
          id: notification.id,
          status: 'error',
          error: error.message
        })
      }
    }

    return new Response(
      JSON.stringify({ processed: results.length, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Send push notification via Expo
async function sendExpoPush(token: string, notification: {
  title: string
  body: string
  data?: Record<string, any>
}): Promise<boolean> {
  try {
    const message = {
      to: token,
      sound: 'default',
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
    }

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    })

    const result = await response.json()

    if (result.data?.status === 'error') {
      console.error('Push error:', result.data.message)
      return false
    }

    return true
  } catch (error) {
    console.error('Error sending push:', error)
    return false
  }
}

// Send email notification
async function sendEmail(supabase: any, notification: any): Promise<void> {
  try {
    // Get user email
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', notification.user_id)
      .single()

    if (!profile?.email) return

    // Get email from auth.users if not in profile
    let userEmail = profile.email
    if (!userEmail) {
      const { data: authUser } = await supabase.auth.admin.getUserById(notification.user_id)
      userEmail = authUser?.user?.email
    }

    if (!userEmail) return

    // Send email using Supabase's built-in email or your preferred service
    // For now, we'll use Resend or similar service

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      console.log('No RESEND_API_KEY configured, skipping email')
      return
    }

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Sergio Marketplace <notificaciones@sergiomarketplace.com>',
        to: userEmail,
        subject: notification.title,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563EB;">${notification.title}</h2>
            <p>${notification.body}</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">
              Este es un mensaje automático de Sergio Marketplace
            </p>
          </div>
        `,
      }),
    })

  } catch (error) {
    console.error('Error sending email:', error)
  }
}
