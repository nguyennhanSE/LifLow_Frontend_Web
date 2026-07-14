"use client"

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

export function OrderPaymentMethod() {
  return (
    <div className="border rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4">결제 수단</h2>
      <RadioGroup defaultValue="credit-card" className="space-y-3">
        <div className="flex items-center space-x-2 border-2 border-[#FF6B5A] rounded-lg p-4">
          <RadioGroupItem value="credit-card" id="credit-card" className="border-[#FF6B5A]" />
          <Label htmlFor="credit-card" className="flex-1 cursor-pointer">
            <span className="text-[#FF6B5A]">★</span> 신용카드
          </Label>
        </div>
        <div className="flex items-center space-x-2 border rounded-lg p-4 bg-muted/50">
          <RadioGroupItem value="kakao-pay" id="kakao-pay" />
          <Label htmlFor="kakao-pay" className="flex-1 cursor-pointer">
            Kakao Pay
          </Label>
        </div>
        <div className="flex items-center space-x-2 border rounded-lg p-4 bg-muted/50">
          <RadioGroupItem value="tospay" id="tospay" />
          <Label htmlFor="tospay" className="flex-1 cursor-pointer">
            Tospay
          </Label>
        </div>
      </RadioGroup>
    </div>
  )
}

