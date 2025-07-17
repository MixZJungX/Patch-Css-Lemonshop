import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from 'uuid';
import { Badge } from "@/components/ui/badge";
import { RedemptionRequest } from "@/types";
import { RedemptionNotifications } from "@/components/RedemptionNotifications";
import "@/styles/notifications.css";

export default function Home() {
  const [step, setStep] = useState<'code' | 'details'>('code');
  const [code, setCode] = useState("");
  const [robloxUsername, setRobloxUsername] = useState("");
  const [robloxPassword, setRobloxPassword] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugError, setDebugError] = useState<string | null>(null); // For detailed error debugging
  const [success, setSuccess] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [codeValue, setCodeValue] = useState(0);
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [recentRedemptions, setRecentRedemptions] = useState<RedemptionRequest[]>([]);
  const [totalRedemptionsCount, setTotalRedemptionsCount] = useState(0);

  // Enable debug mode with query param ?debug=true
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const debug = urlParams.get('debug');
    setIsDebugMode(debug === 'true');

    // Fetch recent redemptions
    fetchRecentRedemptions();
    fetchTotalRedemptionsCount();
  }, []);

  const fetchRecentRedemptions = async () => {
    try {
      const { data, error } = await supabase
        .from("app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_redemption_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
        
      if (error) {
        console.error("Error fetching recent redemptions:", error);
      } else {
        setRecentRedemptions(data || []);
      }
    } catch (error) {
      console.error("Error in fetchRecentRedemptions:", error);
    }
  };

  const fetchTotalRedemptionsCount = async () => {
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
        setTotalRedemptionsCount(0);
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
      setTotalRedemptionsCount(totalValue);
    } catch (error) {
      console.error("Error in fetchTotalRedemptionsCount:", error);
    }
  };

  const validateCodeStep = async () => {
    setError(null);
    setDebugError(null);
    
    if (!code) {
      setError("กรุณากรอกโค้ด Robux");
      return false;
    }
    
    setIsLoading(true);
    
    try {
      console.log("Checking code:", code);
      
      // Check if code exists and is not used
      const { data, error: codeError } = await supabase
        .from("app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_redemption_codes")
        .select("*")
        .eq("code", code)
        .single();
      
      if (codeError) {
        console.error("Code error:", codeError);
        setDebugError(`Code check error: ${codeError.message || JSON.stringify(codeError)}`);
        setError("ไม่พบโค้ดหรือโค้ดไม่ถูกต้อง");
        setIsLoading(false);
        return false;
      }
      
      if (!data) {
        console.error("No code data found");
        setDebugError("No code data returned from database");
        setError("ไม่พบโค้ดหรือโค้ดไม่ถูกต้อง");
        setIsLoading(false);
        return false;
      }
      
      console.log("Code found:", data);
      
      if (data.is_used) {
        setError("โค้ดนี้ถูกใช้งานไปแล้ว");
        setIsLoading(false);
        return false;
      }
      
      // Store code value for display in details step
      setCodeValue(data.value);
      console.log("Code value set:", data.value);
      
      // Proceed to next step
      setStep('details');
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("Error validating code:", error);
      setDebugError(`Validation error: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
      setError("เกิดข้อผิดพลาดในการตรวจสอบโค้ด กรุณาลองใหม่อีกครั้ง");
      setIsLoading(false);
      return false;
    }
  };

  const validateDetailsStep = () => {
    setError(null);
    setDebugError(null);
    
    if (!robloxUsername) {
      setError("กรุณากรอกชื่อผู้ใช้ Roblox");
      return false;
    }
    
    if (!contactInfo) {
      setError("กรุณากรอกช่องทางติดต่อ");
      return false;
    }
    
    return true;
  };

  const handleSubmitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    await validateCodeStep();
  };

  const handleSubmitDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateDetailsStep()) return;
    
    setIsLoading(true);
    setError(null);
    setDebugError(null);
    
    try {
      // Generate a unique ID for this request
      const id = uuidv4();
      console.log("Generated request ID:", id);
      
      // Store password temporarily but don't send to database
      const passwordForVerification = robloxPassword;
      console.log("Password received for verification (will not be stored)");
      
      // Prepare request data - Note: password is NOT included here
      const requestData = {
        id,
        code,
        roblox_username: robloxUsername,
        contact_info: contactInfo,
        phone: phone || null,
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log("Creating redemption request with data:", {...requestData, password: "[REDACTED]"});
      
      // USING DIRECT DB ACCESS - Try to insert the redemption request
      try {
        console.log("Inserting redemption request via Supabase client");
        
        // First, check if the code exists in the redemption_codes table
        const { data: codeData, error: codeCheckError } = await supabase
          .from("app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_redemption_codes")
          .select("*")
          .eq("code", code)
          .single();
          
        if (codeCheckError || !codeData) {
          console.error("Error finding code in redemption_codes table:", codeCheckError);
          setDebugError(`Code not found in redemption_codes table. Error: ${codeCheckError?.message || "No data returned"}`);
          throw new Error("Code not found in our database. Please try again.");
        }
        
        // Insert the redemption request with verified code
        const { data, error: insertError } = await supabase
          .from("app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_redemption_requests")
          .insert(requestData)
          .select();
        
        if (insertError) {
          console.error("Error submitting request:", insertError);
          setDebugError(`Insert error: ${insertError.message || JSON.stringify(insertError)}`);
          throw insertError;
        }
        
        console.log("Redemption request created:", data);
        
        // Set code as used
        console.log("Marking code as used:", code);
        const { data: updateData, error: updateError } = await supabase
          .from("app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_redemption_codes")
          .update({ is_used: true })
          .eq("code", code)
          .select();
        
        if (updateError) {
          console.error("Error marking code as used:", updateError);
          setDebugError(`Update error: ${updateError.message || JSON.stringify(updateError)}`);
          // Continue anyway since the request was created
        } else {
          console.log("Code marked as used:", updateData);
        }
      } catch (dbError) {
        console.error("Database error:", dbError);
        setDebugError(`Database error: ${dbError instanceof Error ? dbError.message : JSON.stringify(dbError)}`);
        throw dbError;
      }
      
      // Show success
      setSuccess(true);
      setRequestId(id);

      // Refresh the recent redemptions list
      fetchRecentRedemptions();
      
      // Reset form
      setCode("");
      setRobloxUsername("");
      setRobloxPassword("");
      setContactInfo("");
      setPhone("");
    } catch (error) {
      console.error("Error in form submission:", error);
      setDebugError(`Submission error: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
      setError("เกิดข้อผิดพลาดในการส่งคำขอ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setStep('code');
    setCode("");
    setRobloxUsername("");
    setRobloxPassword("");
    setContactInfo("");
    setPhone("");
    setSuccess(false);
    setRequestId(null);
    setError(null);
    setDebugError(null);
  };

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      {/* Add the floating notification component */}
      <RedemptionNotifications />
      
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-3xl font-extrabold text-gray-900">
            ระบบแลกรับ Robux
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            กรอกข้อมูลด้านล่างเพื่อแลกโค้ด Robux ของคุณ
          </p>
        </div>

        {/* Display total Robux count */}
        <div className="text-center">
          <span className="bg-blue-100 text-blue-800 font-medium text-xs px-2.5 py-0.5 rounded-full">
            มูลค่าของโรบัคทั้งหมด: {totalRedemptionsCount}
          </span>
        </div>

        {success ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
                </div>
                <CardTitle className="text-xl font-semibold">ส่งคำขอสำเร็จ!</CardTitle>
                <p className="text-gray-500">
                  คำขอของคุณได้รับการบันทึกแล้ว โปรดจดจำหมายเลขคำขอนี้:
                </p>
                <div className="bg-gray-50 border border-gray-200 rounded p-3">
                  <p className="font-mono font-bold text-lg break-all">{requestId}</p>
                </div>
                <p className="text-gray-500">
                  คุณสามารถตรวจสอบสถานะคำขอของคุณได้ที่หน้า{" "}
                  <Link to="/status" className="text-blue-600 hover:underline">
                    ตรวจสอบสถานะ
                  </Link>
                </p>
              </div>
            </CardContent>
            <CardFooter className="justify-center">
              <Button onClick={resetForm} variant="outline">
                ส่งคำขอใหม่
              </Button>
            </CardFooter>
          </Card>
        ) : step === 'code' ? (
          <Card>
            <form onSubmit={handleSubmitCode}>
              <CardHeader>
                <CardTitle>กรอกโค้ด Robux</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                {isDebugMode && debugError && (
                  <Alert variant="destructive" className="bg-yellow-50 border-yellow-200 text-yellow-800">
                    <AlertDescription className="font-mono text-xs break-all">{debugError}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="code">โค้ด Robux</Label>
                  <Input
                    id="code"
                    placeholder="กรอกโค้ดของคุณ"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-4">
                <Button className="w-full" type="submit" disabled={isLoading}>
                  {isLoading ? "กำลังตรวจสอบ..." : "ตรวจสอบโค้ด"}
                </Button>
                <div className="text-center text-sm flex flex-col space-y-2">
                  <Link to="/status" className="text-blue-600 hover:underline">
                    ตรวจสอบสถานะคำขอ
                  </Link>
                  <Link to="/chicken" className="text-blue-600 hover:underline">
                    แลกรับบัญชีไก่ตัน
                  </Link>
                </div>
              </CardFooter>
            </form>
          </Card>
        ) : (
          <Card>
            <form onSubmit={handleSubmitDetails}>
              <CardHeader>
                <CardTitle>กรอกข้อมูลรับ Robux</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                {isDebugMode && debugError && (
                  <Alert variant="destructive" className="bg-yellow-50 border-yellow-200 text-yellow-800">
                    <AlertDescription className="font-mono text-xs break-all">{debugError}</AlertDescription>
                  </Alert>
                )}
                
                <div className="bg-green-50 border border-green-200 rounded p-3 text-center">
                  <p className="text-sm text-green-800">โค้ดมูลค่า <span className="font-bold">{codeValue}</span> Robux</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="robloxUsername">ชื่อผู้ใช้ Roblox</Label>
                  <Input
                    id="robloxUsername"
                    placeholder="กรอกชื่อผู้ใช้ Roblox ของคุณ"
                    value={robloxUsername}
                    onChange={(e) => setRobloxUsername(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="robloxPassword">รหัสผ่าน Roblox</Label>
                  <Input
                    id="robloxPassword"
                    type="password"
                    placeholder="กรอกรหัสผ่าน Roblox ของคุณ"
                    value={robloxPassword}
                    onChange={(e) => setRobloxPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-gray-500">*รหัสผ่านของคุณจะไม่ถูกบันทึกเก็บไว้ในระบบ</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactInfo">ช่องทางติดต่อ (Facebook, Line)</Label>
                  <Input
                    id="contactInfo"
                    placeholder="กรอกช่องทางติดต่อของคุณ"
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">เบอร์โทรศัพท์ (ไม่บังคับ)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="กรอกเบอร์โทรศัพท์ของคุณ (ถ้ามี)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-4">
                <Button className="w-full" type="submit" disabled={isLoading}>
                  {isLoading ? "กำลังส่งคำขอ..." : "ส่งคำขอ"}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  type="button" 
                  onClick={() => setStep('code')}
                  disabled={isLoading}
                >
                  ย้อนกลับ
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}
        
        {/* Debug mode indicator */}
        {isDebugMode && (
          <div className="text-center text-xs text-gray-500 mt-4">
            Debug Mode Active
          </div>
        )}
      </div>

      {/* We've replaced the static redemptions section with the floating notifications */}
    </div>
  );
}