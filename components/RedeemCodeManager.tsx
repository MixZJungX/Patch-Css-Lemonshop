import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Clock, CheckCircle2, Gift } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RedemptionHistory {
  id: string;
  code: string;
  game_code: string;
  redemption_instruction: string;
  used_at: string;
  created_at: string;
}

interface RedeemCodeManagerProps {
  userId?: string;
}

export default function RedeemCodeManager({ userId }: RedeemCodeManagerProps) {
  const [redemptionHistory, setRedemptionHistory] = useState<RedemptionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRedemptionHistory();
  }, [userId]);

  const fetchRedemptionHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user if userId not provided
      let currentUserId = userId;
      if (!currentUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError("กรุณาเข้าสู่ระบบเพื่อดูประวัติการแลกรับโค้ด");
          return;
        }
        currentUserId = user.id;
      }

      // Fetch user's redemption history
      const { data, error: fetchError } = await supabase
        .from("rainbow_six_redeem_codes")
        .select("*")
        .eq("used_by", currentUserId)
        .eq("is_used", true)
        .order("used_at", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setRedemptionHistory(data || []);
    } catch (error) {
      console.error("Error fetching redemption history:", error);
      setError("ไม่สามารถโหลดประวัติการแลกรับโค้ดได้");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            ประวัติการแลกรับโค้ด
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2 text-gray-500">
              <Clock className="w-4 h-4 animate-spin" />
              <span>กำลังโหลด...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="w-5 h-5" />
          ประวัติการแลกรับโค้ด Rainbow Six
        </CardTitle>
        <CardDescription>
          ดูประวัติการแลกรับโค้ดเกม Rainbow Six ของคุณ
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {redemptionHistory.length === 0 ? (
          <div className="text-center py-8">
            <Gift className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 mb-2">ยังไม่มีประวัติการแลกรับโค้ด</p>
            <p className="text-sm text-gray-400">
              เมื่อคุณแลกรับโค้ดเกม Rainbow Six ประวัติจะแสดงที่นี่
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {redemptionHistory.map((item) => (
              <div
                key={item.id}
                className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      ใช้งานแล้ว
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDate(item.used_at)}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-600">โค้ดแลกรับ:</span>
                    <div className="font-mono text-sm bg-white p-2 rounded border mt-1">
                      {item.code}
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium text-gray-600">โค้ดเกม:</span>
                    <div className="font-mono text-sm bg-white p-2 rounded border mt-1 font-bold">
                      {item.game_code}
                    </div>
                  </div>
                  
                  {item.redemption_instruction && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">คำแนะนำ:</span>
                      <div className="text-sm bg-white p-2 rounded border mt-1">
                        {item.redemption_instruction}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={fetchRedemptionHistory}
            className="w-full"
          >
            รีเฟรชประวัติ
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}