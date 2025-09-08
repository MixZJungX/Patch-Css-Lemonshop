import React from 'react';
import QueueStatusChecker from '@/components/QueueStatusChecker';

export default function QueueStatusPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <QueueStatusChecker />
    </div>
  );
}
