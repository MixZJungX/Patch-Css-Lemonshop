import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const { searchTerm } = await req.json()

    if (!searchTerm) {
      return new Response(
        JSON.stringify({ success: false, error: 'กรุณาระบุคำค้นหา' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    const searchLower = searchTerm.toLowerCase().trim()

    // ค้นหาใน queue_items
    const { data: queueData, error: queueError } = await supabaseClient
      .from('queue_items')
      .select('*')
      .or(`roblox_username.ilike.%${searchLower}%,contact_info.ilike.%${searchLower}%,assigned_code.ilike.%${searchLower}%,assigned_account_code.ilike.%${searchLower}%,contact_info.ilike.%ชื่อ: ${searchLower}%,contact_info.ilike.%ชื่อ:${searchLower}%,contact_info.ilike.%Username: ${searchLower}%,contact_info.ilike.%Username:${searchLower}%`)

    if (queueError) {
      console.error('Error searching queue_items:', queueError)
      return new Response(
        JSON.stringify({ success: false, error: queueError.message }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    // ค้นหาใน redemption_requests
    const { data: redemptionData, error: redemptionError } = await supabaseClient
      .from('app_284beb8f90_redemption_requests')
      .select('*')
      .or(`roblox_username.ilike.%${searchLower}%,contact_info.ilike.%${searchLower}%,assigned_code.ilike.%${searchLower}%,assigned_account_code.ilike.%${searchLower}%,contact_info.ilike.%ชื่อ: ${searchLower}%,contact_info.ilike.%ชื่อ:${searchLower}%,contact_info.ilike.%Username: ${searchLower}%,contact_info.ilike.%Username:${searchLower}%`)

    if (redemptionError) {
      console.error('Error searching redemption_requests:', redemptionError)
    }

    // รวมผลลัพธ์
    const allResults = [...(queueData || []), ...(redemptionData || [])]

    return new Response(
      JSON.stringify({ 
        success: true, 
        results: allResults,
        queueItems: queueData || [],
        redemptionRequests: redemptionData || [],
        searchTerm: searchTerm
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in test_search function:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})


