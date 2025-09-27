import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Gift, ArrowLeft, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function RedeemPage() {
  const [redeemCode, setRedeemCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showCodeDialog, setShowCodeDialog] = useState(false);
  const [accountInfo, setAccountInfo] = useState<{
    username: string;
    password: string;
  } | null>(null);
  
  // Line QR Code popup
  const [showLineQRPopup, setShowLineQRPopup] = useState(false);

  const handleRedeemCode = async () => {
    if (!redeemCode.trim()) {
      setError("กรุณากรอกโค้ดแลกรับ");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      // First check if the code exists and is not used
      const { data: codeData, error: fetchError } = await supabase
        .from("app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_redeem_codes")
        .select("*")
        .eq("code", redeemCode)
        .eq("is_used", false)
        .single();

      if (fetchError) {
        if (fetchError.code === "PGRST116") {
          setError("โค้ดไม่ถูกต้องหรือถูกใช้งานไปแล้ว");
        } else {
          throw fetchError;
        }
        return;
      }

      // Get current user information
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError("กรุณาเข้าสู่ระบบก่อนใช้โค้ดแลกรับ");
        return;
      }

      // Mark the code as used
      const { error: updateError } = await supabase
        .from("app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_redeem_codes")
        .update({
          is_used: true,
          used_by: user.id,
          used_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", codeData.id);

      if (updateError) {
        throw updateError;
      }

      // Set success and account info for popup
      setAccountInfo({
        username: codeData.username,
        password: codeData.password
      });
      
      setSuccess(true);
      setShowCodeDialog(true);
      setRedeemCode("");
      
    } catch (error) {
      console.error("Error redeeming code:", error);
      setError("ไม่สามารถแลกรับโค้ดได้ โปรดลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-2 md:p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%224%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
      
      <div className="max-w-md mx-auto space-y-4 md:space-y-6 px-4 relative z-10">
        {/* Header */}
        <div className="text-center space-y-3 md:space-y-4 pt-4 md:pt-6">
          <div className="flex justify-center mb-3 md:mb-4">
            <div className="w-10 h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center shadow-2xl">
              <Gift className="w-5 h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 bg-clip-text text-transparent leading-tight">
            แลกรับโค้ด
          </h1>
          <p className="text-white/70 text-sm md:text-base lg:text-xl max-w-2xl mx-auto leading-relaxed">
            กรอกโค้ดของคุณเพื่อแลกรับสินค้า
          </p>
        </div>

        <Card className="shadow-2xl border-0 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl md:rounded-3xl">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-lg md:text-xl lg:text-2xl text-white text-center">แลกรับของรางวัล</CardTitle>
            <CardDescription className="text-white/70 text-center text-xs md:text-sm lg:text-base">
              ใส่โค้ดที่คุณได้รับเพื่อแลกรับสินค้า
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {error && (
              <Alert variant="destructive" className="mb-4 border-red-500/50 bg-red-500/10 backdrop-blur-md">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-300">{error}</AlertDescription>
              </Alert>
            )}
            
            {success && !showCodeDialog && (
              <Alert className="mb-4 border-green-500/50 bg-green-500/10 backdrop-blur-md">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                <AlertDescription className="text-green-300">
                  แลกรับโค้ดสำเร็จ!
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-4 md:space-y-6">
              <div className="space-y-3">
                <Input
                  value={redeemCode}
                  onChange={(e) => setRedeemCode(e.target.value)}
                  placeholder="กรอกโค้ดแลกรับ"
                  className="border-white/20 bg-white/10 text-white placeholder:text-white/50 focus:border-green-500 focus:ring-green-500/50 h-12 text-base backdrop-blur-md text-center font-mono uppercase rounded-xl"
                />
              </div>
              
              <Button 
                onClick={handleRedeemCode} 
                className="w-full bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 hover:from-green-700 hover:via-blue-700 hover:to-purple-700 text-white font-bold py-3 md:py-4 text-base md:text-lg shadow-2xl hover:shadow-green-500/25 transition-all duration-300 hover:scale-105 rounded-xl" 
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="text-sm">กำลังตรวจสอบ...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Gift className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="text-sm">แลกรับ</span>
                  </div>
                )}
              </Button>
            </div>

            {/* ปุ่มติดต่อไลน์ */}
            <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-3 md:p-4">
              <div className="text-center space-y-2">
                <p className="text-green-200 text-xs md:text-sm">📞 ต้องการความช่วยเหลือ? ติดต่อแอดมินได้เลย</p>
                <div className="flex justify-center">
                  <Button
                    onClick={() => setShowLineQRPopup(true)}
                    className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 text-sm"
                  >
                    <MessageCircle className="h-3 w-3 mr-1" />
                    ติดต่อไลน์ (mixzis)
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-center mt-6">
              <Button variant="ghost" className="text-white hover:bg-white/10" asChild>
                <Link to="/" className="flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  กลับไปหน้าแรก
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Account Info Dialog */}
      <Dialog open={showCodeDialog} onOpenChange={setShowCodeDialog}>
        <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-xl border border-white/20">
          <DialogHeader>
            <DialogTitle className="text-green-600 text-xl">🎉 แลกรับสำเร็จ!</DialogTitle>
            <DialogDescription className="text-gray-600">
              ข้อมูลบัญชีของคุณ
            </DialogDescription>
          </DialogHeader>
          
          {accountInfo && (
            <div className="p-4 border rounded-lg bg-gray-50">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500 font-medium">ชื่อผู้ใช้:</p>
                  <div className="bg-white p-3 rounded border font-mono text-lg mt-1">
                    {accountInfo.username}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">รหัสผ่าน:</p>
                  <div className="bg-white p-3 rounded border font-mono text-lg mt-1">
                    {accountInfo.password}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-800 font-medium">
              ⚠️ คำเตือน: กรุณาบันทึกข้อมูลนี้ทันที เมื่อปิดหน้าต่างแล้วจะไม่สามารถดูได้อีก
            </p>
          </div>
          
          <DialogFooter className="mt-4">
            <Button 
              onClick={(e) => {
                e.preventDefault();
                setShowCodeDialog(false);
              }} 
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            >
              เสร็จสิ้น
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Line QR Code Dialog */}
      <Dialog open={showLineQRPopup} onOpenChange={setShowLineQRPopup}>
        <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-xl border border-white/20 rounded-3xl">
          <DialogHeader className="text-center pb-4">
            <DialogTitle className="text-green-600 text-xl">📱 ติดต่อแอดมินทางไลน์</DialogTitle>
            <DialogDescription className="text-gray-600">
              สแกน QR Code เพื่อเพิ่มเพื่อน หรือใช้ ID: mixzis
            </DialogDescription>
          </DialogHeader>
          
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-2xl shadow-lg border-2 border-gray-100">
                <img 
                  src="https://img5.pic.in.th/file/secure-sv1/412b63bf382aa3c421169d12ac8941d7.jpg" 
                  alt="Line QR Code" 
                  className="w-48 h-48 mx-auto"
                />
              </div>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-xl border border-blue-200">
              <p className="text-blue-800 text-sm font-medium">
                💡 วิธีเพิ่มเพื่อน:
              </p>
              <div className="text-blue-700 text-xs mt-1 space-y-1">
                <p>• สแกน QR Code ด้วยแอปไลน์</p>
                <p>• หรือค้นหา ID: <span className="font-bold">mixzis</span></p>
              </div>
            </div>
          </div>
          
          <DialogFooter className="pt-4">
            <Button 
              onClick={() => setShowLineQRPopup(false)} 
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 rounded-full"
            >
              ปิด
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}