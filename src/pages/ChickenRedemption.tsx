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
      
      // First check if this code has been used in any redemption request
      const { data: existingRequests, error: requestsError } = await supabase
        .from("app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_redemption_requests")
        .select("*")
        .ilike("contact_info", `%${redeemCode.trim()}%`);
      
      if (requestsError) {
        console.error("Error checking existing requests:", requestsError);
      } else if (existingRequests && existingRequests.length > 0) {
        setError('รหัสแลกบัญชีนี้ถูกใช้งานไปแล้ว');
        setIsSubmitting(false);
        return;
      }
      
      // If no existing request found with this code, proceed to check for available account
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
        setError('รหัสแลกบัญชีไม่ถูกต้องหรือถูกใช้งานไปแล้ว');
        setIsSubmitting(false);
        return;
      }

      const accountToRedeem = matchingAccount[0];
      
      // Update the account status to used
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
      
      // Create a single redemption request record
      const { error: requestError } = await supabase
        .from("app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_redemption_requests")
        .insert({
          roblox_username: accountToRedeem.username,
          robux_amount: 0,
          contact_info: `Code: ${accountToRedeem.code} | Username: ${accountToRedeem.username} | Password: ${accountToRedeem.password} | Product: ${accountToRedeem.product_name}`,
          status: 'completed',
          assigned_account_code: accountToRedeem.code
        });
        
      if (requestError) {
        console.error("Error creating redemption request:", requestError);
        // Continue showing the account even if request creation fails
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
      
      <div className="max-w-md mx-auto space-y-6 md:space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center space-y-4 pt-6 md:pt-12 px-2">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center shadow-2xl">
              <Gift className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 bg-clip-text text-transparent leading-tight">
            แลกบัญชีไก่ตัน
          </h1>
          <p className="text-white/70 text-base md:text-xl max-w-2xl mx-auto leading-relaxed px-4">
            กรอกรหัสของคุณเพื่อแลกรับบัญชีไก่ตัน
          </p>
        </div>

        {/* Main Card */}
        <Card className="shadow-2xl border-0 bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader className="p-4 md:p-6 text-center">
            <CardTitle className="text-xl md:text-2xl text-white flex items-center justify-center gap-2">
              <Sparkles className="w-6 h-6 text-yellow-400" />
              แลกรหัสบัญชี
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {error && (
              <Alert variant="destructive" className="mb-4 border-red-500/50 bg-red-500/10 backdrop-blur-md">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-300">{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-4 border-green-500/50 bg-green-500/10 backdrop-blur-md">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <AlertDescription className="text-green-300">
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
                  className="border-white/20 bg-white/10 text-white placeholder:text-white/50 focus:border-yellow-500 focus:ring-yellow-500/50 h-11 md:h-12 text-sm md:text-base backdrop-blur-md text-center font-mono uppercase"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-yellow-600 via-orange-600 to-pink-600 hover:from-yellow-700 hover:via-orange-700 hover:to-pink-700 text-white font-bold py-3 md:py-4 text-lg md:text-xl shadow-2xl hover:shadow-yellow-500/25 transition-all duration-300 hover:scale-105 rounded-xl" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="text-sm md:text-base">กำลังตรวจสอบ...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Gift className="w-5 h-5" />
                    <span className="text-sm md:text-base">ยืนยันการแลก</span>
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
              type="button"
              onClick={() => setShowAccountDialog(false)}
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