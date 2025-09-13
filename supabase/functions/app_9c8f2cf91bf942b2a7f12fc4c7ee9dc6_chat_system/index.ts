import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { action, data } = await req.json()

    switch (action) {
      case 'create_conversation':
        return await createConversation(supabaseClient, data)
      
      case 'send_message':
        return await sendMessage(supabaseClient, data)
      
      case 'get_conversations':
        return await getConversations(supabaseClient, data)
      
      case 'get_messages':
        return await getMessages(supabaseClient, data)
      
      case 'mark_messages_read':
        return await markMessagesRead(supabaseClient, data)
      
      case 'get_unread_count':
        return await getUnreadCount(supabaseClient, data)
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error occurred',
        details: error.toString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// สร้างการสนทนาใหม่
async function createConversation(supabase: any, data: { customer_id: string, customer_name?: string }) {
  const { customer_id, customer_name } = data

  // ตรวจสอบว่ามีการสนทนาที่ active อยู่แล้วหรือไม่
  const { data: existingConversation, error: checkError } = await supabase
    .from('conversations')
    .select('*')
    .eq('customer_id', customer_id)
    .eq('status', 'active')
    .single()

  if (existingConversation && !checkError) {
    return new Response(
      JSON.stringify({ 
        success: true, 
        conversation: existingConversation,
        message: 'Using existing conversation'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // สร้างการสนทนาใหม่
  const { data: conversation, error } = await supabase
    .from('conversations')
    .insert({
      customer_id,
      customer_name: customer_name || `ลูกค้า ${customer_id}`
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create conversation: ${error.message}`)
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      conversation,
      message: 'Conversation created successfully'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// ส่งข้อความ
async function sendMessage(supabase: any, data: { 
  conversation_id: string, 
  sender_type: 'customer' | 'admin', 
  sender_id: string, 
  message_text: string 
}) {
  const { conversation_id, sender_type, sender_id, message_text } = data

  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      conversation_id,
      sender_type,
      sender_id,
      message_text
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to send message: ${error.message}`)
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      message,
      message: 'Message sent successfully'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// ดึงรายการการสนทนา (สำหรับแอดมิน)
async function getConversations(supabase: any, data: { admin_id: string }) {
  const { admin_id } = data

  const { data: conversations, error } = await supabase
    .from('conversation_summary')
    .select('*')
    .order('last_message_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to get conversations: ${error.message}`)
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      conversations,
      message: 'Conversations retrieved successfully'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// ดึงข้อความในการสนทนา
async function getMessages(supabase: any, data: { conversation_id: string }) {
  const { conversation_id } = data

  const { data: messages, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversation_id)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to get messages: ${error.message}`)
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      messages,
      message: 'Messages retrieved successfully'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// ทำเครื่องหมายว่าอ่านข้อความแล้ว
async function markMessagesRead(supabase: any, data: { conversation_id: string, sender_type: 'customer' | 'admin' }) {
  const { conversation_id, sender_type } = data

  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', conversation_id)
    .neq('sender_type', sender_type) // อัพเดทข้อความที่ไม่ได้ส่งโดยผู้ใช้คนนี้

  if (error) {
    throw new Error(`Failed to mark messages as read: ${error.message}`)
  }

  return new Response(
    JSON.stringify({ 
      success: true,
      message: 'Messages marked as read'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// นับข้อความที่ยังไม่ได้อ่าน
async function getUnreadCount(supabase: any, data: { admin_id: string }) {
  const { admin_id } = data

  const { data: conversations, error } = await supabase
    .from('conversation_summary')
    .select('unread_customer_messages')

  if (error) {
    throw new Error(`Failed to get unread count: ${error.message}`)
  }

  const totalUnread = conversations.reduce((sum: number, conv: any) => 
    sum + (conv.unread_customer_messages || 0), 0)

  return new Response(
    JSON.stringify({ 
      success: true, 
      unread_count: totalUnread,
      message: 'Unread count retrieved successfully'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
