import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Gift, ArrowLeft, GamepadIcon, Search, X, Filter } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [availableCodes, setAvailableCodes] = useState<any[]>([]);
  const [filteredCodes, setFilteredCodes] = useState<any[]>([]);

  // Load available codes on component mount
  const loadAvailableCodes = async () => {
    try {
      const { data, error } = await supabase
        .from("rainbow_six_redeem_codes")
        .select("*")
        .eq("is_used", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      setAvailableCodes(data || []);
      setFilteredCodes(data || []);
    } catch (error) {
      console.error("Error loading codes:", error);
    }
  };

  // Filter codes based on search term and category
  const filterCodes = () => {
    let filtered = availableCodes;

    // Apply category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(code => {
        switch (selectedCategory) {
          case "operators":
            return code.code_type === "operator" || code.code_type === "character";
          case "credits":
            return code.code_type === "credits" || code.code_type === "currency";
          case "skins":
            return code.code_type === "skin" || code.code_type === "cosmetic";
          case "boosters":
            return code.code_type === "booster" || code.code_type === "xp";
          default:
            return true;
        }
      });
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(code => 
        code.game_code.toLowerCase().includes(searchLower) ||
        (code.code_type && code.code_type.toLowerCase().includes(searchLower)) ||
        (code.description && code.description.toLowerCase().includes(searchLower)) ||
        (code.redemption_instruction && code.redemption_instruction.toLowerCase().includes(searchLower))
      );
    }

    setFilteredCodes(filtered);
  };

  // Load codes on mount
  React.useEffect(() => {
    loadAvailableCodes();
  }, []);

  // Filter codes when search term or category changes
  React.useEffect(() => {
    filterCodes();
  }, [searchTerm, selectedCategory, availableCodes]);

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
      // First, check if the code exists at all (regardless of is_used status)
      const { data: codeCheck, error: checkError } = await supabase
        .from("rainbow_six_redeem_codes")
        .select("*")
        .eq("code", redeemCode)
        .maybeSingle();

      if (checkError) {
        throw checkError;
      }

      // If code doesn't exist in the system at all
      if (!codeCheck) {
        setError("ไม่พบโค้ดในระบบ - กรุณาตรวจสอบและพิมพ์ใหม่ หรือติดต่อไลน์");
        setLoading(false);
        return;
      }

      // Code exists, check if it's already used
      if (codeCheck.is_used) {
        setError("โค้ดนี้ถูกใช้งานไปแล้ว - ไม่สามารถใช้ซ้ำได้");
        setLoading(false);
        return;
      }

      // Code exists and is not used - proceed with redemption
      const codeData = codeCheck;

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

        <Card className="shadow-2xl border-0 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl md:rounded-3xl">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-lg md:text-xl lg:text-2xl text-white text-center">แลกรับโค้ด Rainbow Six</CardTitle>
            <CardDescription className="text-white/70 text-center text-xs md:text-sm lg:text-base">
              กรอกข้อมูลบัญชี Ubisoft ของคุณและโค้ดที่ได้รับ
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 space-y-4 md:space-y-6">
            {error && (
              <Alert variant="destructive" className="mb-4 border-2 border-red-500 bg-red-500/20 backdrop-blur-md shadow-lg">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <AlertDescription className="text-white font-semibold text-base">{error}</AlertDescription>
              </Alert>
            )}
            
            {success && !showCodeDialog && (
              <Alert className="mb-4 border-2 border-green-500 bg-green-500/20 backdrop-blur-md shadow-lg">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
                <AlertDescription className="text-white font-semibold text-base">
                  แลกรับโค้ดสำเร็จ!
                </AlertDescription>
              </Alert>
            )}
            
            {/* Search and Filter Section */}
            <div className="space-y-4 mb-6">
              {/* Search Bar */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="ค้นหาโค้ด... (รหัสโค้ด, ประเภท, คำอธิบาย)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
              
              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-white/70" />
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="เลือกหมวดหมู่" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="all" className="text-white hover:bg-gray-700">🎮 ทั้งหมด</SelectItem>
                    <SelectItem value="operators" className="text-white hover:bg-gray-700">👤 Operators</SelectItem>
                    <SelectItem value="credits" className="text-white hover:bg-gray-700">💰 Credits</SelectItem>
                    <SelectItem value="skins" className="text-white hover:bg-gray-700">🎨 Skins</SelectItem>
                    <SelectItem value="boosters" className="text-white hover:bg-gray-700">⚡ Boosters</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Available Codes Count */}
              <div className="text-center">
                <span className="text-white/70 text-sm">
                  พบโค้ด {filteredCodes.length} รายการ
                  {selectedCategory !== "all" && ` ในหมวดหมู่ ${selectedCategory}`}
                </span>
              </div>
            </div>

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
              className="w-full mt-4 md:mt-6 bg-gradient-to-r from-blue-600 via-orange-600 to-red-600 hover:from-blue-700 hover:via-orange-700 hover:to-red-700 text-white font-bold py-3 md:py-4 text-base md:text-lg shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105 rounded-xl" 
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span className="text-sm">กำลังตรวจสอบ...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <GamepadIcon className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="text-sm">แลกรับโค้ด</span>
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

        {/* Available Codes Display */}
        {filteredCodes.length > 0 && (
          <Card className="shadow-2xl border-0 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl md:rounded-3xl">
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-lg md:text-xl lg:text-2xl text-white text-center">🎮 โค้ดที่พร้อมใช้งาน</CardTitle>
              <CardDescription className="text-white/70 text-center text-xs md:text-sm lg:text-base">
                เลือกโค้ดที่ต้องการแลกรับ
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                {filteredCodes.map((code, index) => (
                  <div
                    key={code.id}
                    className="bg-white/5 border border-white/20 rounded-lg p-4 hover:bg-white/10 transition-all duration-200 cursor-pointer"
                    onClick={() => setRedeemCode(code.game_code)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-white font-mono text-sm bg-blue-500/20 px-2 py-1 rounded">
                            {code.game_code}
                          </span>
                          {code.code_type && (
                            <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
                              {code.code_type}
                            </span>
                          )}
                        </div>
                        {code.description && (
                          <p className="text-white/70 text-sm">{code.description}</p>
                        )}
                        {code.redemption_instruction && (
                          <p className="text-white/50 text-xs mt-1">{code.redemption_instruction}</p>
                        )}
                      </div>
                      <div className="ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-white border-white/20 hover:bg-white/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRedeemCode(code.game_code);
                          }}
                        >
                          เลือก
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
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