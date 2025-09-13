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

    // ดึงข้อมูลจาก queue_items
    const { data: queueData, error: queueError } = await supabaseClient
      .from('queue_items')
      .select('*')
      .limit(10)

    if (queueError) {
      console.error('Error loading queue_items:', queueError)
    }

    // ดึงข้อมูลจาก redemption_requests
    const { data: redemptionData, error: redemptionError } = await supabaseClient
      .from('app_284beb8f90_redemption_requests')
      .select('*')
      .limit(10)

    if (redemptionError) {
      console.error('Error loading redemption_requests:', redemptionError)
    }

    // ทดสอบการค้นหา "JarnBanG"
    const searchTerms = ['jarnbang', 'JarnBanG', 'JARNBANG', 'JarnBang']
    const searchResults = []

    for (const term of searchTerms) {
      const { data: queueSearchData, error: queueSearchError } = await supabaseClient
        .from('queue_items')
        .select('*')
        .or(`roblox_username.ilike.%${term}%,contact_info.ilike.%${term}%`)

      if (!queueSearchError && queueSearchData && queueSearchData.length > 0) {
        searchResults.push({
          term: term,
          table: 'queue_items',
          results: queueSearchData
        })
      }

      const { data: redemptionSearchData, error: redemptionSearchError } = await supabaseClient
        .from('app_284beb8f90_redemption_requests')
        .select('*')
        .or(`roblox_username.ilike.%${term}%,contact_info.ilike.%${term}%`)

      if (!redemptionSearchError && redemptionSearchData && redemptionSearchData.length > 0) {
        searchResults.push({
          term: term,
          table: 'redemption_requests',
          results: redemptionSearchData
        })
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        queueItems: queueData || [],
        redemptionRequests: redemptionData || [],
        searchResults: searchResults,
        summary: {
          queueItemsCount: queueData?.length || 0,
          redemptionRequestsCount: redemptionData?.length || 0,
          searchResultsCount: searchResults.length
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in debug_queue function:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})


