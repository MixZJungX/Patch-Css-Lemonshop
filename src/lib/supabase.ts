import { createClient } from '@supabase/supabase-js'

// Supabase connection details
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yvactofmmdiauewmkqnk.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2YWN0b2ZtbWRpYXVld21rcW5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0OTM1MDcsImV4cCI6MjA2ODA2OTUwN30.JnejY9s6rRR75O3h7FqkGzWDkSQTmJ8W4R0cA_MME34'

// Create client with comprehensive error handling
const createSupabaseClient = () => {
  try {
    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase configuration missing, using fallback client')
      return createFallbackClient()
    }

    return createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        flowType: 'pkce'
      },
      global: {
        headers: {
          'X-Client-Info': 'robux-exchange@1.0.0'
        }
      }
    })
  } catch (error) {
    console.error('Error initializing Supabase client:', error)
    return createFallbackClient()
  }
}

// Fallback client for when Supabase is unavailable
const createFallbackClient = () => {
  const mockResponse = { data: null, error: { message: 'เซิร์ฟเวอร์ไม่พร้อมใช้งาน กรุณาลองใหม่อีกครั้ง' } }
  const mockArrayResponse = { data: [], error: null }
  
  return {
    from: (table: string) => ({
      select: (columns?: string) => ({
        eq: (column: string, value: unknown) => ({
          single: () => Promise.resolve(mockResponse),
          limit: (count: number) => Promise.resolve(mockArrayResponse),
          order: (column: string, options?: { ascending?: boolean }) => Promise.resolve(mockArrayResponse)
        }),
        ilike: (column: string, pattern: string) => Promise.resolve(mockArrayResponse),
        order: (column: string, options?: { ascending?: boolean }) => Promise.resolve(mockArrayResponse),
        limit: (count: number) => Promise.resolve(mockArrayResponse),
        range: (from: number, to: number) => Promise.resolve(mockArrayResponse)
      }),
      insert: (data: Record<string, unknown>) => Promise.resolve({ data: null, error: { message: 'เซิร์ฟเวอร์ไม่พร้อมใช้งาน' } }),
      update: (data: Record<string, unknown>) => ({
        eq: (column: string, value: unknown) => Promise.resolve(mockResponse)
      }),
      delete: () => ({
        eq: (column: string, value: unknown) => Promise.resolve(mockResponse)
      })
    }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'เซิร์ฟเวอร์ไม่พร้อมใช้งาน' } }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: (callback: (event: string, session: unknown) => void) => {
        // Return a subscription-like object
        return {
          data: {
            subscription: {
              unsubscribe: () => {}
            }
          }
        }
      }
    },
    functions: {
      invoke: (functionName: string, options?: Record<string, unknown>) => Promise.resolve(mockResponse)
    }
  }
}

export const supabase = createSupabaseClient()

// Export utility function to check if Supabase is available
export const isSupabaseAvailable = () => {
  return Boolean(supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project') && !supabaseKey.includes('your-anon-key'))
}