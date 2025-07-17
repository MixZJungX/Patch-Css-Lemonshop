import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
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
    <div className="container max-w-md mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">แลกรับโค้ด</CardTitle>
          <CardDescription className="text-center">
            กรอกโค้ดของคุณเพื่อแลกรับสินค้า
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && !showCodeDialog && (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                แลกรับโค้ดสำเร็จ!
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-4">
            <div className="grid gap-2">
              <Input
                value={redeemCode}
                onChange={(e) => setRedeemCode(e.target.value)}
                placeholder="กรอกโค้ดแลกรับ"
                className="text-center font-mono uppercase"
              />
            </div>
            
            <Button 
              onClick={handleRedeemCode} 
              className="w-full" 
              disabled={loading}
            >
              {loading ? "กำลังตรวจสอบ..." : "แลกรับ"}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Account Info Dialog */}
      <Dialog open={showCodeDialog} onOpenChange={setShowCodeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>แลกรับสำเร็จ!</DialogTitle>
            <DialogDescription>
              ข้อมูลบัญชีของคุณ
            </DialogDescription>
          </DialogHeader>
          
          {accountInfo && (
            <div className="p-4 border rounded-lg bg-gray-50">
              <div className="mb-2">
                <p className="text-sm text-gray-500">ชื่อผู้ใช้:</p>
                <p className="font-mono text-lg">{accountInfo.username}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">รหัสผ่าน:</p>
                <p className="font-mono text-lg">{accountInfo.password}</p>
              </div>
            </div>
          )}
          
          <DialogFooter className="mt-4">
            <Button onClick={() => setShowCodeDialog(false)} className="w-full">
              ปิด
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}