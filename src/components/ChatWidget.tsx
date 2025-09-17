import React, { useState, useEffect, useRef } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Send, X, MessageCircle, Image } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { QuickReplyButtons } from './QuickReplyButtons'

interface Message {
  id: string
  sender_type: 'customer' | 'admin'
  sender_id: string
  message_text: string
  created_at: string
  is_read: boolean
  message_type?: 'text' | 'image'
  image_url?: string
}

interface Conversation {
  id: string
  customer_id: string
  customer_name: string
  status: string
  created_at: string
  updated_at: string
}

interface ChatWidgetProps {
  customerId: string
  customerName?: string
  isOpen: boolean
  onClose: () => void
}

// Helper function to normalize customer ID
const normalizeCustomerId = (id: string): string => {
  return id.trim().toLowerCase()
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  customerId,
  customerName,
  isOpen,
  onClose
}) => {
  // Error state
  const [hasError, setHasError] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [showQuickReply, setShowQuickReply] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const conversationRef = useRef<Conversation | null>(null)

  // Auto bot states
  const [botState, setBotState] = useState<'idle' | 'asking_name' | 'asking_password' | 'waiting_admin'>('idle')
  const [customerRobloxName, setCustomerRobloxName] = useState('')
  const [customerPassword, setCustomerPassword] = useState('')

  // Check if there are any real admin messages (not bot messages)
  const hasRealAdminMessage = messages.some(message => message.sender_type === 'admin' && message.sender_id !== 'bot')
  const canCustomerType = hasRealAdminMessage || botState === 'asking_name' || botState === 'asking_password'

  // Function to check if text is in English
  const isEnglish = (text: string): boolean => {
    const thaiRegex = /[\u0E00-\u0E7F]/;
    return !thaiRegex.test(text);
  }

  // Function to send bot message
  const sendBotMessage = async (messageText: string) => {
    if (!conversation?.id) return

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          sender_type: 'admin',
          sender_id: 'bot',
          message_text: messageText,
          message_type: 'text',
          is_read: false
        })
        .select()
        .single()

      if (error) throw error

      setMessages(prev => [...prev, data])
    } catch (error) {
      console.error('Error sending bot message:', error)
    }
  }


  // Auto scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end',
        inline: 'nearest'
      })
    }
  }

  useEffect(() => {
    // Simple auto scroll to bottom when messages change
    setTimeout(scrollToBottom, 100)
  }, [messages])

  // Initialize conversation when component opens
  useEffect(() => {
    if (isOpen && customerId && !isInitialized) {
      try {
        console.log('🚀 Initializing chat widget for customer:', customerId)
        setIsInitialized(true)
      initializeConversation()
      } catch (error) {
        console.error('❌ Error in useEffect:', error)
        setHasError(true)
      }
    }
    
    // Reset when closed
    if (!isOpen) {
      setIsInitialized(false)
      setConversation(null)
      setMessages([])
      setHasError(false)
      setImageFile(null)
      setImagePreview(null)
      conversationRef.current = null // Reset ref
    }
  }, [isOpen, customerId, isInitialized])

  // Load messages when conversation is set
  useEffect(() => {
    if (conversation && isInitialized) {
      loadMessages()
      
      console.log('🔌 Setting up real-time subscription for customer conversation:', conversation.id)
      
      // Backup polling in case real-time fails
      const pollInterval = setInterval(() => {
        console.log('🔄 Customer polling for new messages...')
        loadMessages()
      }, 10000) // Poll every 10 seconds
      
      // Set up real-time subscription for new messages
      let subscription: any = null
      let retryCount = 0
      const maxRetries = 3
      
      const setupSubscription = () => {
        subscription = supabase
          .channel(`customer-conversation-${conversation.id}-${Date.now()}`)
          .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages',
            filter: `conversation_id=eq.${conversation.id}`
          }, (payload) => {
            console.log('📨 Customer received new message:', payload.new)
            console.log('📨 Message sender type:', payload.new.sender_type)
            console.log('📨 Conversation ID:', payload.new.conversation_id)
            console.log('📨 Current conversation ID:', conversation.id)
            
            // ตรวจสอบว่าเป็นข้อความใน conversation เดียวกัน
            if (payload.new.conversation_id !== conversation.id) {
              console.log('⚠️ Message not for this conversation, skipping')
              return
            }
            
            setMessages(prev => {
              // ตรวจสอบว่าเป็นข้อความใหม่จริงๆ
              const isDuplicate = prev.some(msg => msg.id === payload.new.id)
              if (isDuplicate) {
                console.log('⚠️ Duplicate message detected, skipping')
                return prev
              }
              const newMessages = [...prev, payload.new as Message]
              console.log('📨 Customer total messages after adding:', newMessages.length)
              console.log('📨 Customer received from:', payload.new.sender_type)
              console.log('📨 Customer all messages:', newMessages.map(m => ({ id: m.id, sender: m.sender_type, text: m.message_text?.substring(0, 20) })))
              // Auto scroll when new message arrives
              setTimeout(scrollToBottom, 100)
              return newMessages
            })
          })
          .subscribe((status) => {
            console.log('📡 Customer subscription status:', status)
            if (status === 'SUBSCRIBED') {
              console.log('✅ Customer successfully subscribed to conversation updates')
              retryCount = 0 // Reset retry count on successful subscription
            } else if (status === 'CHANNEL_ERROR') {
              console.error('❌ Customer channel subscription error')
              if (retryCount < maxRetries) {
                retryCount++
                console.log(`🔄 Customer retrying subscription (${retryCount}/${maxRetries})...`)
                setTimeout(() => {
                  if (subscription) {
                    subscription.unsubscribe()
                  }
                  setupSubscription()
                }, 2000 * retryCount) // Exponential backoff
              }
            } else if (status === 'TIMED_OUT') {
              console.error('❌ Customer subscription timed out')
              if (retryCount < maxRetries) {
                retryCount++
                console.log(`🔄 Customer retrying subscription (${retryCount}/${maxRetries})...`)
                setTimeout(() => {
                  if (subscription) {
                    subscription.unsubscribe()
                  }
                  setupSubscription()
                }, 2000 * retryCount) // Exponential backoff
              }
            }
          })
      }
      
      setupSubscription()

      return () => {
        console.log('🔌 Customer unsubscribing from conversation updates')
        clearInterval(pollInterval)
        if (subscription) {
          subscription.unsubscribe()
        }
      }
    }
  }, [conversation, isInitialized])

  const initializeConversation = async () => {
    setIsLoading(true)
    try {
      // ใช้ฐานข้อมูลโดยตรง (ไม่ใช้ Edge Function)
      // Normalize customer ID เพื่อป้องกันการสร้าง conversation ซ้ำ
      const normalizedCustomerId = normalizeCustomerId(customerId)
      console.log('🔍 Original customer_id:', `"${customerId}"`)
      console.log('🔍 Normalized customer_id:', `"${normalizedCustomerId}"`)
      
      // ตรวจสอบว่ามี conversation อยู่แล้วหรือไม่ (ใช้ normalized ID เพื่อป้องกัน whitespace)
      const { data: existingConversations, error: checkError } = await supabase
        .from('conversations')
        .select('*')
        .eq('customer_id', normalizedCustomerId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (checkError) {
        console.warn('⚠️ Error checking existing conversations:', checkError)
        // ไม่ throw error แต่ใช้ empty array แทน
        console.log('📝 Proceeding to create new conversation due to check error')
      }

      // ถ้ามี conversation อยู่แล้ว ให้ใช้ตัวล่าสุด
      if (existingConversations && existingConversations.length > 0) {
        console.log('✅ Found existing conversation:', existingConversations[0].id)
        setConversation(existingConversations[0])
        conversationRef.current = existingConversations[0]
        return
      }

      console.log('📝 Creating new conversation for customer:', normalizedCustomerId)
      // สร้าง conversation ใหม่ (ใช้ normalized customer ID เพื่อป้องกัน whitespace)
      const { data: conversationData, error: dbError } = await supabase
        .from('conversations')
        .insert({
          customer_id: normalizedCustomerId, // ใช้ normalized customer ID
          customer_name: customerName || `ลูกค้า ${normalizedCustomerId}`
        })
        .select()
        .single()

      if (dbError) {
        console.error('❌ Error creating conversation:', dbError)
        toast.error('ไม่สามารถสร้างการสนทนาได้ กรุณาลองใหม่อีกครั้ง')
        return
      }

      if (!conversationData) {
        console.error('❌ No conversation data returned')
        toast.error('ไม่ได้รับข้อมูลการสนทนา กรุณาลองใหม่อีกครั้ง')
        return
      }

      console.log('✅ Conversation created successfully:', conversationData.id)
      
      // ตรวจสอบว่า conversation ที่สร้างขึ้นถูกต้อง
      if (!conversationData.id) {
        console.error('❌ Created conversation has no ID')
        toast.error('การสนทนาที่สร้างขึ้นไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง')
        return
      }

      setConversation(conversationData)
      conversationRef.current = conversationData
      console.log('✅ Conversation state updated successfully')
    } catch (error) {
      console.error('❌ Error initializing conversation:', error)
      toast.error('ไม่สามารถเชื่อมต่อระบบแชทได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง')
      // ไม่ throw error เพื่อไม่ให้ crash
    } finally {
      setIsLoading(false)
    }
  }

  const loadMessages = async () => {
    if (!conversation) return

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true })

      if (error) throw error

      setMessages(data || [])
      // Mark messages as read
      markMessagesAsRead()
    } catch (error) {
      console.error('❌ Error loading messages:', error)
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อความ')
      // ไม่ throw error เพื่อไม่ให้ crash
    }
  }

  const markMessagesAsRead = async () => {
    if (!conversation) return

    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversation.id)
        .neq('sender_type', 'customer')
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  const sendMessage = async () => {
    if (!conversation || isSending) {
      console.log('❌ Cannot send message:', { conversation: !!conversation, isSending })
      return
    }
    
    // Check if there's content to send
    if (!newMessage.trim() && !imageFile) {
      toast.error('กรุณาพิมพ์ข้อความหรือเลือกรูปภาพ')
      return
    }
    
    console.log('📤 Sending message:', {
      conversation_id: conversation.id,
      customer_id: customerId,
      message_text: newMessage.trim(),
      has_image: !!imageFile
    })

    setIsSending(true)
    const messageText = newMessage.trim()
    setNewMessage('')
    
    // ตรวจสอบว่า conversation ID ถูกต้องหรือไม่
    if (!conversation.id) {
      console.error('❌ Conversation ID is null or undefined')
      toast.error('ไม่พบข้อมูลการสนทนา กรุณาลองใหม่อีกครั้ง')
      setIsSending(false)
      setNewMessage(messageText) // Restore message
      return
    }
    
    // Prevent multiple rapid sends
    const sendTimestamp = Date.now()
    if ((window as any).lastSendTime && sendTimestamp - (window as any).lastSendTime < 1000) {
      console.log('🚫 Message sent too quickly, preventing duplicate')
      setIsSending(false)
      setNewMessage(messageText) // Restore message
      return
    }
    (window as any).lastSendTime = sendTimestamp

    try {
      // ใช้ ref เพื่อหลีกเลี่ยง race condition
      let currentConversation = conversationRef.current || conversation
      
      // ตรวจสอบว่า conversation มี ID หรือไม่
      if (!currentConversation?.id) {
        console.error('❌ No conversation ID available, attempting to initialize...')
        
        // ลอง initialize conversation ก่อน
        try {
          await initializeConversation()
          // รอให้ state อัปเดต
          await new Promise(resolve => setTimeout(resolve, 200))
          
          // ใช้ ref หลังจาก initialize
          currentConversation = conversationRef.current
          if (!currentConversation?.id) {
            toast.error('ไม่สามารถเริ่มการสนทนาได้ กรุณาลองใหม่อีกครั้ง')
            setNewMessage(messageText) // Restore message
            return
          }
        } catch (initError) {
          console.error('❌ Error during conversation initialization:', initError)
          toast.error('ไม่สามารถเริ่มการสนทนาได้ กรุณาลองใหม่อีกครั้ง')
          setNewMessage(messageText) // Restore message
          return
        }
      }
      
      console.log('✅ Using conversation ID:', currentConversation.id)
      let imageUrl = null
      
      // Upload image if exists
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('chat-images')
          .upload(fileName, imageFile)
        
        if (uploadError) throw uploadError
        
        const { data: urlData } = supabase.storage
          .from('chat-images')
          .getPublicUrl(fileName)
        
        imageUrl = urlData.publicUrl
      }

      // ใช้ normalized customer ID สำหรับ sender_id เพื่อให้ตรงกับ conversation
      const normalizedCustomerId = normalizeCustomerId(customerId)
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: currentConversation.id,
          sender_type: 'customer',
          sender_id: normalizedCustomerId, // ใช้ normalized customer ID
          message_text: messageText || (imageUrl ? '[รูปภาพ]' : ''),
          message_type: imageUrl ? 'image' : 'text',
          image_url: imageUrl
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Error sending message:', error)
        throw error
      }

      console.log('✅ Message sent successfully:', data.id)
      setMessages(prev => {
        const newMessages = [...prev, data]
        // Auto scroll when sending new message
        setTimeout(() => {
          scrollToBottom()
        }, 100)
        return newMessages
      })
      // Clear image
      setImageFile(null)
      setImagePreview(null)

      // Handle bot automation
      if (botState === 'asking_name') {
        if (isEnglish(messageText)) {
          setCustomerRobloxName(messageText)
          setTimeout(async () => {
            await sendBotMessage('ใส่รหัสผ่านครับ')
            setBotState('asking_password')
          }, 1000)
        } else {
          setTimeout(async () => {
            await sendBotMessage('กรุณาส่งชื่อในเกม Roblox เป็นภาษาอังกฤษเท่านั้นครับ')
          }, 1000)
        }
      } else if (botState === 'asking_password') {
        setCustomerPassword(messageText)
        setTimeout(async () => {
          await sendBotMessage('ขอบคุณครับ รอจนกว่าแอดมินจะมาตอบ')
          setBotState('waiting_admin')
        }, 1000)
      }
    } catch (error) {
      console.error('❌ Error sending message:', error)
      console.error('❌ Error details:', {
        conversation_id: conversation?.id,
        customer_id: customerId,
        normalized_customer_id: normalizeCustomerId(customerId),
        message_text: messageText,
        image_file: imageFile?.name
      })
      setNewMessage(messageText) // Restore message if failed
      
      // แสดง error message ที่ user-friendly
      if (error && typeof error === 'object' && 'code' in error && error.code === 'PGRST116') {
        toast.error('ไม่พบการสนทนาในระบบ กรุณาลองใหม่อีกครั้ง')
      } else {
        toast.error(`เกิดข้อผิดพลาดในการส่งข้อความ: ${error?.message || 'ไม่ทราบสาเหตุ'}`)
      }
      
      // ถ้าเป็น conversation error ให้ลอง initialize conversation ใหม่
      if (error && typeof error === 'object' && 'code' in error) {
        console.log('🔄 Attempting to reinitialize conversation due to error')
        setTimeout(async () => {
          try {
            await initializeConversation()
          } catch (retryError) {
            console.error('❌ Error during retry initialization:', retryError)
          }
        }, 1000)
      }
    } finally {
      setIsSending(false)
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('ขนาดไฟล์ต้องไม่เกิน 10MB')
        return
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error('กรุณาเลือกไฟล์รูปภาพเท่านั้น')
        return
      }

      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleQuickReplyClick = async (button: { id: string; label: string; icon: string }) => {
    if (!conversation) return
    
    const quickReplyMessage = `${button.icon} ${button.label}`
    setShowQuickReply(false)
    
    // ส่งข้อความ Quick Reply ทันทีโดยไม่ต้องรอ setNewMessage
    setIsSending(true)
    
    try {
      const normalizedCustomerId = normalizeCustomerId(customerId)
      
      // สร้าง message data
      const messageData = {
        conversation_id: conversation.id,
        sender_type: 'customer',
        sender_id: normalizedCustomerId,
        message_text: quickReplyMessage,
        message_type: 'text',
        is_read: false
      }

      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single()

      if (error) throw error

      // เพิ่มข้อความใหม่เข้าไปใน state
      setMessages(prev => [...prev, data])
      
      // อัปเดต conversation
      await supabase
        .from('conversations')
        .update({ 
          updated_at: new Date().toISOString(),
          last_message: quickReplyMessage
        })
        .eq('id', conversation.id)

      // เริ่มระบบบอทอัตโนมัติ (ยกเว้นปุ่ม "สอบถาม")
      if (button.id !== 'inquiry') {
        setTimeout(async () => {
          await sendBotMessage('ส่งชื่อในเกม Roblox มาครับ (ภาษาอังกฤษเท่านั้น)')
          setBotState('asking_name')
        }, 1000)
      }

    } catch (error) {
      console.error('❌ Error sending quick reply:', error)
      toast.error('ไม่สามารถส่งข้อความได้')
    } finally {
      setIsSending(false)
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }


  if (!isOpen) return null

  // Show error state
  if (hasError) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Card className="w-80 h-[300px] flex flex-col shadow-2xl border-0 bg-gradient-to-br from-red-50 to-pink-50 backdrop-blur-xl relative overflow-hidden rounded-3xl">
          <CardHeader className="bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-t-3xl">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
              เกิดข้อผิดพลาด
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <div className="text-red-600 mb-4">
              <MessageCircle className="h-12 w-12 mx-auto mb-2" />
              <p className="text-sm">ไม่สามารถเชื่อมต่อระบบแชทได้</p>
            </div>
            <Button 
              onClick={() => {
                setHasError(false)
                initializeConversation()
              }}
              className="bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg"
            >
              ลองใหม่
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 h-[500px] flex flex-col shadow-2xl border-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 backdrop-blur-xl relative overflow-hidden rounded-3xl">
        {/* Animated background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-purple-400/10 to-pink-400/10 animate-pulse"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
        
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-t-3xl relative z-10 shadow-lg" style={{ fontFamily: 'Kanit, Prompt, Sarabun, -apple-system, BlinkMacSystemFont, sans-serif' }}>
          <div className="flex flex-col">
            <div className="text-xs text-white/80 mb-1">📥 Headline Inbox</div>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <div className="relative">
              <MessageCircle className="h-4 w-4 animate-bounce" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
            </div>
            💬 แชทกับแอดมิน
          </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0 text-white hover:bg-white/20 transition-all duration-200 hover:scale-110"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0 relative z-10">
          {/* Messages Area */}
          <div className="flex-1 px-4 bg-gradient-to-b from-white/60 via-blue-50/40 to-purple-50/40 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-transparent hover:scrollbar-thumb-blue-400" style={{ maxHeight: '308px', minHeight: '200px' }}>
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex items-center gap-3 text-sm text-blue-600">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-200"></div>
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent absolute top-0 left-0"></div>
                  </div>
                  <span className="font-medium">กำลังโหลด...</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-3">
                {/* Quick Reply Buttons */}
                <QuickReplyButtons
                  onButtonClick={handleQuickReplyClick}
                  isVisible={messages.length === 0}
                />
                
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-center">
                  </div>
                ) : (
                  <div>
                    {messages.map((message) => (
                    <div
                      key={message.id}
                        className={`flex ${message.sender_type === 'customer' ? 'justify-end' : 'justify-start'} animate-fade-in mb-2`}
                    >
                      <div
                        className={`rounded-3xl px-4 py-3 text-sm shadow-lg transition-all duration-200 hover:scale-105 message-bubble ${
                          message.sender_type === 'customer'
                              ? 'message-bubble-customer bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white relative overflow-hidden max-w-[90%] break-words mr-2'
                              : 'message-bubble-admin bg-gradient-to-r from-gray-100 to-gray-200 border border-gray-300 text-gray-800 relative overflow-hidden max-w-[90%] break-words ml-2'
                        }`}
                      >
                        {/* Message bubble effect */}
                        {message.sender_type === 'customer' && (
                          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
                        )}
                        {message.sender_type === 'admin' && (
                          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"></div>
                        )}
                        
                        {/* Message content */}
                        <div className="relative z-10">
                          {message.message_type === 'image' && message.image_url ? (
                            <div className="mb-2">
                              <img 
                                src={message.image_url} 
                                alt="รูปภาพ" 
                                className="max-w-full h-auto rounded-lg shadow-sm"
                                style={{maxHeight: '200px'}}
                              />
                            </div>
                          ) : null}
                          <div className="leading-relaxed message-text" style={{ fontFamily: 'Kanit, Prompt, Sarabun, -apple-system, BlinkMacSystemFont, sans-serif' }}>
                            {message.message_text}
                          </div>
                        </div>
                        <div className={`text-xs mt-2 relative z-10 ${
                          message.sender_type === 'customer' 
                            ? 'text-white/80' 
                            : 'text-gray-500'
                        }`}>
                          {formatTime(message.created_at)}
                        </div>
                      </div>
                    </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="flex-shrink-0 p-4 border-t bg-gradient-to-r from-white via-blue-50/50 to-purple-50/50 relative">
            {/* Quick Reply Buttons in Input Area */}
            {showQuickReply && (
              <div className="mb-3">
                <QuickReplyButtons
                  onButtonClick={handleQuickReplyClick}
                  isVisible={true}
                />
              </div>
            )}
            
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-4 min-h-[70px] flex items-center gap-3 shadow-lg border border-white/20">
              {/* Image Preview in Input Bar */}
              {imagePreview ? (
                <div className="relative">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                    className="w-14 h-14 object-cover rounded-2xl shadow-md"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 p-0 shadow-lg hover:scale-110 transition-transform"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!canCustomerType}
                  className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 rounded-2xl flex items-center justify-center shadow-md hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Image className="h-6 w-6 text-gray-600" />
                </Button>
            )}
            
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={canCustomerType ? "พิมพ์ข้อความ..." : "รอแอดมินตอบกลับก่อน..."}
                disabled={isSending || isLoading || !canCustomerType}
                className="flex-1 border-0 bg-transparent focus:ring-0 focus:outline-none text-gray-800 placeholder:text-gray-400 font-sans text-base placeholder:font-light"
                style={{ fontFamily: 'Kanit, Prompt, Sarabun, -apple-system, BlinkMacSystemFont, sans-serif' }}
              />
              
              {/* Quick Reply Toggle Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowQuickReply(!showQuickReply)}
                className="text-gray-500 hover:text-gray-700"
                title="Quick Reply"
              >
                💬
              </Button>
              
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              
              <Button
                onClick={sendMessage}
                disabled={isSending || isLoading || !canCustomerType}
                size="sm"
                className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-2xl shadow-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
              >
                {isSending ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

