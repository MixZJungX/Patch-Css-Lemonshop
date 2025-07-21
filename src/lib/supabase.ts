import { createClient } from '@supabase/supabase-js'

// Supabase connection details
const supabaseUrl = 'https://yvactofmmdiauewmkqnk.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2YWN0b2ZtbWRpYXVld21rcW5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0OTM1MDcsImV4cCI6MjA2ODA2OTUwN30.JnejY9s6rRR75O3h7FqkGzWDkSQTmJ8W4R0cA_MME34'

// Create client with error handling
const createSupabaseClient = () => {
  try {
    return createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
      }
    })
  } catch (error) {
    console.error('Error initializing Supabase client:', error)
    // Return a mock client that doesn't throw errors but logs them
    return {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: { message: 'Backend unavailable' } }),
            then: () => Promise.resolve([])
          }),
          ilike: () => Promise.resolve({ data: [], error: null }),
          then: () => Promise.resolve([])
        }),
        insert: () => Promise.resolve({ error: { message: 'Backend unavailable' } }),
        update: () => ({
          eq: () => Promise.resolve({ error: { message: 'Backend unavailable' } })
        })
      }),
      auth: {
        signIn: () => Promise.resolve({ error: { message: 'Backend unavailable' } }),
        signOut: () => Promise.resolve({ error: null }),
        onAuthStateChange: () => ({ data: null, error: null })
      }
    }
  }
}

export const supabase = createSupabaseClient()