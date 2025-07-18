import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Link, Navigate } from 'react-router-dom';

export default function Login() {
  const { user, signIn } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  if (user) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }

    setIsLoading(true);

    try {
      await signIn(formData.email, formData.password);
      toast.success('เข้าสู่ระบบสำเร็จ');
    } catch (error: any) {
      toast.error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
      </div>

      <Card className="w-full max-w-md bg-white/10 backdrop-blur-xl border-white/20 relative z-10">
        <CardHeader className="text-center space-y-4">
          <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto shadow-2xl">
            <span className="text-4xl">🔐</span>
          </div>
          <CardTitle className="text-3xl text-white bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">
            เข้าสู่ระบบแอดมิน
          </CardTitle>
          <p className="text-white/60">เข้าสู่ระบบเพื่อจัดการคำขอและข้อมูล</p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                อีเมล
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="admin@example.com"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                required
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                รหัสผ่าน
              </label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="••••••••"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-semibold py-3 text-lg"
            >
              {isLoading ? 'กำลังเข้าสู่ระบบ...' : '🔐 เข้าสู่ระบบ'}
            </Button>
          </form>

          <div className="text-center">
            <Link to="/">
              <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10">
                ← กลับหน้าหลัก
              </Button>
            </Link>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <p className="text-yellow-200 text-sm text-center">
              <strong>สำหรับแอดมินเท่านั้น</strong><br/>
              หากคุณไม่ใช่แอดมิน กรุณากลับไปหน้าหลัก
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}