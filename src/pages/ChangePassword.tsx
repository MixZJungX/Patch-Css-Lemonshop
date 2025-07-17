import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const validateForm = () => {
    setError(null);
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return false;
    }
    
    if (newPassword.length < 6) {
      setError("รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      return false;
    }
    
    if (newPassword !== confirmPassword) {
      setError("รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน");
      return false;
    }
    
    return true;
  };
  
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      // First, sign in with current password to verify it's correct
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword
      });
      
      if (signInError) {
        setError("รหัสผ่านปัจจุบันไม่ถูกต้อง");
        setIsLoading(false);
        return;
      }
      
      // Then update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (updateError) {
        setError(updateError.message || "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน");
        setIsLoading(false);
        return;
      }
      
      // Success
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Change password error:", error);
      setError("เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center">เปลี่ยนรหัสผ่าน</CardTitle>
          <CardDescription className="text-center">
            กรอกข้อมูลเพื่อเปลี่ยนรหัสผ่านของคุณ
          </CardDescription>
        </CardHeader>
        
        {success ? (
          <div className="p-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold">เปลี่ยนรหัสผ่านสำเร็จ!</h3>
              <p className="text-gray-500">
                รหัสผ่านของคุณได้รับการอัปเดตแล้ว
              </p>
              <Button onClick={() => navigate("/admin")} className="mt-4">
                กลับไปหน้าแอดมิน
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleChangePassword}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="current-password">รหัสผ่านปัจจุบัน</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านปัจจุบันของคุณ"
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-password">รหัสผ่านใหม่</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านใหม่"
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-password">ยืนยันรหัสผ่านใหม่</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                  disabled={isLoading}
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col gap-4">
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? "กำลังเปลี่ยนรหัสผ่าน..." : "เปลี่ยนรหัสผ่าน"}
              </Button>
              <Button 
                variant="outline" 
                className="w-full" 
                type="button"
                onClick={() => navigate("/admin")}
                disabled={isLoading}
              >
                ยกเลิก
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}