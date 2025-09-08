import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] ${req.method} ${req.url}`);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
      }
    });
  }

  try {
    // Initialize Supabase with service role key for admin operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          }
        }
      );
    }

    const { operation, data, table, id } = body;
    console.log(`[${requestId}] Operation: ${operation}, Table: ${table}`);

    let result;
    
    switch (operation) {
      case 'insert':
        console.log(`[${requestId}] Inserting data:`, data);
        result = await supabase
          .from(table)
          .insert(data)
          .select();
        break;
        
      case 'update':
        console.log(`[${requestId}] Updating ${table} with id: ${id}`);
        result = await supabase
          .from(table)
          .update(data)
          .eq('id', id)
          .select();
        break;
        
      case 'delete':
        console.log(`[${requestId}] Deleting from ${table} with id: ${id}`);
        result = await supabase
          .from(table)
          .delete()
          .eq('id', id);
        break;
        
      case 'select':
        console.log(`[${requestId}] Selecting from ${table}`);
        const query = supabase.from(table).select('*');
        
        // Apply filters if provided
        if (data?.filters) {
          for (const [column, value] of Object.entries(data.filters)) {
            query.eq(column, value);
          }
        }
        
        // Apply ordering if provided
        if (data?.orderBy) {
          query.order(data.orderBy.column, { ascending: data.orderBy.ascending });
        }
        
        result = await query;
        break;
        
      default:
        return new Response(
          JSON.stringify({ error: `Unknown operation: ${operation}` }),
          { 
            status: 400,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Content-Type': 'application/json'
            }
          }
        );
    }

    if (result.error) {
      console.error(`[${requestId}] Database error:`, result.error);
      return new Response(
        JSON.stringify({ 
          error: 'Database operation failed', 
          details: result.error.message 
        }),
        { 
          status: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          }
        }
      );
    }

    console.log(`[${requestId}] Operation successful`);
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: result.data,
        count: result.count 
      }),
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error(`[${requestId}] Unexpected error:`, error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        }
      }
    );
  }
});