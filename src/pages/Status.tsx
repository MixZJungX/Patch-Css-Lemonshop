import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { RedemptionRequest } from "@/types";
import "@/styles/notifications.css";

export default function Status() {
  const [requestId, setRequestId] = useState("");
  const [robloxUsername, setRobloxUsername] = useState("");
  const [activeTab, setActiveTab] = useState("id");
  const [error, setError] = useState<string | null>(null);
  const [request, setRequest] = useState<RedemptionRequest | null>(null);
  const [recentRequests, setRecentRequests] = useState<RedemptionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [publicRequests, setPublicRequests] = useState<RedemptionRequest[]>([]);
  
  useEffect(() => {
    // Fetch recent public requests on component mount
    fetchPublicRequests();
  }, []);
  
  const fetchPublicRequests = async () => {
    try {
      // First fetch the redemption requests
      const { data, error } = await supabase
        .from("app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_redemption_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
        
      if (error) {
        console.error("Error fetching public requests:", error);
        return;
      }
      
      if (!data || data.length === 0) {
        setPublicRequests([]);
        return;
      }
      
      // Get all codes from the requests
      const codes = data.map(item => item.code);
      
      // Fetch the code values
      const { data: codeValues, error: codeError } = await supabase
        .from("app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_redemption_codes")
        .select("code, value")
        .in("code", codes);
        
      if (codeError) {
        console.error("Error fetching code values:", codeError);
      } else if (codeValues) {
        // Create a map of code to value
        const valuesMap: Record<string, number> = {};
        codeValues.forEach(item => {
          valuesMap[item.code] = item.value;
        });
        
        // Add the robux_value to each request
        const requestsWithValues = data.map(req => ({
          ...req,
          robux_value: valuesMap[req.code] || null
        }));
        
        setPublicRequests(requestsWithValues);
      } else {
        setPublicRequests(data);
      }
    } catch (error) {
      console.error("Error in fetchPublicRequests:", error);
    }
  };

  const fetchByRequestId = async () => {
    if (!requestId.trim()) {
      setError("กรุณากรอกหมายเลขคำขอ");
      return;
    }

    setError(null);
    setRequest(null);
    setIsLoading(true);

    try {
      // Get the redemption request
      const { data, error } = await supabase
        .from("app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_redemption_requests")
        .select("*")
        .eq("id", requestId.trim())
        .single();

      if (error || !data) {
        setError("ไม่พบคำขอที่ตรงกับหมายเลขที่ระบุ");
        return;
      }
      
      // Get the code value
      const { data: codeData, error: codeError } = await supabase
        .from("app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_redemption_codes")
        .select("value")
        .eq("code", data.code)
        .single();
        
      if (!codeError && codeData) {
        // Add the Robux value to the request data
        setRequest({
          ...data,
          robux_value: codeData.value
        });
      } else {
        setRequest(data);
      }
    } catch (error) {
      console.error("Error fetching by ID:", error);
      setError("เกิดข้อผิดพลาดในการค้นหา");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchByUsername = async () => {
    if (!robloxUsername.trim()) {
      setError("กรุณากรอกชื่อผู้ใช้ Roblox");
      return;
    }

    setError(null);
    setRecentRequests([]);
    setIsLoading(true);

    try {
      // Fetch requests by username
      const { data, error } = await supabase
        .from("app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_redemption_requests")
        .select("*")
        .eq("roblox_username", robloxUsername.trim())
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching by username:", error);
        setError("เกิดข้อผิดพลาดในการค้นหา");
        return;
      }
      
      if (!data || data.length === 0) {
        setError("ไม่พบคำขอที่ตรงกับชื่อผู้ใช้ Roblox ที่ระบุ");
        return;
      }
      
      // Get all codes from the requests
      const codes = data.map(item => item.code);
      
      // Fetch the code values
      const { data: codeValues, error: codeError } = await supabase
        .from("app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_redemption_codes")
        .select("code, value")
        .in("code", codes);
        
      if (codeError) {
        console.error("Error fetching code values:", codeError);
        setRecentRequests(data);
      } else if (codeValues) {
        // Create a map of code to value
        const valuesMap: Record<string, number> = {};
        codeValues.forEach(item => {
          valuesMap[item.code] = item.value;
        });
        
        // Add the robux_value to each request
        const requestsWithValues = data.map(req => ({
          ...req,
          robux_value: valuesMap[req.code] || null
        }));
        
        setRecentRequests(requestsWithValues);
      } else {
        setRecentRequests(data);
      }
    } catch (error) {
      console.error("Error fetching by username:", error);
      setError("เกิดข้อผิดพลาดในการค้นหา");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    if (activeTab === "id") {
      fetchByRequestId();
    } else {
      fetchByUsername();
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "รอดำเนินการ";
      case "processing":
        return "กำลังดำเนินการ";
      case "completed":
        return "เสร็จสิ้น";
      case "rejected":
        return "ปฏิเสธ";
      default:
        return status;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">รอดำเนินการ</Badge>;
      case "processing":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">กำลังดำเนินการ</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">เสร็จสิ้น</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">ปฏิเสธ</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
      {/* Removed notification component from Status page */}
      
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-center">ตรวจสอบสถานะคำขอ</CardTitle>
          <CardDescription className="text-center">
            คุณสามารถตรวจสอบสถานะของคำขอแลกรับ Robux ของคุณได้ที่นี่
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="id">ค้นหาด้วยหมายเลขคำขอ</TabsTrigger>
              <TabsTrigger value="username">ค้นหาด้วยชื่อผู้ใช้ Roblox</TabsTrigger>
            </TabsList>

            <TabsContent value="id" className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="กรอกหมายเลขคำขอของคุณ"
                  value={requestId}
                  onChange={(e) => setRequestId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchByRequestId()}
                />
                <Button 
                  onClick={fetchByRequestId}
                  disabled={isLoading}
                >
                  {isLoading ? "กำลังค้นหา..." : "ค้นหา"}
                </Button>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {request && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">รายละเอียดคำขอ</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="divide-y">
                      <div className="grid grid-cols-1 sm:grid-cols-3 py-2">
                        <dt className="font-medium text-gray-500">หมายเลขคำขอ:</dt>
                        <dd className="col-span-1 sm:col-span-2 font-mono text-xs sm:text-sm break-all">{request.id}</dd>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 py-2">
                        <dt className="font-medium text-gray-500">โค้ด:</dt>
                        <dd className="col-span-1 sm:col-span-2 font-mono">{request.code}</dd>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 py-2">
                        <dt className="font-medium text-gray-500">จำนวน Robux:</dt>
                        <dd className="col-span-1 sm:col-span-2">{request.robux_value || "N/A"} Robux</dd>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 py-2">
                        <dt className="font-medium text-gray-500">ชื่อผู้ใช้ Roblox:</dt>
                        <dd className="col-span-1 sm:col-span-2">{request.roblox_username}</dd>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 py-2">
                        <dt className="font-medium text-gray-500">สถานะ:</dt>
                        <dd className="col-span-1 sm:col-span-2">{getStatusBadge(request.status)}</dd>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 py-2">
                        <dt className="font-medium text-gray-500">วันที่ส่งคำขอ:</dt>
                        <dd className="col-span-1 sm:col-span-2">
                          {new Date(request.created_at).toLocaleDateString("th-TH", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </dd>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 py-2">
                        <dt className="font-medium text-gray-500">อัปเดตล่าสุด:</dt>
                        <dd className="col-span-1 sm:col-span-2">
                          {new Date(request.updated_at).toLocaleDateString("th-TH", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="username" className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="กรอกชื่อผู้ใช้ Roblox ของคุณ"
                  value={robloxUsername}
                  onChange={(e) => setRobloxUsername(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchByUsername()}
                />
                <Button 
                  onClick={fetchByUsername}
                  disabled={isLoading}
                >
                  {isLoading ? "กำลังค้นหา..." : "ค้นหา"}
                </Button>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {recentRequests.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-3">คำขอล่าสุดของ {robloxUsername}</h3>
                  <div className="border rounded-md overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">โค้ด</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Robux</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {recentRequests.map((req) => (
                          <tr key={req.id}>
                            <td className="px-2 py-2 text-sm text-gray-500 whitespace-nowrap">
                              {new Date(req.created_at).toLocaleDateString("th-TH")}
                            </td>
                            <td className="px-2 py-2 font-mono text-xs sm:text-sm">
                              {req.code}
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap">
                              {req.robux_value || "N/A"}
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap">
                              {getStatusBadge(req.status)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="link" asChild>
            <Link to="/">กลับไปหน้าแรก</Link>
          </Button>
        </CardFooter>
      </Card>

      <div className="mt-8 w-full max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">คำขอล่าสุดในระบบ</CardTitle>
          </CardHeader>
          <CardContent>
            {publicRequests.length > 0 ? (
              <div className="border rounded-md overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อผู้ใช้</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Robux</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {publicRequests.map((req) => (
                      <tr key={req.id}>
                        <td className="px-2 py-2 text-sm text-gray-500 whitespace-nowrap">
                          {new Date(req.created_at).toLocaleDateString("th-TH")}
                        </td>
                        <td className="px-2 py-2 text-xs sm:text-sm">
                          {req.roblox_username}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          {req.robux_value || "N/A"}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          {getStatusBadge(req.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">ไม่มีคำขอล่าสุดในระบบ</div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8 w-full max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">ขั้นตอนการแลกรับ Robux</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3">
              <div className="bg-blue-100 text-blue-800 rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0">1</div>
              <div>
                <p>กรอกข้อมูลและส่งคำขอแลกรับ Robux ที่หน้าแรก</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="bg-blue-100 text-blue-800 rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0">2</div>
              <div>
                <p>ระบบจะส่งคำขอของคุณไปยังทีมแอดมิน</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="bg-blue-100 text-blue-800 rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0">3</div>
              <div>
                <p>แอดมินจะดำเนินการเติม Robux ให้คุณผ่านรหัส ID และรหัสผ่าน</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="bg-blue-100 text-blue-800 rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0">4</div>
              <div>
                <p>เมื่อดำเนินการเสร็จสิ้น สถานะคำขอจะเปลี่ยนเป็น "เสร็จสิ้น"</p>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              <p>หากมีข้อสงสัยหรือต้องการสอบถามเพิ่มเติม กรุณาติดต่อทีมแอดมินผ่านช่องทางที่ระบุในคำขอของคุณ</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}