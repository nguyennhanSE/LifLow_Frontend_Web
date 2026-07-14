"use client"

import { useState } from "react"
import { ChevronUp, ChevronDown } from "lucide-react"

/** Reward % by membership: 씨앗 1%, 새싹 2%, 열매 2.5%, 나무/정원 3% */
function getMembershipRewardRate(membershipLevel: string | null | undefined): number {
  if (!membershipLevel) return 0
  const level = membershipLevel.toLowerCase()
  if (level.includes("씨앗") || level.includes("lv1") || level.includes("lv 1")) return 1
  if (level.includes("새싹") || level.includes("lv2") || level.includes("lv 2")) return 2
  if (level.includes("열매") || level.includes("lv3") || level.includes("lv 3")) return 2.5
  if (level.includes("나무") || level.includes("정원") || level.includes("lv4") || level.includes("lv5") || level.includes("lv 4") || level.includes("lv 5")) return 3
  return 0
}

const formatCurrency = (value: number) => value.toLocaleString("ko-KR")

export interface OrderAccumulatedBenefitsProps {
  membershipLevel?: string | null
  totalOrderAmount: number
  points: number
  pointsToUse: number
}

export function OrderAccumulatedBenefits({
  membershipLevel,
  totalOrderAmount,
  points,
  pointsToUse,
}: OrderAccumulatedBenefitsProps) {
  const [benefitsExpanded, setBenefitsExpanded] = useState(false)

  const rate = getMembershipRewardRate(membershipLevel)
  const memberReward = Math.floor((totalOrderAmount * rate) / 100)
  // 예상 적립 금액 = (상품별 포인트 + 회원 적립) - 사용 포인트
  const expectedAccumulated = points + memberReward - pointsToUse

  return (
    <div className="border rounded-lg p-6">
      <button
        onClick={() => setBenefitsExpanded(!benefitsExpanded)}
        className="flex items-center justify-between w-full mb-4"
      >
        <h2 className="text-lg font-semibold">적립 혜택</h2>
        {benefitsExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>
      {benefitsExpanded && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span>상품별 포인트</span>
            <span>{formatCurrency(points)} 원</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>회원 적립</span>
            <span>{formatCurrency(memberReward)} 원</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>사용 포인트</span>
            <span>{formatCurrency(pointsToUse)} 원</span>
          </div>
          <div className="flex items-center justify-between font-medium pt-3 border-t">
            <span>예상 적립 금액</span>
            <span className="text-[#FF6B5A]">{formatCurrency(Math.max(0, expectedAccumulated))} 원</span>
          </div>
        </div>
      )}
    </div>
  )
}
