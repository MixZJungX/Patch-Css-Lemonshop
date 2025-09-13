import React, { useState, useEffect, useRef } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { ScrollArea } from './ui/scroll-area'
import { Badge } from './ui/badge'
import { Send, MessageCircle, Users, Clock, Trash2, Image, MoreVertical, AlertTriangle, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

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
  last_message_at: string
  message_count: number
  unread_customer_messages: number
  last_message: string
  queue_number?: number // เพิ่ม queue_number
  customer_info?: {
    username?: string
    phone?: string
    password?: string
    code?: string
    contact_info?: string
  } // เพิ่มข้อมูลลูกค้า
}

interface AdminChatPanelProps {
  adminId: string
}

export const AdminChatPanel: React.FC<AdminChatPanelProps> = ({ adminId }) => {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{type: 'conversation' | 'message', id: string} | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // ฟังก์ชันดึงหมายเลขคิวและข้อมูลลูกค้าจาก username
  const getQueueDataFromUsername = async (username: string): Promise<{queue_number: number | null, customer_info: any}> => {
    try {
      const { data, error } = await supabase
        .from('queue_items')
        .select('queue_number, contact_info, roblox_username, customer_name')
        .or(`roblox_username.ilike.%${username}%,contact_info.ilike.%${username}%,customer_name.ilike.%${username}%`)
        .limit(1)
        .maybeSingle()

      if (error) {
        console.warn('⚠️ Error fetching queue data for username:', username, error)
        return { queue_number: null, customer_info: null }
      }

      if (!data) {
        return { queue_number: null, customer_info: null }
      }

      // แยกข้อมูลจาก contact_info
      const contactInfo = data.contact_info || ''
      const usernameFromContact = contactInfo.match(/ชื่อ:\s*([^|]+)/)?.[1]?.trim() ||
                                  contactInfo.match(/Username:\s*([^|]+)/)?.[1]?.trim() ||
                                  data.roblox_username ||
                                  data.customer_name
      
      const phoneFromContact = contactInfo.match(/เบอร์โทร:\s*([^|]+)/)?.[1]?.trim() ||
                               contactInfo.match(/Phone:\s*([^|]+)/)?.[1]?.trim()
      
      const passwordFromContact = contactInfo.match(/Password:\s*([^|]+)/)?.[1]?.trim() ||
                                  contactInfo.match(/รหัสผ่าน:\s*([^|]+)/)?.[1]?.trim()
      
      const codeFromContact = contactInfo.match(/Code:\s*([^|]+)/)?.[1]?.trim() ||
                              contactInfo.match(/โค้ด:\s*([^|]+)/)?.[1]?.trim()

      const customer_info = {
        username: usernameFromContact,
        phone: phoneFromContact,
        password: passwordFromContact,
        code: codeFromContact,
        contact_info: contactInfo
      }

      // Debug log
      console.log('🔍 Queue data for username:', username, {
        queue_number: data.queue_number,
        contact_info: contactInfo,
        parsed_data: {
          username: usernameFromContact,
          phone: phoneFromContact,
          password: passwordFromContact,
          code: codeFromContact
        }
      })

      return { 
        queue_number: data.queue_number, 
        customer_info 
      }
    } catch (error) {
      console.warn('⚠️ Error in getQueueDataFromUsername:', error)
      return { queue_number: null, customer_info: null }
    }
  }
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load conversations on component mount
  useEffect(() => {
    loadConversations()
    loadUnreadCount()
    
    // Set up polling for new messages
    const interval = setInterval(() => {
      loadConversations()
      loadUnreadCount()
      if (selectedConversation) {
        loadMessages(selectedConversation.id)
      }
    }, 5000) // Poll every 5 seconds

    return () => clearInterval(interval)
  }, [selectedConversation])

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id)
      markMessagesAsRead(selectedConversation.id)
    }
  }, [selectedConversation])

  const loadConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          messages!inner(id, sender_type, is_read, created_at)
        `)
        .order('last_message_at', { ascending: false })

      if (error) throw error

      // Process data to match expected format
      const processedConversations = await Promise.all(
        (data || []).map(async conv => {
          // ดึงหมายเลขคิวและข้อมูลลูกค้าจาก username
          const { queue_number, customer_info } = await getQueueDataFromUsername(conv.customer_id)
          
          // Debug log
          console.log('🔍 Conversation data for:', conv.customer_id, {
            queue_number,
            customer_info,
            original_conv: conv
          })
          
          return {
        id: conv.id,
        customer_id: conv.customer_id,
        customer_name: conv.customer_name,
        status: conv.status,
        created_at: conv.created_at,
        updated_at: conv.updated_at,
        last_message_at: conv.last_message_at,
        message_count: conv.messages?.length || 0,
        unread_customer_messages: conv.messages?.filter((m: any) => m.sender_type === 'customer' && !m.is_read).length || 0,
            last_message: conv.messages?.[conv.messages.length - 1]?.message_text || '',
            queue_number: queue_number, // เพิ่มหมายเลขคิว
            customer_info: customer_info // เพิ่มข้อมูลลูกค้า
          }
        })
      )

      // จัดกลุ่ม conversation โดย normalize customer_id เพื่อรวม conversation ที่ควรจะเป็นอันเดียวกัน
      const groupedConversations = processedConversations.reduce((acc: any[], conv: any) => {
        const normalizedCustomerId = conv.customer_id?.trim().toLowerCase() || ''
        const existing = acc.find(c => (c.customer_id?.trim().toLowerCase() || '') === normalizedCustomerId)
        
        if (!existing) {
          acc.push({ ...conv, customer_id: normalizedCustomerId }) // ใช้ normalized version
        } else if (new Date(conv.updated_at) > new Date(existing.updated_at)) {
          // แทนที่ด้วย conversation ที่ใหม่กว่า
          const index = acc.findIndex(c => (c.customer_id?.trim().toLowerCase() || '') === normalizedCustomerId)
          acc[index] = { ...conv, customer_id: normalizedCustomerId } // ใช้ normalized version
        }
        return acc
      }, [])

      console.log('📊 Total conversations before grouping:', processedConversations.length)
      console.log('📊 Total conversations after grouping:', groupedConversations.length)
      
      // ลบ conversation เก่าที่ซ้ำกัน (ไม่ใช่ตัวล่าสุด) - ใช้ normalized comparison
      const conversationsToDelete = processedConversations.filter(conv => {
        const normalizedCustomerId = conv.customer_id?.trim().toLowerCase() || ''
        const latest = groupedConversations.find(g => g.customer_id === normalizedCustomerId)
        return latest && latest.id !== conv.id
      })
      
      if (conversationsToDelete.length > 0) {
        console.log('🗑️ Deleting duplicate conversations:', conversationsToDelete.length)
        for (const conv of conversationsToDelete) {
          try {
            // ลบข้อความใน conversation เก่าก่อน
            await supabase
              .from('messages')
              .delete()
              .eq('conversation_id', conv.id)
            
            // ลบ conversation เก่า
            await supabase
              .from('conversations')
              .delete()
              .eq('id', conv.id)
            
            console.log('✅ Deleted duplicate conversation:', conv.id)
          } catch (deleteError) {
            console.error('❌ Error deleting duplicate conversation:', conv.id, deleteError)
          }
        }
      }
      
      setConversations(groupedConversations)
    } catch (error) {
      console.error('Error loading conversations:', error)
    }
  }

  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) throw error

      setMessages(data || [])
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const loadUnreadCount = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id')
        .eq('sender_type', 'customer')
        .eq('is_read', false)

      if (error) throw error

      setUnreadCount(data?.length || 0)
    } catch (error) {
      console.error('Error loading unread count:', error)
    }
  }

  const markMessagesAsRead = async (conversationId: string) => {
    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_type', 'admin')
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  const sendMessage = async () => {
    if ((!newMessage.trim() && !imageFile) || !selectedConversation || isSending) return

    setIsSending(true)
    const messageText = newMessage.trim()
    setNewMessage('')
    
    // Prevent multiple rapid sends
    const sendTimestamp = Date.now()
    if (window.lastAdminSendTime && sendTimestamp - window.lastAdminSendTime < 1000) {
      console.log('🚫 Admin message sent too quickly, preventing duplicate')
      setIsSending(false)
      setNewMessage(messageText) // Restore message
      return
    }
    window.lastAdminSendTime = sendTimestamp

    try {
      // ตรวจสอบว่า conversation มี ID หรือไม่ (ไม่ต้องตรวจสอบในฐานข้อมูล)
      if (!selectedConversation?.id) {
        console.error('❌ No selected conversation ID available')
        toast.error('ไม่พบการสนทนา กรุณาลองใหม่อีกครั้ง')
        setNewMessage(messageText) // Restore message
        return
      }
      
      console.log('✅ Using admin conversation ID:', selectedConversation.id)
      
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

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_type: 'admin',
          sender_id: adminId,
          message_text: messageText || (imageUrl ? '[รูปภาพ]' : ''),
          message_type: imageUrl ? 'image' : 'text',
          image_url: imageUrl
        })
        .select()
        .single()

      if (error) throw error

      setMessages(prev => {
        const newMessages = [...prev, data]
        // Auto scroll to bottom after state update
        setTimeout(() => {
          scrollToBottom()
        }, 100)
        return newMessages
      })
      // Clear image
      setImageFile(null)
      setImagePreview(null)
      // Refresh conversations to update last message
      loadConversations()
      toast.success('ส่งข้อความเรียบร้อย')
    } catch (error) {
      console.error('❌ Admin error sending message:', error)
      console.error('❌ Admin error details:', {
        conversation_id: selectedConversation?.id,
        admin_id: adminId,
        message_text: messageText,
        image_file: imageFile?.name
      })
      setNewMessage(messageText) // Restore message if failed
      toast.error(`เกิดข้อผิดพลาดในการส่งข้อความ: ${error.message || 'ไม่ทราบสาเหตุ'}`)
    } finally {
      setIsSending(false)
    }
  }

  const deleteConversation = async (conversationId: string) => {
    try {
      // Delete all messages first
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', conversationId)

      if (messagesError) throw messagesError

      // Delete conversation
      const { error: conversationError } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId)

      if (conversationError) throw conversationError

      // Update state
      setConversations(prev => prev.filter(conv => conv.id !== conversationId))
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null)
        setMessages([])
      }
      
      toast.success('ลบการสนทนาเรียบร้อย')
    } catch (error) {
      console.error('Error deleting conversation:', error)
      toast.error('เกิดข้อผิดพลาดในการลบการสนทนา')
    }
  }

  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)

      if (error) throw error

      setMessages(prev => prev.filter(msg => msg.id !== messageId))
      toast.success('ลบข้อความเรียบร้อย')
    } catch (error) {
      console.error('Error deleting message:', error)
      toast.error('เกิดข้อผิดพลาดในการลบข้อความ')
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('ขนาดไฟล์ต้องไม่เกิน 5MB')
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

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return formatTime(timestamp)
    } else {
      return date.toLocaleDateString('th-TH', {
        month: 'short',
        day: 'numeric'
      })
    }
  }


  return (
    <div className="h-full flex bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 via-purple-400/5 to-pink-400/5 animate-pulse"></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
      
      {/* Conversations List */}
      <div className="w-80 border-r flex flex-col bg-white/90 backdrop-blur-xl relative z-10 shadow-2xl">
        <div className="p-4 border-b bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
          <div className="flex items-center justify-between relative z-10">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <div className="relative">
                <MessageCircle className="h-5 w-5 animate-bounce" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
              </div>
              💬 แชทลูกค้า
            </h2>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2 animate-pulse shadow-lg">
                {unreadCount}
              </Badge>
            )}
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            {conversations.length === 0 ? (
              <div className="text-center text-sm text-blue-600 py-8">
                <div className="text-5xl mb-3 animate-bounce">📭</div>
                <p className="font-semibold text-lg">ยังไม่มีข้อความจากลูกค้า</p>
                <p className="text-xs text-blue-500 mt-2 bg-blue-100/50 rounded-full px-3 py-1 inline-block">
                  รอข้อความใหม่จากลูกค้า
                </p>
              </div>
            ) : (
              conversations.map((conversation) => (
                <Card
                  key={conversation.id}
                  className={`cursor-pointer transition-all duration-300 shadow-lg hover:shadow-xl ${
                    selectedConversation?.id === conversation.id
                      ? 'bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 border-2 border-blue-300 shadow-xl scale-105'
                      : 'hover:bg-gradient-to-r hover:from-blue-50 hover:via-purple-50 hover:to-pink-50 hover:shadow-xl hover:scale-102'
                  }`}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <CardContent className="p-4 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"></div>
                    <div className="flex items-start justify-between relative z-10">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm truncate text-gray-800">
                            🎫 คิว #{conversation.queue_number || conversation.customer_id}
                          </p>
                          {conversation.unread_customer_messages > 0 && (
                            <Badge variant="destructive" className="text-xs animate-pulse shadow-lg">
                              {conversation.unread_customer_messages}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          👤 ชื่อ: {conversation.customer_info?.username || conversation.customer_name}
                        </p>
                        
                        {/* แสดงข้อมูลจาก customer_info ถ้ามี */}
                        {conversation.customer_info?.phone && (
                          <p className="text-xs text-gray-500">
                            📞 เบอร์: {conversation.customer_info.phone}
                          </p>
                        )}
                        {conversation.customer_info?.password && (
                          <p className="text-xs text-gray-500">
                            🔒 รหัสผ่าน: {conversation.customer_info.password}
                          </p>
                        )}
                        {conversation.customer_info?.code && (
                          <p className="text-xs text-gray-500">
                            🎫 โค้ด: {conversation.customer_info.code}
                          </p>
                        )}
                        
                        {/* แสดงข้อมูลจาก contact_info ถ้า customer_info ไม่มี */}
                        {!conversation.customer_info?.phone && conversation.customer_info?.contact_info && (
                          <>
                            {conversation.customer_info.contact_info.includes('เบอร์โทร:') && (
                              <p className="text-xs text-gray-500">
                                📞 เบอร์: {conversation.customer_info.contact_info.match(/เบอร์โทร:\s*([^|]+)/)?.[1]?.trim()}
                              </p>
                            )}
                            {conversation.customer_info.contact_info.includes('Password:') && (
                              <p className="text-xs text-gray-500">
                                🔒 รหัสผ่าน: {conversation.customer_info.contact_info.match(/Password:\s*([^|]+)/)?.[1]?.trim()}
                              </p>
                            )}
                            {conversation.customer_info.contact_info.includes('Code:') && (
                              <p className="text-xs text-gray-500">
                                🎫 โค้ด: {conversation.customer_info.contact_info.match(/Code:\s*([^|]+)/)?.[1]?.trim()}
                              </p>
                            )}
                          </>
                        )}
                        {conversation.last_message && (
                          <p className="text-xs text-gray-600 mt-2 truncate bg-gray-50/50 rounded-lg px-2 py-1">
                            💬 {conversation.last_message}
                          </p>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 ml-2 bg-gray-100/50 rounded-full px-2 py-1">
                        {formatDate(conversation.last_message_at)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white/95 backdrop-blur-xl relative z-10 shadow-2xl">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-gradient-to-r from-white via-blue-50/50 to-purple-50/50 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"></div>
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-lg">
                    🎫 คิว #{selectedConversation.queue_number || selectedConversation.customer_id}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    👤 ชื่อ: {selectedConversation.customer_info?.username || selectedConversation.customer_name}
                  </p>
                  
                  {/* แสดงข้อมูลจาก customer_info ถ้ามี */}
                  {selectedConversation.customer_info?.phone && (
                    <p className="text-sm text-gray-500">
                      📞 เบอร์: {selectedConversation.customer_info.phone}
                    </p>
                  )}
                  {selectedConversation.customer_info?.password && (
                    <p className="text-sm text-gray-500">
                      🔒 รหัสผ่าน: {selectedConversation.customer_info.password}
                    </p>
                  )}
                  {selectedConversation.customer_info?.code && (
                    <p className="text-sm text-gray-500">
                      🎫 โค้ด: {selectedConversation.customer_info.code}
                    </p>
                  )}
                  
                  {/* แสดงข้อมูลจาก contact_info ถ้า customer_info ไม่มี */}
                  {!selectedConversation.customer_info?.phone && selectedConversation.customer_info?.contact_info && (
                    <>
                      {selectedConversation.customer_info.contact_info.includes('เบอร์โทร:') && (
                        <p className="text-sm text-gray-500">
                          📞 เบอร์: {selectedConversation.customer_info.contact_info.match(/เบอร์โทร:\s*([^|]+)/)?.[1]?.trim()}
                        </p>
                      )}
                      {selectedConversation.customer_info.contact_info.includes('Password:') && (
                        <p className="text-sm text-gray-500">
                          🔒 รหัสผ่าน: {selectedConversation.customer_info.contact_info.match(/Password:\s*([^|]+)/)?.[1]?.trim()}
                        </p>
                      )}
                      {selectedConversation.customer_info.contact_info.includes('Code:') && (
                        <p className="text-sm text-gray-500">
                          🎫 โค้ด: {selectedConversation.customer_info.contact_info.match(/Code:\s*([^|]+)/)?.[1]?.trim()}
                        </p>
                      )}
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-blue-600 font-semibold bg-blue-100/50 rounded-full px-3 py-1">
                    💬 {selectedConversation.message_count} ข้อความ
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDeleteTarget({type: 'conversation', id: selectedConversation.id})
                      setShowDeleteConfirm(true)
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4 bg-gradient-to-b from-white/60 via-blue-50/40 to-purple-50/40 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-transparent hover:scrollbar-thumb-blue-400">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-sm text-blue-600 py-8">
                    <div className="text-5xl mb-3 animate-bounce">💬</div>
                    <p className="font-semibold text-lg">เริ่มต้นการสนทนา</p>
                    <p className="text-xs text-blue-500 mt-2 bg-blue-100/50 rounded-full px-3 py-1 inline-block">
                      ส่งข้อความแรกให้ลูกค้า
                    </p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_type === 'admin' ? 'justify-end' : 'justify-start'} animate-fade-in group mb-3`}
                    >
                      <div className="relative">
                        <div
                          className={`rounded-3xl px-4 py-3 shadow-lg transition-all duration-200 hover:scale-105 message-bubble ${
                            message.sender_type === 'admin'
                              ? 'message-bubble-admin bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white relative overflow-hidden max-w-[90%] break-words mr-2'
                              : 'message-bubble-customer bg-gradient-to-r from-gray-100 to-gray-200 border border-gray-300 text-gray-800 relative overflow-hidden max-w-[90%] break-words ml-2'
                          }`}
                        >
                          {/* Message bubble effect */}
                          {message.sender_type === 'admin' && (
                            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
                          )}
                          {message.sender_type === 'customer' && (
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
                                  style={{maxHeight: '300px'}}
                                />
                              </div>
                            ) : null}
                            <div className="text-sm leading-relaxed message-text">
                              {message.message_text}
                            </div>
                          </div>
                          
                          <div className={`text-xs mt-2 relative z-10 ${
                            message.sender_type === 'admin' 
                              ? 'text-white/80' 
                              : 'text-gray-500'
                          }`}>
                            {formatTime(message.created_at)}
                          </div>
                        </div>
                        
                        {/* Delete button for admin messages */}
                        {message.sender_type === 'admin' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDeleteTarget({type: 'message', id: message.id})
                              setShowDeleteConfirm(true)
                            }}
                            className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t bg-gradient-to-r from-white via-blue-50/50 to-purple-50/50 relative">
              {/* Image Preview */}
              {imagePreview && (
                <div className="mb-3 relative">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="max-w-32 h-32 object-cover rounded-lg shadow-sm"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
              
              <div className="flex gap-3">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="พิมพ์ข้อความ..."
                  disabled={isSending}
                  className="flex-1 border-2 border-blue-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-400/20 rounded-2xl bg-white/80 backdrop-blur-sm transition-all duration-200"
                />
                
                {/* Image Upload Button */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 bg-green-500 hover:bg-green-600 text-white rounded-2xl shadow-lg transition-all duration-200 hover:scale-105"
                >
                  <Image className="h-4 w-4" />
                </Button>
                
                <Button
                  onClick={sendMessage}
                  disabled={(!newMessage.trim() && !imageFile) || isSending}
                  size="sm"
                  className="px-5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white rounded-2xl shadow-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isSending ? (
                    <div className="relative">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30"></div>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent absolute top-0 left-0"></div>
                    </div>
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50/50 via-purple-50/50 to-pink-50/50 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 via-purple-400/5 to-pink-400/5 animate-pulse"></div>
            <div className="text-center text-blue-600 relative z-10">
              <div className="text-7xl mb-4 animate-bounce">💬</div>
              <p className="text-xl font-semibold mb-2">เลือกการสนทนาจากรายการด้านซ้าย</p>
              <p className="text-sm text-blue-500 bg-blue-100/50 rounded-full px-4 py-2 inline-block">
                คลิกที่การสนทนาเพื่อเริ่มแชท
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {deleteTarget.type === 'conversation' ? 'ลบการสนทนา' : 'ลบข้อความ'}
                </h3>
                <p className="text-sm text-gray-500">
                  {deleteTarget.type === 'conversation' 
                    ? 'การสนทนาทั้งหมดจะถูกลบอย่างถาวร' 
                    : 'ข้อความนี้จะถูกลบอย่างถาวร'
                  }
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setDeleteTarget(null)
                }}
                className="rounded-xl"
              >
                ยกเลิก
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (deleteTarget.type === 'conversation') {
                    deleteConversation(deleteTarget.id)
                  } else {
                    deleteMessage(deleteTarget.id)
                  }
                  setShowDeleteConfirm(false)
                  setDeleteTarget(null)
                }}
                className="rounded-xl"
              >
                ลบ
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
