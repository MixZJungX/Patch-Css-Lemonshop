import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
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
      // Simple validation code for demo purposes
      // In a real app, this would check against valid redemption codes in the database
      if (redeemCode !== 'CHICKEN123') {
        setError('รหัสแลกบัญชีไม่ถูกต้อง');
        setIsSubmitting(false);
        return;
      }
      
      // Find an available chicken account
      const { data: availableAccounts, error: fetchError } = await supabase
        .from("app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_chicken_accounts")
        .select("*")
        .eq("status", "available")
        .limit(1);
        
      if (fetchError) {
        throw fetchError;
      }
      
      if (!availableAccounts || availableAccounts.length === 0) {
        setError('ขออภัย ไม่มีบัญชีว่างในระบบ โปรดติดต่อแอดมิน');
        setIsSubmitting(false);
        return;
      }
      
      const accountToRedeem = availableAccounts[0];
      
      // Update the account status to used
      const { error: updateError } = await supabase
        .from("app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_chicken_accounts")
        .update({
          status: "used",
          used_by: `User-${Math.floor(Math.random() * 1000)}` // In a real app, this would be the actual user ID
        })
        .eq("id", accountToRedeem.id);
        
      if (updateError) {
        throw updateError;
      }
      
      // Set the redeemed account and show success
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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">แลกบัญชีไก่ตัน</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleRedemption} className="space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder="กรอกรหัสแลกบัญชี"
                  value={redeemCode}
                  onChange={(e) => setRedeemCode(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "กำลังตรวจสอบ..." : "ยืนยันการแลก"}
              </Button>

              {/* For testing purposes */}
              {process.env.NODE_ENV !== "production" && (
                <div className="mt-4 text-xs text-gray-400">
                  <p>สำหรับการทดสอบ: ใช้รหัส "CHICKEN123" เพื่อแลกบัญชี</p>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Dialog to show redeemed account */}
      <Dialog open={showAccountDialog} onOpenChange={setShowAccountDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>แลกบัญชีสำเร็จ!</DialogTitle>
            <DialogDescription>
              กรุณาบันทึกข้อมูลบัญชีของคุณ
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {redeemedAccount && (
              <>
                <div className="grid gap-1">
                  <h4 className="font-medium">ชื่อผู้ใช้:</h4>
                  <div className="bg-gray-50 p-2 rounded border font-mono">
                    {redeemedAccount.username}
                  </div>
                </div>
                <div className="grid gap-1">
                  <h4 className="font-medium">รหัสผ่าน:</h4>
                  <div className="bg-gray-50 p-2 rounded border font-mono">
                    {redeemedAccount.password}
                  </div>
                </div>
                <p className="text-sm text-yellow-600 font-semibold mt-2">
                  * กรุณาเก็บข้อมูลบัญชีไว้เป็นความลับและบันทึกไว้ทันที
                </p>
              </>
            )}
          </div>
          <div className="flex justify-center">
            <Button
              onClick={() => setShowAccountDialog(false)}
            >
              ปิด
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}