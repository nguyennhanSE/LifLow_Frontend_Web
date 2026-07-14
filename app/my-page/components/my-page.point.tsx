"use client"

import { useState, useEffect } from "react"
import { Gift, TrendingDown, TrendingUp, Loader2 } from "lucide-react"
import { useUser } from "@/hooks/use-user/user.hook"
import { useTranslation } from 'react-i18next'

interface PointTransaction {
  id: string
  date: string
  userId: string
  membershipLevel: string | null
  content: string
  orderGroupNumber: string | null
  pointsType: string
  availablePointsIncrease: number | null
  availablePointsDeduction: number | null
  availablePointsBalance: number
  createdAt: string
  updatedAt: string
}

/** Response shape từ /user/me/coupons (availableCoupons / usedCoupons) */
interface UserCouponItem {
  couponId: string
  quantity: number
  status: string
  issuedAt: string
  usedAt: string | null
  expiredAt: string | null
  startDate?: string | null
  endDate?: string | null
  cancelledAt: string | null
  discountAmount: number | null
  maxDiscountAmount: number | null
  minPurchaseAmount: number
  couponType?: "PERCENT" | "AMOUNT" | "FREE_SHIPPING"
  discountRate?: number | null
  discountAppliedAmount?: number | null
  couponName?: string | null
  couponCode?: string | null
  couponImageUrl?: string | null
}

/** Format date as YYYY-MM-DD */
function formatDateYMD(dateStr: string): string {
  const d = new Date(dateStr)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export default function MyPagePoint() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<"points" | "coupons">("points")
  const [availablePoints, setAvailablePoints] = useState<number>(0)
  const [transactions, setTransactions] = useState<PointTransaction[]>([])
  const [availableCoupons, setAvailableCoupons] = useState<UserCouponItem[]>([])
  const [usedCoupons, setUsedCoupons] = useState<UserCouponItem[]>([])
  const [loading, setLoading] = useState(true)
  const { getMyPoints, getMyCoupons } = useUser()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch points data
        const pointsData = await getMyPoints()
        setAvailablePoints(pointsData.user.availablePoints || 0)
        setTransactions(pointsData.points || [])
        
        // Fetch coupons data
        const couponsData = await getMyCoupons()
        setAvailableCoupons(couponsData.availableCoupons || [])
        setUsedCoupons(couponsData.usedCoupons || [])
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [getMyPoints, getMyCoupons])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#ff5833]" />
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-8">{t('key226', '포인트 & 쿠폰')}</h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-8">
        <button
          onClick={() => setActiveTab("points")}
          className={`flex-1 py-4 px-6 rounded-lg text-lg font-medium transition-colors ${
            activeTab === "points" ? "bg-gray-100 text-black" : "bg-white text-gray-500 hover:bg-gray-50"
          }`}
        >
          {t('key240', '포인트 내역')}
        </button>
        <button
          onClick={() => setActiveTab("coupons")}
          className={`flex-1 py-4 px-6 rounded-lg text-lg font-medium transition-colors ${
            activeTab === "coupons" ? "bg-gray-100 text-black" : "bg-white text-gray-500 hover:bg-gray-50"
          }`}
        >
          {t('key241', '쿠폰 내역')}
        </button>
      </div>

      {activeTab === "points" ? (
        <>
          {/* Points Balance Card */}
          <div className="border border-gray-200 rounded-lg p-8 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-2">{t('key231', '보유 포인트')}</p>
                <p className="text-4xl font-bold text-[#ff5833]">{availablePoints.toLocaleString()}P</p>
              </div>
              <div className="w-16 h-16 rounded-full bg-[#ffe2e2] flex items-center justify-center">
                <Gift className="w-8 h-8 text-[#ff5833]" />
              </div>
            </div>
          </div>

          {/* Transaction History */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-6">{t('key242', '포인트 적립/사용 내역')}</h3>

            {transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">{t('key243', '거래 내역이 없습니다')}</div>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction) => {
                  // Dùng availablePointsIncrease/availablePointsDeduction để quyết định icon (không dùng pointsType)
                  // REWARD, EARNED + availablePointsIncrease > 0 → icon 적립 (tăng); USED + availablePointsDeduction > 0 → icon 사용 (giảm)
                  const hasIncrease = (transaction.availablePointsIncrease ?? 0) > 0
                  const hasDeduction = (transaction.availablePointsDeduction ?? 0) > 0
                  const isEarned = hasIncrease || (!hasDeduction && (transaction.pointsType === "EARNED" || transaction.pointsType === "REWARD"))
                  const pointsChange = hasIncrease
                    ? (transaction.availablePointsIncrease ?? 0)
                    : hasDeduction
                      ? -(transaction.availablePointsDeduction ?? 0)
                      : 0
                  
                  return (
                    <div
                      key={transaction.id}
                      className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {/* Icon */}
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                          isEarned ? "bg-[#dcfce7]" : "bg-[#ffe2e2]"
                        }`}
                      >
                        {isEarned ? (
                          <TrendingUp className="w-6 h-6 text-[#00a63e]" />
                        ) : (
                          <TrendingDown className="w-6 h-6 text-[#e7000b]" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <h4 className="font-medium text-base mb-1">{transaction.content}</h4>
                        <p className="text-sm text-gray-500">
                          {new Date(transaction.date).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          })}
                        </p>
                      </div>

                      {/* Points */}
                      <div
                        className={`text-xl font-bold ${isEarned ? "text-[#00a63e]" : "text-[#e7000b]"}`}
                      >
                        {pointsChange > 0 ? "+" : ""}
                        {pointsChange.toLocaleString()}P
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="space-y-6">
          {/* Available Coupons */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-2">{t('length', '사용 가능한 쿠폰 ({{length}}장)', { length: availableCoupons.length })}</h3>
            <p className="text-sm text-gray-500 mb-6">
              {t('key244', '적용 조건: 주문 금액이 최소 주문금액 이상일 때만 사용 가능합니다. 퍼센트 쿠폰의 경우 계산된 할인금액이 최대 할인금액을 초과하면 최대 할인금액으로 적용됩니다.')}
            </p>
            {availableCoupons.length === 0 ? (
              <div className="text-center py-8 text-gray-500">{t('key245', '사용 가능한 쿠폰이 없습니다')}</div>
            ) : (
              <div className="space-y-4">
                {availableCoupons.map((item, index) => {
                  const isFreeShipping = item.couponType === "FREE_SHIPPING"
                  const isPercent = !isFreeShipping && (item.discountRate != null && item.discountRate > 0)
                  const leftLabel = isFreeShipping
                    ? "무료 배송"
                    : isPercent
                      ? t('discountrate', '{{discountRate}}%', { discountRate: item.discountRate })
                      : `${(item.discountAmount ?? 0).toLocaleString()}원`
                  const start = item.startDate ?? item.issuedAt
                  const end = item.endDate ?? item.expiredAt
                  return (
                    <div
                      key={`${item.couponId}-${item.issuedAt}-${index}`}
                      className="flex rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm"
                    >
                      {/* Left: discount strip */}
                      <div className="w-[18%] min-w-[100px] flex flex-col items-center justify-center bg-[#ff6b5a] text-white py-6 px-2">
                        <span className="text-2xl font-bold leading-tight">{leftLabel}</span>
                        <span className="text-sm mt-0.5">{t('key246', '할인')}</span>
                      </div>
                      {/* Right: details */}
                      <div className="flex-1 relative py-4 pl-5 pr-4">
                        <span className="absolute top-3 right-3 rounded-md bg-[#ff6b5a] px-2.5 py-1 text-xs font-medium text-white">
                          {t('key247', '사용가능')}
                        </span>
                        <h4 className="text-base font-bold text-black mb-1 pr-20">
                          {item.couponName ?? (isFreeShipping ? "무료 배송" : isPercent ? t('discountrate2', '{{discountRate}}% 할인', { discountRate: item.discountRate }) : `${(item.discountAmount ?? 0).toLocaleString()}원 할인`)}
                        </h4>
                        {item.couponCode != null && item.couponCode !== "" && (
                          <p className="text-sm text-gray-700 mb-0.5">
                            {t('key248', '코드:')} <span className="font-semibold">{item.couponCode}</span>
                          </p>
                        )}
                        {item.maxDiscountAmount != null && item.maxDiscountAmount > 0 && (
                          <p className="text-sm text-gray-600 mb-0.5">
                            {t('key249', '최대 할인금액:')} {item.maxDiscountAmount.toLocaleString()}원
                          </p>
                        )}
                        <p className="text-sm text-gray-600 mb-0.5">
                          {t('key250', '최소 주문금액:')} {(item.minPurchaseAmount ?? 0).toLocaleString()}원
                        </p>
                        {start && (
                          <p className="text-sm text-gray-600 mb-0.5">
                            {t('key251', '유효기간:')} {formatDateYMD(start)}
                            {end ? t('val', '~ {{val}}', { val: formatDateYMD(end) }) : ""}
                          </p>
                        )}
                        <p className="text-sm text-gray-600">
                          {t('key252', '발급일:')} {formatDateYMD(item.issuedAt)}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">{t('key253', '보유:')} {item.quantity ?? 1}장</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Used Coupons */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-6">{t('length2', '사용한 쿠폰 ({{length}})', { length: usedCoupons.length })}</h3>
            {usedCoupons.length === 0 ? (
              <div className="text-center py-8 text-gray-500">{t('key254', '사용한 쿠폰이 없습니다')}</div>
            ) : (
              <div className="space-y-4">
                {usedCoupons.map((item, index) => {
                  const isFreeShipping = item.couponType === "FREE_SHIPPING"
                  const isPercent = !isFreeShipping && (item.discountRate != null && item.discountRate > 0)
                  const leftLabel = isFreeShipping
                    ? "무료 배송"
                    : isPercent
                      ? t('discountrate', '{{discountRate}}%', { discountRate: item.discountRate })
                      : `${(item.discountAmount ?? 0).toLocaleString()}원`
                  const start = item.startDate ?? item.issuedAt
                  const end = item.endDate ?? item.expiredAt
                  return (
                    <div
                      key={`${item.couponId}-${item.issuedAt}-${index}`}
                      className="flex rounded-xl border border-gray-200 overflow-hidden bg-gray-50 opacity-90"
                    >
                      <div className="w-[28%] min-w-[100px] flex flex-col items-center justify-center bg-gray-400 text-white py-6 px-2">
                        <span className="text-2xl font-bold leading-tight">{leftLabel}</span>
                        <span className="text-sm mt-0.5">{t('key246', '할인')}</span>
                      </div>
                      <div className="flex-1 relative py-4 pl-5 pr-4">
                        <span className="absolute top-3 right-3 rounded-md bg-gray-500 px-2.5 py-1 text-xs font-medium text-white">
                          {t('key255', '사용완료')}
                        </span>
                        <h4 className="text-base font-bold text-gray-800 mb-1 pr-20">
                          {item.couponName ?? (isFreeShipping ? "무료 배송" : isPercent ? t('discountrate2', '{{discountRate}}% 할인', { discountRate: item.discountRate }) : `${(item.discountAmount ?? 0).toLocaleString()}원 할인`)}
                        </h4>
                        {item.couponCode != null && item.couponCode !== "" && (
                          <p className="text-sm text-gray-600 mb-0.5">
                            {t('key248', '코드:')} <span className="font-semibold">{item.couponCode}</span>
                          </p>
                        )}
                        {item.maxDiscountAmount != null && item.maxDiscountAmount > 0 && (
                          <p className="text-sm text-gray-600 mb-0.5">
                            {t('key249', '최대 할인금액:')} {item.maxDiscountAmount.toLocaleString()}원
                          </p>
                        )}
                        <p className="text-sm text-gray-600 mb-0.5">
                          {t('key250', '최소 주문금액:')} {(item.minPurchaseAmount ?? 0).toLocaleString()}원
                        </p>
                        {start && (
                          <p className="text-sm text-gray-600 mb-0.5">
                            {t('key251', '유효기간:')} {formatDateYMD(start)}
                            {end ? t('val', '~ {{val}}', { val: formatDateYMD(end) }) : ""}
                          </p>
                        )}
                        <p className="text-sm text-gray-600">
                          {t('key256', '사용일:')} {item.usedAt ? formatDateYMD(item.usedAt) : "정보 없음"}
                        </p>
                        {item.discountAppliedAmount != null && (
                          <p className="text-sm text-gray-600 font-medium mt-0.5">
                            {t('key257', '할인 금액:')} {item.discountAppliedAmount.toLocaleString()}원
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
