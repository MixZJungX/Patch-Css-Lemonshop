import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RedemptionRequest } from "@/types";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from 'uuid';
import { BulkImportModal } from "@/components/BulkImportModal";

import { ChickenAccountsManager } from "@/components/ChickenAccountsManager";
import { Plus, FileUp, Trash2 } from "lucide-react";
import "@/styles/notifications.css";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Admin() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  
  const [codes, setCodes] = useState<RedeemCode[]>([]);
  const [requests, setRequests] = useState<RedemptionRequest[]>([]);
  const [activeTab, setActiveTab] = useState("codes");
  
  // Form states for adding new code
  const [newCode, setNewCode] = useState("");
  const [newValue, setNewValue] = useState("");
  const [isAddingCode, setIsAddingCode] = useState(false);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Bulk import modal state
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  
  // Total redemptions count
  const [totalRedemptions, setTotalRedemptions] = useState(0);

  useEffect(() => {
    if (!user || !isAdmin) {
      navigate("/login");
      return;
    }
    
    // Fetch data on component mount
    fetchCodes();
    fetchRequests();
    fetchTotalRedemptions();
  }, [user, isAdmin, navigate]);
  
  const fetchCodes = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_redemption_codes")
        .select("*")
        .order("created_at", { ascending: false });
        
      if (error) {
        console.error("Error fetching codes:", error);
      } else {
        setCodes(data || []);
      }
    } catch (error) {
      console.error("Error in fetchCodes:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_redemption_requests")
        .select("*")
        .order("created_at", { ascending: false });
        
      if (error) {
        console.error("Error fetching requests:", error);
      } else {
        setRequests(data || []);
      }
    } catch (error) {
      console.error("Error in fetchRequests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTotalRedemptions = async () => {
    try {
      // Get all completed redemption requests with their codes
      const { data, error } = await supabase
        .from("app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_redemption_requests")
        .select('code')
        .eq("status", "completed");
        
      if (error) {
        console.error("Error fetching completed redemptions:", error);
        return;
      }
      
      if (!data || data.length === 0) {
        setTotalRedemptions(0);
        return;
      }
      
      // Extract all codes from completed redemptions
      const codes = data.map(item => item.code);
      
      // Get the value of each code from the codes table
      const { data: codeValues, error: codeError } = await supabase
        .from("app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_redemption_codes")
        .select('code, value')
        .in('code', codes);
        
      if (codeError) {
        console.error("Error fetching code values:", codeError);
        return;
      }
      
      // Calculate the total value of all redeemed codes
      const totalValue = codeValues.reduce((sum, code) => sum + (code.value || 0), 0);
      setTotalRedemptions(totalValue);
    } catch (error) {
      console.error("Error in fetchTotalRedemptions:", error);
    }
  };
  
  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };
  
  const addNewCode = async () => {
    if (!newCode || !newValue || isNaN(Number(newValue))) {
      alert("กรุณากรอกโค้ดและมูลค่าให้ถูกต้อง");
      return;
    }
    
    setIsAddingCode(true);
    
    try {
      const id = uuidv4();
      console.log("Getting session to retrieve token");
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error("No active session found");
        alert("กรุณาเข้าสู่ระบบใหม่อีกครั้ง");
        handleLogout();
        return;
      }
      
      console.log("Calling edge function to add code");
      const response = await fetch('https://yvactofmmdiauewmkqnk.supabase.co/functions/v1/app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_add_code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          id,
          code: newCode,
          value: Number(newValue)
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        console.error("Error response from edge function:", result);
        if (result.code === '23505' || (result.error && result.error.includes('already exists'))) {
          alert("โค้ดนี้มีอยู่แล้วในระบบ");
        } else {
          alert("เกิดข้อผิดพลาดในการเพิ่มโค้ด: " + (result.error || 'ไม่สามารถเพิ่มโค้ดได้'));
        }
        return;
      }
      
      console.log("Code added successfully:", result);
      // Reset form and refresh codes
      setNewCode("");
      setNewValue("");
      fetchCodes();
      
    } catch (error) {
      console.error("Error in addNewCode:", error);
      alert("เกิดข้อผิดพลาดในการเพิ่มโค้ด: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsAddingCode(false);
    }
  };
  
  const updateRequestStatus = async (requestId: string, newStatus: 'pending' | 'processing' | 'completed' | 'rejected') => {
    setIsUpdating(true);
    
    try {
      const { error } = await supabase
        .from("app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_redemption_requests")
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", requestId);
        
      if (error) {
        console.error("Error updating request status:", error);
        alert("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
      } else {
        // Refresh requests
        fetchRequests();
        // If status is completed, update the total redemptions count
        if (newStatus === 'completed') {
          fetchTotalRedemptions();
        }
      }
    } catch (error) {
      console.error("Error in updateRequestStatus:", error);
      alert("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteRequest = async (requestId: string) => {
    setIsDeleting(true);
    
    try {
      const { error } = await supabase
        .from("app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_redemption_requests")
        .delete()
        .eq("id", requestId);
        
      if (error) {
        console.error("Error deleting request:", error);
        alert("เกิดข้อผิดพลาดในการลบคำขอ");
      } else {
        // Refresh requests
        fetchRequests();
      }
    } catch (error) {
      console.error("Error in deleteRequest:", error);
      alert("เกิดข้อผิดพลาดในการลบคำขอ");
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Filtered requests based on status and search term
  const filteredRequests = requests.filter(request => {
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesSearch = 
      request.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.roblox_username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.contact_info.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (request.phone && request.phone.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesStatus && matchesSearch;
  });
  
  // Stats for dashboard
  const totalCodes = codes.length;
  const usedCodes = codes.filter(code => code.is_used).length;
  const pendingRequests = requests.filter(req => req.status === 'pending').length;
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">รอดำเนินการ</Badge>;
      case 'processing':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">กำลังดำเนินการ</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">เสร็จสิ้น</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">ปฏิเสธ</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Removed notification component from Admin page */}
      
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold">แดชบอร์ดผู้ดูแลระบบ</h1>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/change-password")}
            >
              เปลี่ยนรหัสผ่าน
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              ออกจากระบบ
            </Button>
          </div>
        </div>
      </header>
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{totalCodes}</div>
              <p className="text-muted-foreground text-sm">โค้ดทั้งหมด</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{usedCodes}</div>
              <p className="text-muted-foreground text-sm">โค้ดที่ใช้แล้ว</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{pendingRequests}</div>
              <p className="text-muted-foreground text-sm">คำขอที่รอดำเนินการ</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{totalRedemptions}</div>
              <p className="text-muted-foreground text-sm">มูลค่าของโรบัค</p>
            </CardContent>
          </Card>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="codes">โค้ด Robux</TabsTrigger>
            <TabsTrigger value="requests">คำขอแลกรับ</TabsTrigger>
            <TabsTrigger value="chicken">บัญชีไก่ตัน</TabsTrigger>
          </TabsList>
          
          {/* Codes Tab */}
          <TabsContent value="codes" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                  <div>
                    <CardTitle>จัดการโค้ด</CardTitle>
                    <CardDescription>เพิ่มโค้ด Robux ใหม่เข้าระบบ</CardDescription>
                  </div>
                  <Button 
                    className="mt-2 sm:mt-0"
                    variant="outline" 
                    onClick={() => setIsBulkImportOpen(true)}
                  >
                    <FileUp className="h-4 w-4 mr-2" />
                    นำเข้าโค้ดแบบหลายรายการ
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Label htmlFor="new-code">โค้ด</Label>
                    <Input
                      id="new-code"
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value)}
                      placeholder="กรอกโค้ดใหม่"
                      className="mt-1"
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="new-value">มูลค่า (จำนวน Robux)</Label>
                    <Input
                      id="new-value"
                      type="number"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      placeholder="กรอกมูลค่า"
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={addNewCode} 
                  disabled={isAddingCode}
                >
                  {isAddingCode ? "กำลังเพิ่ม..." : "เพิ่มโค้ด"}
                  {!isAddingCode && <Plus className="ml-2 h-4 w-4" />}
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>โค้ดทั้งหมด ({codes.length})</CardTitle>
                <CardDescription>รายการโค้ด Robux ทั้งหมดในระบบ</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-4">กำลังโหลด...</div>
                ) : codes.length > 0 ? (
                  <div className="border rounded-md">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2 font-medium">โค้ด</th>
                          <th className="text-left p-2 font-medium">มูลค่า</th>
                          <th className="text-left p-2 font-medium">สถานะ</th>
                          <th className="text-left p-2 font-medium">วันที่สร้าง</th>
                        </tr>
                      </thead>
                      <tbody>
                        {codes.map((code) => (
                          <tr key={code.id} className="border-b">
                            <td className="p-2 font-mono">{code.code}</td>
                            <td className="p-2">{code.value} Robux</td>
                            <td className="p-2">
                              {code.is_used ? (
                                <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">ใช้แล้ว</Badge>
                              ) : (
                                <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">ยังไม่ใช้</Badge>
                              )}
                            </td>
                            <td className="p-2 text-sm text-gray-500">
                              {new Date(code.created_at).toLocaleDateString('th-TH')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">ไม่พบโค้ดในระบบ</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Requests Tab */}
          <TabsContent value="requests" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap justify-between items-center gap-4">
                  <div>
                    <CardTitle>คำขอแลกรับทั้งหมด ({requests.length})</CardTitle>
                    <CardDescription>จัดการคำขอแลกโค้ด Robux</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="กรองตามสถานะ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">ทุกสถานะ</SelectItem>
                        <SelectItem value="pending">รอดำเนินการ</SelectItem>
                        <SelectItem value="processing">กำลังดำเนินการ</SelectItem>
                        <SelectItem value="completed">เสร็จสิ้น</SelectItem>
                        <SelectItem value="rejected">ปฏิเสธ</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="ค้นหา..."
                      className="max-w-xs"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-4">กำลังโหลด...</div>
                ) : filteredRequests.length > 0 ? (
                  <div className="border rounded-md">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2 font-medium">วันที่</th>
                          <th className="text-left p-2 font-medium">โค้ด</th>
                          <th className="text-left p-2 font-medium">ชื่อ Roblox</th>
                          <th className="text-left p-2 font-medium">ติดต่อ</th>
                          <th className="text-left p-2 font-medium">สถานะ</th>
                          <th className="text-left p-2 font-medium">การจัดการ</th>
                          <th className="text-left p-2 font-medium">ลบ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRequests.map((request) => (
                          <tr key={request.id} className="border-b">
                            <td className="p-2 whitespace-nowrap text-sm text-gray-500">
                              {new Date(request.created_at).toLocaleDateString('th-TH')}
                            </td>
                            <td className="p-2 font-mono">{request.code}</td>
                            <td className="p-2">{request.roblox_username}</td>
                            <td className="p-2">
                              <div>{request.contact_info}</div>
                              {request.phone && <div className="text-sm text-gray-500">{request.phone}</div>}
                            </td>
                            <td className="p-2">
                              {getStatusBadge(request.status)}
                            </td>
                            <td className="p-2">
                              <Select
                                value={request.status}
                                disabled={isUpdating}
                                onValueChange={(value) => updateRequestStatus(
                                  request.id, 
                                  value as 'pending' | 'processing' | 'completed' | 'rejected'
                                )}
                              >
                                <SelectTrigger className="w-[140px]">
                                  <SelectValue placeholder="เปลี่ยนสถานะ" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">รอดำเนินการ</SelectItem>
                                  <SelectItem value="processing">กำลังดำเนินการ</SelectItem>
                                  <SelectItem value="completed">เสร็จสิ้น</SelectItem>
                                  <SelectItem value="rejected">ปฏิเสธ</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="p-2">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-red-600 hover:bg-red-50">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>คุณแน่ใจหรือไม่?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      การลบคำขอนี้จะเป็นการลบอย่างถาวรและไม่สามารถกู้คืนได้
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                                    <AlertDialogAction 
                                      className="bg-red-600 text-white hover:bg-red-700" 
                                      onClick={() => deleteRequest(request.id)}
                                      disabled={isDeleting}
                                    >
                                      {isDeleting ? "กำลังลบ..." : "ลบ"}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    {requests.length > 0 
                      ? "ไม่พบคำขอที่ตรงกับเงื่อนไขการค้นหา" 
                      : "ยังไม่มีคำขอแลกรับในระบบ"}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Chicken Accounts Tab */}
          <TabsContent value="chicken" className="space-y-4">
            <ChickenAccountsManager />
          </TabsContent>
          

          

        </Tabs>
      </main>

      {/* Bulk Import Modal */}
      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        onSuccess={fetchCodes}
      />
    </div>
  );
}