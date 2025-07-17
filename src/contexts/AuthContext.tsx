import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  authError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Edge Function URL
const ADMIN_CHECK_URL = 'https://yvactofmmdiauewmkqnk.supabase.co/functions/v1/app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_check_admin';

// Helper function to check admin status with CORS handling and detailed logging
const checkAdminStatus = async (userId: string, accessToken: string): Promise<{isAdmin: boolean, error?: string}> => {
  try {
    console.log("Starting admin check for user:", userId);
    
    // STEP 1: Try direct DB query first (most reliable)
    try {
      console.log("Checking admin status via direct DB query");
      const { data: adminData, error: adminError } = await supabase
        .from('app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_admins')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (!adminError && adminData) {
        console.log("Admin found in DB:", adminData);
        return { isAdmin: true };
      }
      
      if (adminError) {
        console.warn("DB admin check failed:", adminError);
        // Continue to next method if this fails
      } else if (!adminData) {
        console.log("User not found in admins table, checking email domain as fallback");
        
        // Get user email as fallback
        const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
        
        if (!userError && userData && userData.user && userData.user.email) {
          // Check if email is from authorized domain (e.g. company email)
          // This is a fallback in case the admin table can't be accessed
          if (userData.user.email.endsWith('@lemonshopby.me') || 
              userData.user.email === 'lemonshop.co.th@gmail.com') {
            console.log("User has authorized email domain, granting admin access");
            return { isAdmin: true };
          }
        }
        
        // If we got here, user is definitely not admin
        return { isAdmin: false };
      }
    } catch (dbError) {
      console.warn("Error in DB admin check:", dbError);
      // Continue to next method
    }
    
    // STEP 2: Try Edge Function if DB query fails
    try {
      console.log("Attempting Edge Function admin check");
      const response = await fetch(ADMIN_CHECK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        },
        credentials: 'include',
      });
      
      console.log("Edge function response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`Edge function failed with status ${response.status}:`, errorText);
        throw new Error(`Edge function returned ${response.status}: ${errorText}`);
      }
      
      const adminData = await response.json();
      console.log("Edge function admin check result:", adminData);
      
      return { isAdmin: !!adminData.is_admin };
    } catch (edgeFnError) {
      console.warn("Edge Function admin check failed:", edgeFnError);
      
      // STEP 3: Final fallback - check using app_metadata
      try {
        console.log("Attempting fallback to user metadata");
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (!userError && userData && userData.user) {
          const role = userData.user.app_metadata?.role;
          console.log("User metadata role:", role);
          
          if (role === 'admin') {
            return { isAdmin: true };
          }
        }
      } catch (metadataError) {
        console.error("Metadata check failed:", metadataError);
      }
      
      // If we got here, all checks failed
      return { 
        isAdmin: false, 
        error: edgeFnError instanceof Error ? edgeFnError.message : "Unknown edge function error" 
      };
    }
  } catch (error) {
    console.error("All admin checks failed:", error);
    return { 
      isAdmin: false, 
      error: error instanceof Error ? error.message : "Unknown error checking admin status" 
    };
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      setIsLoading(true);
      
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error("Session error:", sessionError);
          setAuthError(`Session error: ${sessionError.message}`);
          setIsLoading(false);
          return;
        }
        
        if (session) {
          console.log("Initial session found, checking admin status");
          try {
            const { isAdmin: is_admin, error: adminCheckError } = await checkAdminStatus(
              session.user.id, 
              session.access_token
            );
            
            if (adminCheckError) {
              console.warn("Admin check warning:", adminCheckError);
              setAuthError(`Admin check warning: ${adminCheckError}`);
            }
            
            if (is_admin) {
              const newUser: User = {
                id: session.user.id,
                email: session.user.email || '',
                role: 'admin'
              };
              
              setUser(newUser);
              setIsAdmin(true);
              console.log('Initial user authenticated as admin:', newUser);
            } else {
              setUser(null);
              setIsAdmin(false);
              console.log('Initial user is not admin, logging out');
              await supabase.auth.signOut();
            }
          } catch (adminCheckError) {
            console.error('Error checking initial admin status:', adminCheckError);
            setAuthError(`Error checking admin status: ${adminCheckError instanceof Error ? adminCheckError.message : 'Unknown error'}`);
            setUser(null);
            setIsAdmin(false);
            await supabase.auth.signOut();
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setAuthError(`Error checking session: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
      
      // Set up auth state listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          if (session) {
            console.log("Auth state changed with session, checking admin");
            try {
              const { isAdmin: is_admin, error: adminCheckError } = await checkAdminStatus(
                session.user.id, 
                session.access_token
              );
              
              if (adminCheckError) {
                console.warn("Auth state change admin check warning:", adminCheckError);
                setAuthError(`Auth state change admin check warning: ${adminCheckError}`);
              }
              
              if (is_admin) {
                const newUser: User = {
                  id: session.user.id,
                  email: session.user.email || '',
                  role: 'admin'
                };
                
                setUser(newUser);
                setIsAdmin(true);
              } else {
                setUser(null);
                setIsAdmin(false);
                await supabase.auth.signOut();
              }
            } catch (error) {
              console.error('Error checking admin status on auth change:', error);
              setAuthError(`Error checking admin status on auth change: ${error instanceof Error ? error.message : 'Unknown error'}`);
              setUser(null);
              setIsAdmin(false);
              await supabase.auth.signOut();
            }
          } else {
            setUser(null);
            setIsAdmin(false);
          }
        }
      );
      
      return () => {
        subscription.unsubscribe();
      };
    };
    
    checkSession();
  }, []);
  
  const setUserFromSession = async (session: Session) => {
    const { user: supabaseUser } = session;
    
    if (supabaseUser) {
      try {
        console.log('Checking admin status for user:', supabaseUser.id);
        const { isAdmin: is_admin, error: adminCheckError } = await checkAdminStatus(
          supabaseUser.id, 
          session.access_token
        );
        
        if (adminCheckError) {
          console.warn("setUserFromSession admin check warning:", adminCheckError);
          setAuthError(`Set user admin check warning: ${adminCheckError}`);
        }
        
        const newUser: User = {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          role: is_admin ? 'admin' : 'user'
        };
        
        setUser(newUser);
        setIsAdmin(is_admin);
        console.log('User authenticated:', newUser, 'Admin status:', is_admin);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setAuthError(`Error checking admin status: ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        // Fallback to existing metadata
        const role = supabaseUser.app_metadata?.role;
        const newUser: User = {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          role: role
        };
        
        setUser(newUser);
        setIsAdmin(role === 'admin');
        console.log('Using fallback admin check, isAdmin:', role === 'admin');
      }
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('Attempting login for:', email);
      setAuthError(null);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Login error:', error.message);
        setAuthError(`Login error: ${error.message}`);
        return { success: false, error: error.message };
      }
      
      if (data.user) {
        console.log('Login successful for user:', data.user.email);
        
        try {
          // Temporary override for specific email
          if (email === 'lemonshop.co.th@gmail.com') {
            console.log("Admin access granted for lemonshop.co.th@gmail.com");
            
            const newUser: User = {
              id: data.user.id,
              email: data.user.email || '',
              role: 'admin'
            };
            
            setUser(newUser);
            setIsAdmin(true);
            return { success: true };
          }
          
          // Check admin status
          const { isAdmin: is_admin, error: adminCheckError } = await checkAdminStatus(
            data.user.id, 
            data.session.access_token
          );
          
          if (adminCheckError) {
            console.warn("Login admin check warning:", adminCheckError);
            setAuthError(`Login admin check warning: ${adminCheckError}`);
          }
          
          if (!is_admin) {
            console.error('User is not an admin');
            setAuthError("User is not an admin");
            await logout();
            return { success: false, error: 'คุณไม่มีสิทธิ์เข้าถึงระบบแอดมิน' };
          }
          
          // Set user and admin status
          const newUser: User = {
            id: data.user.id,
            email: data.user.email || '',
            role: is_admin ? 'admin' : 'user'
          };
          
          setUser(newUser);
          setIsAdmin(is_admin);
          console.log('User authenticated during login:', newUser, 'Admin status:', is_admin);
          
          return { success: true };
        } catch (adminCheckError) {
          console.error('Error checking admin status during login:', adminCheckError);
          setAuthError(`Error checking admin status during login: ${adminCheckError instanceof Error ? adminCheckError.message : 'Unknown error'}`);
          await logout();
          return { success: false, error: 'ไม่สามารถตรวจสอบสิทธิ์แอดมินได้' };
        }
      }
      
      return { success: false, error: 'การลงชื่อเข้าใช้ล้มเหลว' };
    } catch (error) {
      console.error('Login error:', error);
      setAuthError(`Login error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    setAuthError(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, isAdmin, authError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};