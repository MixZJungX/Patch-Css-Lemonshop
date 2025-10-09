import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Gift, Sparkles, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { ChickenAccount } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ChickenRedemption() {
  const [redeemCode, setRedeemCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [redeemedAccount, setRedeemedAccount] = useState<ChickenAccount | null>(null);
  const [showAccountDialog, setShowAccountDialog] = useState<boolean>(false);

  const handleRedemption = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!redeemCode || redeemCode.trim() === '') {
      setError('กรุณากรอกรหัสแลกบัญชี');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);
    
    try {
      console.log("Searching for code:", redeemCode.trim());
      
      // First, check if the code exists at all (regardless of status)
      const { data: codeCheck, error: checkError } = await supabase
        .from("app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_chicken_accounts")
        .select("*")
        .eq("code", redeemCode.trim())
        .limit(1);

      console.log("Code check result:", { codeCheck, checkError });

      if (checkError) {
        console.error("Check error:", checkError);
        throw checkError;
      }

      // If code doesn't exist in the system at all
      if (!codeCheck || codeCheck.length === 0) {
        setError('ไม่พบรหัสในระบบ - กรุณาตรวจสอบและพิมพ์ใหม่ หรือติดต่อไลน์');
        setIsSubmitting(false);
        return;
      }

      // Code exists, check its status
      const existingCode = codeCheck[0];
      
      if (existingCode.status !== 'available') {
        setError('รหัสนี้ถูกใช้งานไปแล้ว - ไม่สามารถใช้ซ้ำได้');
        setIsSubmitting(false);
        return;
      }

      // Now get the available account
      const { data: matchingAccount, error: findError } = await supabase
        .from("app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_chicken_accounts")
        .select("*")
        .eq("code", redeemCode.trim())
        .eq("status", "available")
        .limit(1);

      console.log("Search result:", { matchingAccount, findError });

      if (findError) {
        console.error("Find error:", findError);
        throw findError;
      }

      if (!matchingAccount || matchingAccount.length === 0) {
        setError('เกิดข้อผิดพลาดในการดึงข้อมูล โปรดลองอีกครั้ง');
        setIsSubmitting(false);
        return;
      }

      const accountToRedeem = matchingAccount[0];
      
      const { error: updateError } = await supabase
        .from("app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_chicken_accounts")
        .update({
          status: 'used',
          used_by: `User-${Date.now()}`,
          used_at: new Date().toISOString()
        })
        .eq("id", accountToRedeem.id);
        
      if (updateError) {
        throw updateError;
      }
      
      setRedeemedAccount(accountToRedeem);
      setSuccess(true);
      setRedeemCode("");
      setShowAccountDialog(true);
      
    } catch (error) {
      console.error("Error redeeming chicken account:", error);
      setError("เกิดข้อผิดพลาดในการแลกบัญชี โปรดลองอีกครั้งภายหลัง");
    } finally {
      setIsSubmitting(false);
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
            <div className="w-10 h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center shadow-2xl">
              <Gift className="w-5 h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 bg-clip-text text-transparent leading-tight">
            แลกบัญชีไก่ตัน
          </h1>
          <p className="text-white/70 text-sm md:text-base lg:text-xl max-w-2xl mx-auto leading-relaxed">
            กรอกรหัสของคุณเพื่อแลกรับบัญชีไก่ตัน
          </p>
        </div>

        {/* Main Card */}
        <Card className="shadow-2xl border-0 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl md:rounded-3xl">
          <CardHeader className="p-4 md:p-6 text-center">
            <CardTitle className="text-lg md:text-xl lg:text-2xl text-white flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-yellow-400" />
              แลกรหัสบัญชี
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {error && (
              <Alert variant="destructive" className="mb-4 border-2 border-red-500 bg-red-500/20 backdrop-blur-md shadow-lg">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <AlertDescription className="text-white font-semibold text-base">{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-4 border-2 border-green-500 bg-green-500/20 backdrop-blur-md shadow-lg">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <AlertDescription className="text-white font-semibold text-base">
                  แลกบัญชีสำเร็จ! กรุณาเก็บข้อมูลบัญชีไว้เป็นความลับ
                </AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleRedemption} className="space-y-6">
              <div className="space-y-3">
                <Input
                  placeholder="กรอกรหัสแลกบัญชี (เช่น ABC123)"
                  value={redeemCode}
                  onChange={(e) => setRedeemCode(e.target.value)}
                  disabled={isSubmitting}
                  className="border-white/20 bg-white/10 text-white placeholder:text-white/50 focus:border-yellow-500 focus:ring-yellow-500/50 h-12 text-base backdrop-blur-md text-center font-mono uppercase rounded-xl"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-yellow-600 via-orange-600 to-pink-600 hover:from-yellow-700 hover:via-orange-700 hover:to-pink-700 text-white font-bold py-3 md:py-4 text-base md:text-lg shadow-2xl hover:shadow-yellow-500/25 transition-all duration-300 hover:scale-105 rounded-xl" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="text-sm">กำลังตรวจสอบ...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Gift className="w-5 h-5" />
                    <span className="text-sm">ยืนยันการแลก</span>
                  </div>
                )}
              </Button>

              <div className="text-center space-y-2 text-white/70 text-sm">
                <p>• 1 โค้ด = 1 บัญชีไก่ตัน</p>
                <p>• โค้ดที่ใช้แล้วจะไม่สามารถใช้ซ้ำได้</p>
              </div>
            </form>

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

      {/* Dialog to show redeemed account */}
      <Dialog open={showAccountDialog} onOpenChange={setShowAccountDialog}>
        <DialogContent className="sm:max-w-[425px] bg-white/95 backdrop-blur-xl border border-white/20">
          <DialogHeader>
            <DialogTitle className="text-green-600 text-xl flex items-center gap-2">
              🎉 <span>แลกบัญชีสำเร็จ!</span>
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              กรุณาบันทึกข้อมูลบัญชีของคุณทันที
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {redeemedAccount && (
              <>
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <div className="grid gap-3">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-1">โค้ด:</h4>
                      <div className="bg-white p-3 rounded border font-mono text-sm">
                        {redeemedAccount.code}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700 mb-1">ชื่อผู้ใช้:</h4>
                      <div className="bg-white p-3 rounded border font-mono text-sm">
                        {redeemedAccount.username}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700 mb-1">รหัสผ่าน:</h4>
                      <div className="bg-white p-3 rounded border font-mono text-sm">
                        {redeemedAccount.password}
                      </div>
                    </div>
                    {redeemedAccount.product_name && (
                      <div>
                        <h4 className="font-medium text-gray-700 mb-1">ประเภทสินค้า:</h4>
                        <div className="bg-white p-3 rounded border text-sm">
                          {redeemedAccount.product_name}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-800 font-medium">
                    ⚠️ คำเตือน: กรุณา screenshot หรือบันทึกข้อมูลนี้ทันที เมื่อปิดหน้าต่างนี้แล้วจะไม่สามารถดูข้อมูลได้อีก
                  </p>
                </div>

                {/* Important instructions after successful redemption */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                  <div className="space-y-3">
                    <div className="text-center font-bold text-blue-800 text-lg">
                      📋 หลังจากใส่โค้ด และได้รับรหัส
                    </div>
                    
                    <div className="space-y-3 text-sm text-blue-800">
                      <div className="bg-white p-3 rounded-md border-l-4 border-orange-400">
                        <div className="flex items-start gap-2">
                          <span className="text-orange-600 font-bold">🔑</span>
                          <div>
                            <p className="font-bold text-orange-700">เปลี่ยนรหัส และยืนยันอีเมลให้เรียบร้อย</p>
                            <p className="text-orange-600 text-xs mt-1">ทำให้เสร็จภายหลังจากได้รับบัญชี</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-md border-l-4 border-blue-400">
                        <div className="flex items-start gap-2">
                          <span className="text-blue-600">🛡️</span>
                          <div>
                            <p className="font-medium text-blue-700">ระยะเวลาการรับประกันอยู่ที่ 3 วัน</p>
                            <p className="text-blue-600 text-xs">หากมีปัญหาใดๆหลังจากสามวันนี้จะไม่มีการรับผิดชอบ</p>
                            <p className="text-blue-600 text-xs font-medium">นับตั้งแต่วันที่กรอกรหัส</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-center pt-2 border-t border-blue-200">
                      <p className="text-xs text-blue-600 font-medium">
                        ⚠️ กรุณาปฏิบัติตามขั้นตอนข้างต้นเพื่อความปลอดภัยของบัญชี
                      </p>
                    </div>
                  </div>
                </div>

                {/* 5-star rating reminder */}
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-200 mt-4">
                  <div className="text-center space-y-2">
                    <div className="flex justify-center">
                      <span className="text-2xl">⭐⭐⭐⭐⭐</span>
                    </div>
                    <p className="font-bold text-yellow-800">
                      อย่าลืมให้ 5 ดาวเพื่อลุ้นรับไก่ตันด้วย!
                    </p>
                    <p className="text-sm text-yellow-700">
                      ขอบคุณที่ใช้บริการของเรา การให้คะแนนจะช่วยให้เราปรับปรุงบริการได้ดีขึ้น
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="flex justify-center">
            <Button
              onClick={(e) => {
                e.preventDefault();
                setShowAccountDialog(false);
              }}
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            >
              เสร็จสิ้น - ปิดหน้าต่าง
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}