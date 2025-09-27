import { Button } from '@/components/ui/button';
import { ArrowLeft, Home, RefreshCw } from 'lucide-react';
import { useEffect } from 'react';

export default function NotFoundPage() {
  useEffect(() => {
    // Log 404 error for debugging
    console.warn('404 Page Not Found:', window.location.pathname);
    
    // Try to redirect common misspelled URLs
    const path = window.location.pathname.toLowerCase();
    const commonRedirects: { [key: string]: string } = {
      '/home': '/',
      '/index': '/',
      '/main': '/',
      '/dashboard': '/admin',
      '/queue': '/queue-status',
      '/check': '/queue-status',
      '/check-status': '/queue-status',
    };
    
    if (commonRedirects[path]) {
      console.log(`Redirecting ${path} to ${commonRedirects[path]}`);
      window.location.replace(commonRedirects[path]);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%224%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
      
      <div className="min-h-screen flex flex-col items-center justify-center text-center relative z-10">
        <div className="space-y-8 max-w-md mx-auto">
          {/* 404 Number */}
          <div className="space-y-4">
            <h1 className="text-8xl md:text-9xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent leading-none">
              404
            </h1>
            <div className="w-16 h-1 bg-gradient-to-r from-blue-400 to-purple-500 mx-auto rounded-full"></div>
          </div>
          
          {/* Error Message */}
          <div className="space-y-3">
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              ไม่พบหน้าที่ค้นหา
            </h2>
            <p className="text-white/70 text-base md:text-lg leading-relaxed px-4">
              หน้าที่คุณกำลังค้นหาไม่มีอยู่ หรืออาจถูกย้ายไปแล้ว
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
            <Button 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold px-6 py-3 text-base shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105"
              asChild
            >
              <a href="/">
                <Home className="w-4 h-4 mr-2" />
                กลับหน้าแรก
              </a>
            </Button>
            <Button 
              variant="outline" 
              className="border-white/20 bg-white/10 text-white hover:bg-white/20 backdrop-blur-md px-6 py-3 text-base"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              กลับไป
            </Button>
            <Button 
              variant="outline" 
              className="border-white/20 bg-white/10 text-white hover:bg-white/20 backdrop-blur-md px-6 py-3 text-base"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              รีเฟรช
            </Button>
          </div>

          {/* Additional Help */}
          <div className="pt-8 border-t border-white/10">
            <p className="text-white/50 text-sm">
              หากคุณคิดว่านี่เป็นข้อผิดพลาด กรุณาติดต่อทีมผู้ดูแลระบบ
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}