import React from 'react'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'

interface QuickReplyButton {
  id: string
  label: string
  icon: string
  color: string
}

interface QuickReplyButtonsProps {
  onButtonClick: (button: QuickReplyButton) => void
  isVisible: boolean
}

const quickReplyButtons: QuickReplyButton[] = [
  {
    id: 'wrong_code',
    label: 'รหัสผิด',
    icon: '',
    color: 'bg-red-500 hover:bg-red-600'
  },
  {
    id: 'map_verification',
    label: 'ติดยืนยันแมพ',
    icon: '',
    color: 'bg-blue-500 hover:bg-blue-600'
  },
  {
    id: 'phone_verification',
    label: 'ติดยืนยันโทรศัพท์',
    icon: '',
    color: 'bg-green-500 hover:bg-green-600'
  },
  {
    id: 'email_verification',
    label: 'ติดอีเมล',
    icon: '',
    color: 'bg-purple-500 hover:bg-purple-600'
  },
  {
    id: 'unknown',
    label: 'ไม่ทราบ',
    icon: '',
    color: 'bg-gray-500 hover:bg-gray-600'
  },
  {
    id: 'inquiry',
    label: 'สอบถาม',
    icon: '',
    color: 'bg-orange-500 hover:bg-orange-600'
  }
]

export const QuickReplyButtons: React.FC<QuickReplyButtonsProps> = ({
  onButtonClick,
  isVisible
}) => {
  if (!isVisible) return null

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-2xl mb-4 shadow-lg">
      <CardContent className="p-6">
        <div className="text-center mb-4">
          <h4 className="text-gray-800 font-bold text-lg mb-2">💬 เลือกปัญหาที่พบ</h4>
          <p className="text-gray-600 text-sm font-medium">กดปุ่มเพื่อตอบกลับด่วน</p>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {quickReplyButtons.map((button) => (
            <Button
              key={button.id}
              onClick={() => onButtonClick(button)}
              className={`${button.color} text-white rounded-xl px-3 py-4 text-sm font-semibold transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl min-h-[3.5rem] flex items-center justify-center`}
            >
              <span className="text-center leading-tight break-words">{button.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
