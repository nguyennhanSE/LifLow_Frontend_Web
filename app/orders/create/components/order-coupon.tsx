"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ChevronUp, ChevronDown, Plus, Minus } from "lucide-react"

/** Item từ getMyCoupons().availableCoupons */
export interface OrderCouponItem {
  couponId: string
  quantity: number
  status: string
  issuedAt: string
  usedAt: string | null
  expiredAt: string | null
  cancelledAt: string | null
  discountAmount: number | null
  maxDiscountAmount: number | null
  minPurchaseAmount: number
  couponType?: "PERCENT" | "AMOUNT" | "FREE_SHIPPING"
  discountRate?: number | null
  startDate?: string | null
  endDate?: string | null
  couponName?: string | null
  couponCode?: string | null
  couponImageUrl?: string | null
}

interface OrderCouponProps {
  availableCoupons: OrderCouponItem[]
  formatCurrency: (value: number) => string
  /** Tổng tiền sản phẩm: PERCENT/AMOUNT coupon chỉ áp dụng cho giá trị này; dùng kiểm tra minPurchaseAmount */
  totalProductPrice: number
  /** Phí ship: chỉ bị giảm bởi coupon FREE_SHIPPING (tối đa 1 lần) */
  deliveryFee?: number
  /** Danh sách couponId đang chọn áp dụng cho đơn (có thể trùng nếu dùng nhiều coupon cùng loại) */
  selectedCouponIds: string[]
  onSelectedCouponIdsChange: (ids: string[]) => void
}

/** Format date as YYYY.M.D (no spaces, e.g. 2026.1.31) */
function formatDateCompact(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`
}

/** Format date as YYYY-MM-DD */
function formatDateYMD(dateStr: string): string {
  const d = new Date(dateStr)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

/** PERCENT/AMOUNT chỉ áp cho totalProductPrice (cap tổng giảm sản phẩm ≤ totalProductPrice). FREE_SHIPPING chỉ trừ deliveryFee, tối đa 1 lần. */
export function calculateOrderCouponDiscount(
  byCouponId: Map<string, OrderCouponItem>,
  selectedCouponIds: string[],
  totalProductPrice: number,
  deliveryFee?: number
): number {
  let productDiscountTotal = 0
  let freeShippingApplied = false
  const delivery = Number(deliveryFee) || 0
  const productCap = Math.max(0, totalProductPrice)

  selectedCouponIds.forEach((couponId) => {
    const item = byCouponId.get(couponId)
    if (!item) return
    if (item.couponType === "FREE_SHIPPING") {
      if (!freeShippingApplied && delivery > 0) {
        freeShippingApplied = true
      }
      return
    }
    const isPercent = item.discountRate != null && item.discountRate > 0
    let discount = 0
    if (isPercent) {
      discount = (productCap * (item.discountRate ?? 0)) / 100
      if (
        item.maxDiscountAmount != null &&
        item.maxDiscountAmount > 0 &&
        discount > item.maxDiscountAmount
      ) {
        discount = item.maxDiscountAmount
      }
    } else {
      discount = item.discountAmount ?? 0
    }
    const remaining = productCap - productDiscountTotal
    productDiscountTotal += Math.min(discount, Math.max(0, remaining))
  })

  const shippingDiscount = freeShippingApplied ? delivery : 0
  return productDiscountTotal + shippingDiscount
}

/** Trả về giảm giá tách riêng: product (PERCENT/AMOUNT) và shipping (FREE_SHIPPING). */
export function calculateOrderCouponDiscountBreakdown(
  byCouponId: Map<string, OrderCouponItem>,
  selectedCouponIds: string[],
  totalProductPrice: number,
  deliveryFee?: number
): { productDiscount: number; shippingDiscount: number; total: number } {
  let productDiscountTotal = 0
  let freeShippingApplied = false
  const delivery = Number(deliveryFee) || 0
  const productCap = Math.max(0, totalProductPrice)

  selectedCouponIds.forEach((couponId) => {
    const item = byCouponId.get(couponId)
    if (!item) return
    if (item.couponType === "FREE_SHIPPING") {
      if (!freeShippingApplied && delivery > 0) {
        freeShippingApplied = true
      }
      return
    }
    const isPercent = item.discountRate != null && item.discountRate > 0
    let discount = 0
    if (isPercent) {
      discount = (productCap * (item.discountRate ?? 0)) / 100
      if (
        item.maxDiscountAmount != null &&
        item.maxDiscountAmount > 0 &&
        discount > item.maxDiscountAmount
      ) {
        discount = item.maxDiscountAmount
      }
    } else {
      discount = item.discountAmount ?? 0
    }
    const remaining = productCap - productDiscountTotal
    productDiscountTotal += Math.min(discount, Math.max(0, remaining))
  })

  const shippingDiscount = freeShippingApplied ? delivery : 0
  return {
    productDiscount: productDiscountTotal,
    shippingDiscount,
    total: productDiscountTotal + shippingDiscount,
  }
}

/** Giảm giá từ coupon PERCENT/AMOUNT áp cho sản phẩm (để tính remaining product, cap point, v.v.). */
export function calculateProductCouponDiscount(
  byCouponId: Map<string, OrderCouponItem>,
  selectedCouponIds: string[],
  totalProductPrice: number
): number {
  let productDiscountTotal = 0
  const productCap = Math.max(0, totalProductPrice)
  selectedCouponIds.forEach((couponId) => {
    const item = byCouponId.get(couponId)
    if (!item || item.couponType === "FREE_SHIPPING") return
    const isPercent = item.discountRate != null && item.discountRate > 0
    let discount = 0
    if (isPercent) {
      discount = (productCap * (item.discountRate ?? 0)) / 100
      if (
        item.maxDiscountAmount != null &&
        item.maxDiscountAmount > 0 &&
        discount > item.maxDiscountAmount
      ) {
        discount = item.maxDiscountAmount
      }
    } else {
      discount = item.discountAmount ?? 0
    }
    const remaining = productCap - productDiscountTotal
    productDiscountTotal += Math.min(discount, Math.max(0, remaining))
  })
  return productDiscountTotal
}

export function OrderCoupon({
  availableCoupons,
  formatCurrency,
  totalProductPrice,
  deliveryFee = 0,
  selectedCouponIds,
  onSelectedCouponIdsChange,
}: OrderCouponProps) {
  const [discountExpanded, setDiscountExpanded] = useState(false)

  const usedCountByCouponId = useMemo(() => {
    const count: Record<string, number> = {}
    selectedCouponIds.forEach((couponId) => {
      count[couponId] = (count[couponId] ?? 0) + 1
    })
    return count
  }, [selectedCouponIds])

  const byCouponId = useMemo(() => {
    const map = new Map<string, OrderCouponItem>()
    availableCoupons.forEach((item) => {
      if (!map.has(item.couponId)) map.set(item.couponId, item)
    })
    return map
  }, [availableCoupons])

  /** Tổng quantity theo couponId (nhiều item cùng couponId không gộp nhưng tổng số lượng dùng để giới hạn chọn) */
  const totalQuantityByCouponId = useMemo(() => {
    const m: Record<string, number> = {}
    availableCoupons.forEach((item) => {
      m[item.couponId] = (m[item.couponId] ?? 0) + item.quantity
    })
    return m
  }, [availableCoupons])

  /** Với mỗi item trong availableCoupons, số lượng đã chọn "thuộc" về dòng này (phân bổ theo thứ tự) */
  const usedInRow = useMemo(() => {
    const assigned: Record<string, number> = {}
    return availableCoupons.map((item) => {
      const usedTotal = usedCountByCouponId[item.couponId] ?? 0
      const usedBefore = assigned[item.couponId] ?? 0
      const u = Math.min(item.quantity, Math.max(0, usedTotal - usedBefore))
      assigned[item.couponId] = usedBefore + u
      return u
    })
  }, [availableCoupons, usedCountByCouponId])

  const totalDiscount = useMemo(
    () =>
      calculateOrderCouponDiscount(
        byCouponId,
        selectedCouponIds,
        totalProductPrice,
        deliveryFee
      ),
    [byCouponId, selectedCouponIds, totalProductPrice, deliveryFee]
  )

  /** Giảm giá chỉ trên sản phẩm (PERCENT/AMOUNT). Dùng để tính giá còn lại và chặn thêm coupon khi còn 0. */
  const productDiscountFromCoupons = useMemo(
    () =>
      calculateProductCouponDiscount(
        byCouponId,
        selectedCouponIds,
        totalProductPrice
      ),
    [byCouponId, selectedCouponIds, totalProductPrice]
  )

  /** Giá sản phẩm còn lại sau coupon PERCENT/AMOUNT. Nếu ≤ 0 thì không cho áp thêm coupon PERCENT/AMOUNT. */
  const remainingProductAfterCoupon = Math.max(
    0,
    totalProductPrice - productDiscountFromCoupons
  )

  /** FREE_SHIPPING: tối đa 1 coupon trong đơn; khi chọn 1 thì bỏ hết FREE_SHIPPING khác */
  const selectedFreeShippingCount = useMemo(() => {
    return selectedCouponIds.filter(
      (id) => byCouponId.get(id)?.couponType === "FREE_SHIPPING"
    ).length
  }, [selectedCouponIds, byCouponId])

  /** Đặt số lượng sử dụng cho một coupon (0 ~ maxAvailable). FREE_SHIPPING max 1. */
  const setCouponQuantity = (couponId: string, count: number) => {
    const item = byCouponId.get(couponId)
    if (!item) return
    const isFreeShipping = item.couponType === "FREE_SHIPPING"
    const maxQty = isFreeShipping
      ? 1
      : Math.min(totalQuantityByCouponId[couponId] ?? 0, 999)
    const newCount = Math.max(0, Math.min(count, maxQty))
    let otherIds = selectedCouponIds.filter((id) => id !== couponId)
    if (isFreeShipping && newCount >= 1) {
      otherIds = otherIds.filter(
        (id) => byCouponId.get(id)?.couponType !== "FREE_SHIPPING"
      )
    }
    const newIds =
      newCount === 0
        ? otherIds
        : [...otherIds, ...Array.from({ length: newCount }, () => couponId)]
    onSelectedCouponIdsChange(newIds)
  }

  const handleIncrease = (couponId: string) => {
    const used = usedCountByCouponId[couponId] ?? 0
    const item = byCouponId.get(couponId)
    if (!item) return
    if (item.couponType === "FREE_SHIPPING") {
      if (used >= 1 || selectedFreeShippingCount >= 1) return
      setCouponQuantity(couponId, 1)
      return
    }
    /** PERCENT/AMOUNT: không cho thêm khi giá sản phẩm còn lại đã ≤ 0 */
    if (remainingProductAfterCoupon <= 0) return
    const totalForCoupon = totalQuantityByCouponId[couponId] ?? 0
    if (used >= totalForCoupon) return
    setCouponQuantity(couponId, used + 1)
  }

  const handleDecrease = (couponId: string) => {
    const used = usedCountByCouponId[couponId] ?? 0
    if (used <= 0) return
    setCouponQuantity(couponId, used - 1)
  }

  const totalQuantity = useMemo(
    () => availableCoupons.reduce((sum, item) => sum + item.quantity, 0),
    [availableCoupons]
  )

  return (
    <div className="border rounded-lg p-6">
      <button
        onClick={() => setDiscountExpanded(!discountExpanded)}
        className="flex items-center justify-between w-full mb-4"
      >
        <h2 className="text-lg font-semibold">할인/추가 결제</h2>
        {discountExpanded ? (
          <ChevronUp className="w-5 h-5" />
        ) : (
          <ChevronDown className="w-5 h-5" />
        )}
      </button>
      {discountExpanded && (
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm">쿠폰 할인 (주문 전체)</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              사용 가능한 쿠폰 {availableCoupons.length}장 (총 {totalQuantity}장)
            </p>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {availableCoupons.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                사용 가능한 쿠폰이 없습니다.
              </p>
            ) : (
              availableCoupons.map((item, index) => {
                const couponId = item.couponId
                const quantity = item.quantity
                const usedCount = usedInRow[index]
                const remaining = quantity - usedCount
                const isFreeShipping = item.couponType === "FREE_SHIPPING"
                const isPercent =
                  !isFreeShipping &&
                  item.discountRate != null &&
                  item.discountRate > 0
                const discountText = isFreeShipping
                  ? "무료 배송"
                  : isPercent
                    ? `${item.discountRate}% 할인`
                    : `${formatCurrency(item.discountAmount ?? 0)}원 할인`

                const now = Date.now()
                const startMs = item.startDate ? new Date(item.startDate).getTime() : 0
                const endMs = item.endDate ? new Date(item.endDate).getTime() : Infinity
                const isWithinDateRange = now >= startMs && now <= endMs

                /** PERCENT/AMOUNT: minPurchaseAmount và áp dụng chỉ dựa trên totalProductPrice; khi giá còn 0 không cho thêm. */
                const meetsMin =
                  !item.minPurchaseAmount ||
                  totalProductPrice >= item.minPurchaseAmount
                const freeShippingAlreadyUsed =
                  isFreeShipping && selectedFreeShippingCount >= 1 && usedCount === 0
                const noRoomForProductCoupon =
                  !isFreeShipping && remainingProductAfterCoupon <= 0
                const canApply =
                  remaining > 0 &&
                  meetsMin &&
                  isWithinDateRange &&
                  !freeShippingAlreadyUsed &&
                  !noRoomForProductCoupon
                const isSelected = usedCount > 0
                const maxSelectable = isFreeShipping ? 1 : quantity

                const leftLabel = isFreeShipping
                  ? "무료 배송"
                  : isPercent
                    ? `${item.discountRate}%`
                    : `${formatCurrency(item.discountAmount ?? 0)}원`
                const displayName =
                  item.couponName ?? discountText

                return (
                  <div
                    key={`${couponId}-${item.issuedAt}-${index}`}
                    className={`flex rounded-xl border overflow-hidden ${
                      canApply
                        ? isSelected
                          ? "border-[#FF6B5A] bg-[#FF6B5A]/5"
                          : "border-[#FF6B5A] bg-white hover:bg-muted/30"
                        : "border-gray-300 bg-gray-100 opacity-60"
                    }`}
                  >
                    <div className="w-[24%] min-w-[90px] flex flex-col items-center justify-center bg-[#FF6B5A] text-white py-5 px-2 shrink-0">
                      <span className="text-xl font-bold leading-tight">{leftLabel}</span>
                      <span className="text-xs mt-0.5">할인</span>
                    </div>
                    <div className="flex-1 min-w-0 flex items-start justify-between gap-3 py-4 pl-4 pr-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground text-sm mb-0.5">
                          {displayName}
                        </p>
                        {item.couponCode != null && item.couponCode !== "" && (
                          <p className="text-xs text-muted-foreground mb-0.5">
                            코드: <span className="font-semibold text-foreground">{item.couponCode}</span>
                          </p>
                        )}
                        {item.maxDiscountAmount != null && item.maxDiscountAmount > 0 && (
                          <p className="text-xs text-muted-foreground mb-0.5">
                            최대 할인금액: {formatCurrency(item.maxDiscountAmount)}원
                          </p>
                        )}
                        <p
                          className={`text-xs mb-0.5 ${
                            !meetsMin && item.minPurchaseAmount > 0 ? "text-red-500" : "text-muted-foreground"
                          }`}
                        >
                          최소 주문금액: {formatCurrency(item.minPurchaseAmount)}원
                          {!meetsMin && item.minPurchaseAmount > 0 && " (미달)"}
                        </p>
                        {(item.startDate || item.endDate) && (
                          <p
                            className={`text-xs mb-0.5 ${
                              !isWithinDateRange ? "text-red-500" : "text-muted-foreground"
                            }`}
                          >
                            유효기간: {item.startDate ? formatDateYMD(item.startDate) : "—"} ~ {item.endDate ? formatDateYMD(item.endDate) : "—"}
                            {!isWithinDateRange && " (미사용 기간)"}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          발급일: {formatDateYMD(item.issuedAt)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          보유: {quantity}장
                          {isFreeShipping && " (1회만 적용 가능)"}
                          {remaining <= 0 && " (소진)"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          disabled={usedCount <= 0}
                          onClick={() => handleDecrease(couponId)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          min={0}
                          max={maxSelectable}
                          value={usedCount}
                          className="h-8 w-10 text-center px-1 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          readOnly={usedCount === 0 && !canApply}
                          onChange={(e) => {
                            const v = parseInt(e.target.value, 10)
                            if (!Number.isNaN(v) && v >= 0)
                              setCouponQuantity(couponId, Math.min(v, maxSelectable))
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          disabled={!canApply || usedCount >= maxSelectable}
                          onClick={() => handleIncrease(couponId)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <span className="text-sm font-medium">총 할인 금액</span>
            <span className="text-[#FF6B5A] font-semibold">
              -{formatCurrency(totalDiscount)} 원
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
