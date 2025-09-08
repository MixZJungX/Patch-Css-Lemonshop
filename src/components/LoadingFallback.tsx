import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export const LoadingFallback: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <div className="text-center space-y-2">
            <h3 className="font-thai text-lg font-semibold text-gray-800">
              กำลังโหลด...
            </h3>
            <p className="text-sm text-gray-600">
              โปรดรอสักครู่
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};