// Admin API functions using Edge Function for secure server-side operations
const ADMIN_FUNCTION_URL = 'https://yvactofmmdiauewmkqnk.supabase.co/functions/v1/app_284beb8f90_admin_operations';

interface AdminOperation {
  operation: 'insert' | 'update' | 'delete' | 'select';
  table: string;
  data?: any;
  id?: string;
}

export async function executeAdminOperation(params: AdminOperation) {
  try {
    const response = await fetch(ADMIN_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Admin operation failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    
    if (result.success) {
      return { data: result.data, error: null };
    } else {
      return { data: null, error: result.error || 'Unknown error' };
    }
  } catch (error) {
    console.error('Admin API Error:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Network error' 
    };
  }
}

// Specific admin functions
export const adminApi = {
  // Redemption Codes
  createRedemptionCode: (codeData: any) =>
    executeAdminOperation({
      operation: 'insert',
      table: 'app_284beb8f90_redemption_codes',
      data: codeData
    }),

  createRedemptionCodes: (codesData: any[]) =>
    executeAdminOperation({
      operation: 'insert',
      table: 'app_284beb8f90_redemption_codes',
      data: codesData
    }),

  updateRedemptionCode: (id: string, data: any) =>
    executeAdminOperation({
      operation: 'update',
      table: 'app_284beb8f90_redemption_codes',
      id,
      data
    }),

  deleteRedemptionCode: (id: string) =>
    executeAdminOperation({
      operation: 'delete',
      table: 'app_284beb8f90_redemption_codes',
      id
    }),

  // Chicken Accounts
  createChickenAccount: (accountData: any) =>
    executeAdminOperation({
      operation: 'insert',
      table: 'app_284beb8f90_chicken_accounts',
      data: accountData
    }),

  createChickenAccounts: (accountsData: any[]) =>
    executeAdminOperation({
      operation: 'insert',
      table: 'app_284beb8f90_chicken_accounts',
      data: accountsData
    }),

  updateChickenAccount: (id: string, data: any) =>
    executeAdminOperation({
      operation: 'update',
      table: 'app_284beb8f90_chicken_accounts',
      id,
      data
    }),

  deleteChickenAccount: (id: string) =>
    executeAdminOperation({
      operation: 'delete',
      table: 'app_284beb8f90_chicken_accounts',
      id
    }),

  // Rainbow Six Codes
  createRainbowCode: (codeData: any) =>
    executeAdminOperation({
      operation: 'insert',
      table: 'app_284beb8f90_rainbow_codes',
      data: codeData
    }),

  updateRainbowCode: (id: string, data: any) =>
    executeAdminOperation({
      operation: 'update',
      table: 'app_284beb8f90_rainbow_codes',
      id,
      data
    }),

  deleteRainbowCode: (id: string) =>
    executeAdminOperation({
      operation: 'delete',
      table: 'app_284beb8f90_rainbow_codes',
      id
    }),

  // Update request status
  updateRequestStatus: (table: string, id: string, status: string, additionalData?: any) =>
    executeAdminOperation({
      operation: 'update',
      table,
      id,
      data: {
        status,
        updated_at: new Date().toISOString(),
        ...additionalData
      }
    }),

  // Delete request
  deleteRequest: (id: string, requestType: string) => {
    const table = requestType === 'rainbow' 
      ? 'app_284beb8f90_rainbow_requests' 
      : 'app_284beb8f90_redemption_requests';
    
    return executeAdminOperation({
      operation: 'delete',
      table,
      id
    });
  },

  // Announcements
  createAnnouncement: (announcementData: any) =>
    executeAdminOperation({
      operation: 'insert',
      table: 'app_284beb8f90_announcements',
      data: announcementData
    }),

  updateAnnouncement: (id: string, data: any) =>
    executeAdminOperation({
      operation: 'update',
      table: 'app_284beb8f90_announcements',
      id,
      data
    }),

  deleteAnnouncement: (id: string) =>
    executeAdminOperation({
      operation: 'delete',
      table: 'app_284beb8f90_announcements',
      id
    }),

  getAnnouncements: (onlyActive = false, limit = 50) =>
    executeAdminOperation({
      operation: 'select',
      table: 'app_284beb8f90_announcements',
      data: {
        filters: onlyActive ? { is_active: true } : undefined,
        orderBy: { column: 'created_at', ascending: false },
        limit
      }
    })
};