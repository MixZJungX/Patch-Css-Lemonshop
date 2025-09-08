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
    // Create a Supabase client with the Auth context of the function
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Get the request body
    const { requestId, requestType } = await req.json()

    if (!requestId) {
      return new Response(
        JSON.stringify({ error: 'Request ID is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Determine which table to delete from based on request type
    let tableName = 'app_284beb8f90_redemption_requests'
    if (requestType === 'rainbow') {
      tableName = 'app_284beb8f90_rainbow_requests'
    }

    console.log(`🗑️ Attempting to delete request ID: ${requestId} from table: ${tableName}`)

    // First, check if the request exists
    const { data: existingRequest, error: selectError } = await supabaseClient
      .from(tableName)
      .select('id')
      .eq('id', requestId)
      .single()

    if (selectError) {
      console.error('❌ Error checking if request exists:', selectError)
      
      // Try the other table if the first one failed
      const otherTable = tableName === 'app_284beb8f90_rainbow_requests' 
        ? 'app_284beb8f90_redemption_requests' 
        : 'app_284beb8f90_rainbow_requests'
      
      console.log(`🔄 Trying alternative table: ${otherTable}`)
      
      const { data: altExistingRequest, error: altSelectError } = await supabaseClient
        .from(otherTable)
        .select('id')
        .eq('id', requestId)
        .single()
      
      if (altSelectError) {
        return new Response(
          JSON.stringify({ error: 'Request not found in either table' }),
          { 
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
      
      tableName = otherTable
    }

    // Delete the request
    const { data: deletedData, error: deleteError } = await supabaseClient
      .from(tableName)
      .delete()
      .eq('id', requestId)
      .select()

    if (deleteError) {
      console.error('❌ Error deleting request:', deleteError)
      return new Response(
        JSON.stringify({ error: deleteError.message }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!deletedData || deletedData.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No rows were deleted' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`✅ Successfully deleted request from table: ${tableName}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Request deleted successfully',
        deletedData,
        tableName
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

