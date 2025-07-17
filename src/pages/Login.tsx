import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isDebugMode, setIsDebugMode] = useState(false);
  const { login, user, isLoading, isAdmin, authError } = useAuth();
  const navigate = useNavigate();

  // Enable debug mode with query param ?debug=true
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const debug = urlParams.get('debug');
    setIsDebugMode(debug === 'true');
  }, []);

  useEffect(() => {
    // If user is already logged in and is an admin, redirect to admin page
    if (user && isAdmin) {
      navigate("/admin");
    }
  }, [user, isAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    
    if (!email) {
      setLoginError("กรุณากรอกอีเมล");
      return;
    }
    
    if (!password) {
      setLoginError("กรุณากรอกรหัสผ่าน");
      return;
    }
    
    const { success, error } = await login(email, password);
    
    if (!success) {
      setLoginError(error || "การเข้าสู่ระบบล้มเหลว");
      console.error("Login failed:", error);
    } else {
      console.log("Login successful, redirecting to admin page");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-3xl font-extrabold text-gray-900">
            เข้าสู่ระบบแอดมิน
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            กรอกข้อมูลของคุณเพื่อเข้าสู่ระบบ
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>เข้าสู่ระบบ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loginError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{loginError}</AlertDescription>
                </Alert>
              )}
              
              {isDebugMode && authError && (
                <Alert variant="destructive" className="bg-yellow-50 border-yellow-200 text-yellow-800">
                  <AlertDescription className="font-mono text-xs break-all">{authError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">อีเมล</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="กรอกอีเมลของคุณ"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">รหัสผ่าน</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="กรอกรหัสผ่านของคุณ"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </CardContent>

            <CardFooter>
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        {/* Debug mode indicator */}
        {isDebugMode && (
          <div className="text-center text-xs text-gray-500 mt-4">
            Debug Mode Active
          </div>
        )}
      </div>
    </div>
  );
}