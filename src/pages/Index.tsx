import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gift, Sparkles, Gamepad2, Coins } from "lucide-react";

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%224%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
      
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center space-y-4 md:space-y-6 pt-8 md:pt-12 px-4">
          <div className="flex justify-center mb-4 md:mb-6">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center shadow-2xl">
              <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 bg-clip-text text-transparent leading-tight">
            เว็บไซต์แลกโค้ด
          </h1>
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Robux และไก่ตัน
          </h2>
          <p className="text-white/70 text-base md:text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed">
            แลกโค้ดของคุณเพื่อรับ Robux หรือบัญชีไก่ตันได้ที่นี่
          </p>
        </div>

        {/* Redemption Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 px-4">
          {/* Robux Card */}
          <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl hover:bg-white/15 transition-all duration-300 hover:scale-105 rounded-2xl md:rounded-3xl">
            <CardHeader className="text-center p-4 md:p-6">
              <div className="flex justify-center mb-3 md:mb-4">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-xl">
                  <Coins className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-xl md:text-2xl lg:text-3xl text-white font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                แลกโค้ด Robux
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-3 md:space-y-4">
              <p className="text-white/70 text-center leading-relaxed">
                แลกโค้ดของคุณเพื่อรับ Robux เข้าสู่บัญชี Roblox
              </p>
              <div className="text-center space-y-2 text-white/60 text-sm">
                <p>• รองรับหลายมูลค่า</p>
                <p>• แลกได้ทันที</p>
                <p>• ปลอดภัย 100%</p>
              </div>
              <Button 
                asChild
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 text-lg shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105"
              >
                <Link to="/redeem">
                  <Coins className="w-5 h-5 mr-2" />
                  แลกโค้ด Robux
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Chicken Account Card */}
          <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl hover:bg-white/15 transition-all duration-300 hover:scale-105">
            <CardHeader className="text-center p-6">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center shadow-xl">
                  <Gamepad2 className="w-8 h-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl md:text-3xl text-white font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                แลกบัญชีไก่ตัน
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="text-white/70 text-center leading-relaxed">
                แลกโค้ดของคุณเพื่อรับบัญชีเกมไก่ตัน
              </p>
              <div className="text-center space-y-2 text-white/60 text-sm">
                <p>• บัญชีคุณภาพสูง</p>
                <p>• รับประกัน 3 วัน</p>
                <p>• พร้อมใช้งานทันที</p>
              </div>
              <Button 
                asChild
                className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-bold py-4 text-lg shadow-2xl hover:shadow-yellow-500/25 transition-all duration-300 hover:scale-105"
              >
                <Link to="/chicken-redemption">
                  <Gift className="w-5 h-5 mr-2" />
                  แลกบัญชีไก่ตัน
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center space-y-4 pt-8 px-4">
          <div className="flex justify-center space-x-4">
            <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10" asChild>
              <Link to="/status">ตรวจสอบสถานะ</Link>
            </Button>
            <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10" asChild>
              <Link to="/admin">แอดมิน</Link>
            </Button>
          </div>
          <p className="text-white/50 text-sm">
            © 2024 เว็บไซต์แลกโค้ด - บริการแลกโค้ด Robux และไก่ตันที่ดีที่สุด
          </p>
        </div>
      </div>
    </div>
  );
}