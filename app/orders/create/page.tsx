"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useCart } from "@/hooks/use-cart/cart.hook"
import { useUser } from "@/hooks/use-user/user.hook"
import { useOrder } from "@/hooks/use-order/order.hook"
import { usePayment } from "@/hooks/use-payment/payment.hook"
import { useToast } from "@/hooks/use-toast"
import { CreateShippingAddressDto } from "@/hooks/use-user/user.dto"
import {
  OrderCoupon,
  type OrderCouponItem,
  calculateOrderCouponDiscount,
  calculateOrderCouponDiscountBreakdown,
  calculateProductCouponDiscount,
} from "./components/order-coupon"
import { OrderAccumulatedBenefits } from "./components/order-accumulatedBenefits"
import { OrderPaymentMethod } from "./components/order-paymentMethod"
import { OrderDeliveryAddress } from "./components/order-deliveryAddress"
import { useTossPayments } from "@/hooks/use-toss-payment/toss-payment.hook"
import { PostalCodeButton } from "@/components/common/PostalCodeButton"
import { useTranslation } from 'react-i18next'

interface OrderItem {
  cartItemId?: string
  productId: string
  product: {
    id: string
    productName: string
    productCode: string
    salePrice: number
    imageRegistrationThumbnail: string
  }
  quantity: number
  salePrice: number
  cartId?: string
  deliveryInputFee?: number
}

const formatCurrency = (value: number) => {
  return value.toLocaleString('ko-KR')
}

export default function OrderCreatePage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { getMyCart } = useCart()
  const { getMyPoints, getMyInformation, addMyDeliveryAddress, getMyCoupons } = useUser()
  const { cancelOrderGroup } = useOrder()
  const { toast } = useToast()
  const { initializePayment, initializeDirectPayment } = usePayment()
  const { tossPayments, isLoading: isTossLoading, error: tossError, requestPayment } = useTossPayments()
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [directPay, setDirectPay] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userInfo, setUserInfo] = useState<{
    name: string
    email: string
    phoneNumber: string
  } | null>(null)
  const [points, setPoints] = useState<number>(0)
  const [pointsToUse, setPointsToUse] = useState<number>(0)
  const [membershipLevel, setMembershipLevel] = useState<string | null>(null)
  const [availableCoupons, setAvailableCoupons] = useState<OrderCouponItem[]>([])
  /** Coupon áp dụng cho toàn đơn: danh sách couponId (có thể trùng nếu dùng nhiều coupon cùng loại) */
  const [selectedCouponIds, setSelectedCouponIds] = useState<string[]>([])
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [isTermsConfirmed, setIsTermsConfirmed] = useState(false)
  const [selectedAddressId, setSelectedAddressId] = useState<string>("")
  const [isAddAddressDialogOpen, setIsAddAddressDialogOpen] = useState(false)
  const [addressRefreshTrigger, setAddressRefreshTrigger] = useState(0)
  const [isAddingAddress, setIsAddingAddress] = useState(false)
  const [addAddressFormData, setAddAddressFormData] = useState({
    deliveryAddress: "",
    recipientName: "",
    phoneNumber: "",
    postalCode: "",
    address: "",
    addressFull: "",
    setAsDefault: false,
  })

  useEffect(() => {
    const loadOrderData = async () => {
      try {
        setLoading(true)
        
        // Load order items from localStorage (shape: { items, directPay } or legacy array)
        const savedItems = localStorage.getItem('pendingOrderItems')
        if (savedItems) {
          const parsed = JSON.parse(savedItems)
          const isLegacy = Array.isArray(parsed)
          const items: OrderItem[] = isLegacy ? parsed : (parsed.items ?? [])
          const isDirectPay = isLegacy ? false : Boolean(parsed.directPay)
          setDirectPay(isDirectPay)

          if (isDirectPay) {
            // Direct pay: no cart validation, use items as-is and get user from profile
            setOrderItems(items)
            try {
              const _userInfo = await getMyInformation()
              if (_userInfo) {
                setUserInfo({
                  name: _userInfo.name ?? '',
                  email: _userInfo.email ?? '',
                  phoneNumber: _userInfo.phoneNumber ?? '',
                })
              }
            } catch (e) {
              console.error('Error loading user for direct pay:', e)
            }
            localStorage.setItem('pendingOrderItems', JSON.stringify({ items, directPay: true }))
          } else {
            // Cart flow: verify items exist in cart
            const cartData = await getMyCart()
            const validItems = items.filter((item) =>
              item.cartItemId && cartData.cartItems?.some((cartItem: any) => cartItem.id === item.cartItemId)
            )
            if (validItems.length === 0) {
              router.push('/cart')
              return
            }
            const updatedItems = validItems.map((item) => {
              const cartItem = cartData.cartItems.find((ci: any) => ci.id === item.cartItemId)
              return {
                ...item,
                product: cartItem?.product || item.product,
                salePrice: cartItem?.salePrice || item.salePrice,
                deliveryInputFee: item.deliveryInputFee !== undefined && item.deliveryInputFee !== null
                  ? Number(item.deliveryInputFee) || 0
                  : (cartItem?.product?.deliveryFeeInput ? Number(cartItem.product.deliveryFeeInput) || 0 : 0),
              }
            })
            setOrderItems(updatedItems)
            localStorage.setItem('pendingOrderItems', JSON.stringify({ items: updatedItems, directPay: false }))
            if (cartData.user) {
              setUserInfo({
                name: cartData.user.name || '',
                email: cartData.user.email || '',
                phoneNumber: cartData.user.phoneNumber || '',
              })
            }
          }
        } else {
          router.push('/cart')
        }

        // Load user points and membership
        try {
          // Get points
          const pointsData = await getMyPoints() 
          setPoints(pointsData?.user?.availablePoints || 0)
          
          const _userInfo = await getMyInformation()
          setMembershipLevel(_userInfo?.membershipLevel ?? _userInfo?.membership?.name ?? null)
        } catch (error) {
          console.error('Error loading user data:', error)
          setPoints(0)
          setMembershipLevel(null)
        }

        // Load user's available coupons (getMyCoupons)
        try {
          const couponsData = await getMyCoupons()
          setAvailableCoupons(couponsData?.availableCoupons ?? [])
        } catch (error) {
          console.error('Error loading coupons:', error)
          setAvailableCoupons([])
        }
      } catch (error) {
        console.error('Error loading order data:', error)
        router.push('/cart')
      } finally {
        setLoading(false)
      }
    }

    loadOrderData()
  }, [getMyCart, getMyPoints, getMyInformation, getMyCoupons, router])

  // Cancel abandoned order when user returns (reload/closed Toss tab without completing)
  useEffect(() => {
    const cancelAbandonedOrder = async () => {
      const orderGroupNumber = localStorage.getItem("pendingOrderGroupNumber")
      const pendingAt = localStorage.getItem("pendingOrderGroupAt")
      if (!orderGroupNumber) return
      // Only cancel if pending for at least 1 second (avoid race with redirect to Toss)
      const elapsed = pendingAt ? Date.now() - parseInt(pendingAt, 10) : 0
      if (elapsed < 1000) return
      try {
        await cancelOrderGroup(orderGroupNumber)
      } catch (e) {
        console.error("Failed to cancel abandoned order:", e)
      } finally {
        localStorage.removeItem("pendingOrderGroupNumber")
        localStorage.removeItem("pendingOrderGroupAt")
        localStorage.removeItem("pendingPaymentToken")
      }
    }

    cancelAbandonedOrder()

    // When user switches back to this tab after closing Toss (e.g. Toss opened in new tab)
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        cancelAbandonedOrder()
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange)
    return () => document.removeEventListener("visibilitychange", onVisibilityChange)
  }, [cancelOrderGroup])

  const productAmount = useMemo(() => {
    return orderItems.reduce(
      (sum, item) => {
        const price = Number(item.salePrice) || 0
        const qty = Number(item.quantity) || 0
        return sum + (price * qty)
      },
      0
    )
  }, [orderItems])

  const shippingCost = useMemo(() => {
    return orderItems.reduce(
      (sum, item) => {
        const fee = Number(item.deliveryInputFee) || 0
        return sum + fee
      },
      0
    )
  }, [orderItems])

  const orderSubtotal = useMemo(
    () => productAmount + shippingCost,
    [productAmount, shippingCost]
  )

  const byCouponId = useMemo(() => {
    const map = new Map<string, OrderCouponItem>()
    availableCoupons.forEach((item) => {
      if (!map.has(item.couponId)) map.set(item.couponId, item)
    })
    return map
  }, [availableCoupons])

  const totalCouponDiscount = useMemo(
    () =>
      calculateOrderCouponDiscount(
        byCouponId,
        selectedCouponIds,
        productAmount,
        shippingCost
      ),
    [byCouponId, selectedCouponIds, productAmount, shippingCost]
  )

  /** Giảm giá coupon tách riêng: sản phẩm (PERCENT/AMOUNT) và ship (FREE_SHIPPING). */
  const couponDiscountBreakdown = useMemo(
    () =>
      calculateOrderCouponDiscountBreakdown(
        byCouponId,
        selectedCouponIds,
        productAmount,
        shippingCost
      ),
    [byCouponId, selectedCouponIds, productAmount, shippingCost]
  )

  /** Giảm giá coupon chỉ trên sản phẩm (PERCENT/AMOUNT). Point chỉ áp dụng cho phần tiền sản phẩm còn lại. */
  const productDiscountFromCoupons = useMemo(
    () =>
      calculateProductCouponDiscount(
        byCouponId,
        selectedCouponIds,
        productAmount
      ),
    [byCouponId, selectedCouponIds, productAmount]
  )

  /** Số tiền sản phẩm còn lại sau coupon; point tối đa bằng giá trị này. */
  const maxPointsUsable = Math.max(
    0,
    productAmount - productDiscountFromCoupons
  )

  /** Point chỉ trừ tối đa bằng tiền sản phẩm còn lại sau coupon. */
  const effectivePointsToUse = Math.min(pointsToUse, maxPointsUsable)

  // Calculate final total amount after discounts (có thể âm nếu giảm giá > tổng đơn)
  const totalOrderAmount = useMemo(() => {
    const productAmt = Number(productAmount) || 0
    const shipping = Number(shippingCost) || 0
    const couponDisc = Number(totalCouponDiscount) || 0
    const points = Number(effectivePointsToUse) || 0
    const subtotal = productAmt + shipping
    const discount = couponDisc + points
    return subtotal - discount
  }, [productAmount, shippingCost, totalCouponDiscount, effectivePointsToUse])

  const handleAddAddress = async () => {
    if (!addAddressFormData.deliveryAddress.trim()) {
      toast({ title: "오류", description: t('key172', '배송지명을 입력해주세요'), variant: "destructive" })
      return
    }
    if (!addAddressFormData.recipientName.trim()) {
      toast({ title: "오류", description: t('key173', '받는 사람 이름을 입력해주세요'), variant: "destructive" })
      return
    }
    if (!addAddressFormData.phoneNumber.trim()) {
      toast({ title: "오류", description: t('key174', '연락처를 입력해주세요'), variant: "destructive" })
      return
    }
    if (!addAddressFormData.postalCode.trim()) {
      toast({ title: "오류", description: t('key175', '우편번호를 입력해주세요'), variant: "destructive" })
      return
    }
    if (!addAddressFormData.address.trim()) {
      toast({ title: "오류", description: t('key176', '주소를 입력해주세요'), variant: "destructive" })
      return
    }
    try {
      setIsAddingAddress(true)
      const dto: CreateShippingAddressDto = {
        deliveryAddress: addAddressFormData.deliveryAddress.trim(),
        recipientName: addAddressFormData.recipientName.trim(),
        phoneNumber: addAddressFormData.phoneNumber.trim(),
        postalCode: parseInt(addAddressFormData.postalCode) || 0,
        address: addAddressFormData.address.trim(),
        addressFull: addAddressFormData.addressFull.trim(),
        setAsDefault: addAddressFormData.setAsDefault,
      }
      await addMyDeliveryAddress(dto)
      toast({ title: "성공", description: t('key177', '배송지 주소가 성공적으로 추가되었습니다') })
      setIsAddAddressDialogOpen(false)
      setAddAddressFormData({
        deliveryAddress: "",
        recipientName: "",
        phoneNumber: "",
        postalCode: "",
        address: "",
        addressFull: "",
        setAsDefault: false,
      })
      setAddressRefreshTrigger((t) => t + 1)
    } catch (error: any) {
      console.error("Error adding address:", error)
      toast({
        title: "오류",
        description: error?.response?.data?.message || t('key178', '배송지 주소 추가에 실패했습니다'),
        variant: "destructive",
      })
    } finally {
      setIsAddingAddress(false)
    }
  }

  const handlePaymentInitiate = async () => {
    // Validate terms confirmation
    if (!isTermsConfirmed) {
      alert('주문 확인 및 결제 동의를 해주세요.')
      return
    }

    // Validate delivery address
    if (!selectedAddressId) {
      alert('배송 주소를 선택해주세요.')
      return
    }

    if (!tossPayments || isTossLoading) {
      console.error('TossPayments is not ready yet')
      return
    }
    if (tossError) {
      console.error('TossPayments initialization error:', tossError)
      alert('결제 시스템을 불러오는데 실패했습니다. 페이지를 새로고침해주세요.')
      return
    }

    try {
      setIsProcessingPayment(true)
      const couponIdCount: Record<string, number> = {}
      selectedCouponIds.forEach((id) => {
        couponIdCount[id] = (couponIdCount[id] ?? 0) + 1
      })
      const couponIds = Object.entries(couponIdCount).map(([couponId, quantity]) => ({
        couponId,
        quantity,
      }))
      const couponPayload = couponIds.map(({ couponId, quantity }) => ({ couponId, quantity }))

      const paymentData = directPay
        ? await initializeDirectPayment({
            productId: orderItems[0].productId,
            quantity: orderItems[0].quantity,
            coupons: couponPayload,
            points: effectivePointsToUse > 0 ? effectivePointsToUse : undefined,
            deliveryFee: shippingCost,
            userShippingAddressId: selectedAddressId,
          })
        : await initializePayment({
            cartItemIds: orderItems.map((item) => item.cartItemId!).filter(Boolean),
            coupons: couponPayload,
            points: effectivePointsToUse > 0 ? effectivePointsToUse : undefined,
            deliveryFee: shippingCost,
            userShippingAddressId: selectedAddressId,
          })
      const { orderId, customerKey, deliveryFee, paymentToken } = paymentData

      if (!directPay) {
        localStorage.setItem("pendingCartItemIds", JSON.stringify(orderItems.map((item) => item.cartItemId)))
      }
      localStorage.setItem("pendingOrderCoupons", JSON.stringify(couponIds))
      localStorage.setItem("pendingOrderGroupNumber", orderId)
      localStorage.setItem("pendingOrderGroupAt", Date.now().toString())
      localStorage.setItem("pendingPaymentToken", paymentToken)

      // Use the hook's requestPayment method
      // After successful payment, Toss will redirect to successUrl with paymentKey, orderId, and amount as query parameters
      // onPaymentAborted: gọi khi user đóng/reload trang Toss (SDK reject)
      await requestPayment('카드', {
        orderId: orderId,
        amount: totalOrderAmount,
        orderName: '주문 결제',
        customerKey: customerKey,
        customerName: userInfo?.name,
        deliveryFee: deliveryFee,
        successUrl: `${window.location.origin}/orders/create/success`,
        failUrl: `${window.location.origin}/orders/create/fail`,
        onPaymentAborted: async (abortedOrderId) => {
          try {
            await cancelOrderGroup(abortedOrderId);
          } catch (e) {
            console.error('Failed to cancel order group:', e);
          } finally {
            localStorage.removeItem('pendingOrderGroupNumber');
            localStorage.removeItem('pendingOrderGroupAt');
            localStorage.removeItem('pendingPaymentToken');
          }
        },
      });
    } catch (error) {
      console.error('Payment initialization failed:', error);
      alert('결제 처리 중 오류가 발생했습니다. 다시 시도해주세요.')
      router.push('/');
    } finally {
      setIsProcessingPayment(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-white py-4 px-4">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-lg font-medium">{t('key179', '주문/결제')}</h1>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t('key180', '주문 정보를 불러오는 중...')}</p>
          </div>
        </div>
      </div>
    )
  }

  if (orderItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-white py-4 px-4">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-lg font-medium">{t('key179', '주문/결제')}</h1>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t('key181', '주문할 상품이 없습니다. 장바구니로 이동합니다...')}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Page Title */}
      <div className="bg-white py-4 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-lg font-medium">{t('key179', '주문/결제')}</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Product */}
            <div className="border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">{t('key182', '주문 상품')}</h2>
              <div className="space-y-4">
                {orderItems.map((item, index) => {
                  const itemTotal = item.salePrice * item.quantity
                  return (
                    <div key={item.cartItemId ?? `${item.productId}-${index}`} className="flex gap-4">
                      <div className="relative w-20 h-20 shrink-0 rounded-md overflow-hidden bg-muted">
                        <Image
                          src={item.product.imageRegistrationThumbnail || '/placeholder.svg'}
                          alt={item.product.productName}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium mb-1">{item.product.productName}</h3>
                        <p className="text-sm text-muted-foreground mb-1">{t('key183', '옵션:')}</p>
                        <p className="text-sm text-muted-foreground">{item.product.productCode}</p>
                        <p className="text-sm text-muted-foreground mt-1">{t('quantity', '수량: {{quantity}}', { quantity: item.quantity })}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(itemTotal)} <span className="text-sm text-muted-foreground">원</span></p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Orderer Information */}
            <div className="border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">{t('key184', '주문자 정보')}</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground mb-1">{t('key79', '이름')}</Label>
                  <Input value={userInfo?.name || ''} readOnly className="bg-muted/50" />
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground mb-1">{t('key80', '이메일')}</Label>
                  <Input value={userInfo?.email || ''} readOnly className="bg-muted/50" />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-sm text-muted-foreground mb-1">{t('key185', '전화번호')}</Label>
                  <Input value={userInfo?.phoneNumber || ''} readOnly className="bg-muted/50" />
                </div>
              </div>
            </div>

            {/* Delivery Address Information */}
            <OrderDeliveryAddress
              onSelectedAddressChange={setSelectedAddressId}
              onAddNewAddressClick={() => setIsAddAddressDialogOpen(true)}
              refreshTrigger={addressRefreshTrigger}
            />

            {/* Redeem Points */}
            <div className="border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">{t('key186', '포인트 사용')}</h2>
              <div className="flex gap-2 mb-2">
                <Input 
                  type="number" 
                  placeholder="0" 
                  min={0}
                  max={points}
                  className="flex-1"
                  value={pointsToUse}
                  onChange={(e) => {
                    const raw = e.target.value
                    if (raw === "" || raw === undefined) {
                      setPointsToUse(0)
                      return
                    }
                    const value = parseInt(raw, 10)
                    if (!Number.isNaN(value) && value >= 0) {
                      setPointsToUse(Math.min(value, points))
                    }
                  }}
                />
                <Button 
                  variant="outline"
                  onClick={() =>
                    setPointsToUse(Math.min(points, maxPointsUsable))
                  }
                >
                  {t('key187', '전액 사용')}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">{t('key188', '보유 포인트:')}</p>
              <p className="text-sm font-medium">{formatCurrency(points)}P</p>
            </div>

            {/* Discount/Additional Payment - 쿠폰 áp dụng cho toàn đơn */}
            <OrderCoupon
              availableCoupons={availableCoupons}
              formatCurrency={formatCurrency}
              totalProductPrice={productAmount}
              deliveryFee={shippingCost}
              selectedCouponIds={selectedCouponIds}
              onSelectedCouponIdsChange={setSelectedCouponIds}
            />

            {/* Accumulated Benefits */}
            <OrderAccumulatedBenefits
              membershipLevel={membershipLevel}
              totalOrderAmount={totalOrderAmount}
              points={points}
              pointsToUse={effectivePointsToUse}
            />

            {/* Payment Method */}
            {/* <OrderPaymentMethod /> */}

            {/* Confirmation Checkbox */}
            <div className="flex items-start space-x-2">
              <Checkbox 
                id="terms" 
                checked={isTermsConfirmed}
                onCheckedChange={(checked) => setIsTermsConfirmed(checked as boolean)}
              />
              <label
                htmlFor="terms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {t('key189', '주문 내용을 확인하였으며, 결제에 동의합니다')}
              </label>
            </div>
          </div>

          {/* Right Column - Payment Summary */}
          <div className="lg:col-span-1">
            <div className="border rounded-lg p-6 sticky top-4">
              <h2 className="text-lg font-semibold mb-4">{t('key190', '최종 결제 금액')}</h2>
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('key191', '상품 금액')}</span>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(productAmount)} <span className="text-muted-foreground">원</span></p>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('key192', '배송비')}</span>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(shippingCost)} <span className="text-muted-foreground">원</span></p>
                  </div>
                </div>
                {couponDiscountBreakdown.productDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('key193', '쿠폰 할인')}</span>
                    <div className="text-right">
                      <p className="font-medium text-[#FF6B5A]">-{formatCurrency(couponDiscountBreakdown.productDiscount)} <span className="text-muted-foreground">원</span></p>
                    </div>
                  </div>
                )}
                {couponDiscountBreakdown.shippingDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('key194', '무료 배송 할인')}</span>
                    <div className="text-right">
                      <p className="font-medium text-[#FF6B5A]">-{formatCurrency(couponDiscountBreakdown.shippingDiscount)} <span className="text-muted-foreground">원</span></p>
                    </div>
                  </div>
                )}
                {effectivePointsToUse > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('key186', '포인트 사용')}</span>
                    <div className="text-right">
                      <p className="font-medium text-[#FF6B5A]">-{formatCurrency(effectivePointsToUse)} <span className="text-muted-foreground">원</span></p>
                    </div>
                  </div>
                )}
                <div className="pt-3 border-t">
                  <div className="flex justify-between font-semibold mb-1">
                    <span>{t('key195', '총 결제 금액')}</span>
                    <div className="text-right">
                      <p className="text-[#FF6B5A]">{formatCurrency(totalOrderAmount)} <span className="text-[#FF6B5A] text-sm">원</span></p>
                    </div>
                  </div>
                </div>
              </div>
              <Button 
                onClick={handlePaymentInitiate} 
                className="w-full bg-[#FF6B5A] hover:bg-[#FF6B5A]/90 text-white"
                disabled={isTossLoading || isProcessingPayment || !!tossError}
              >
                {isTossLoading ? t('key196', '결제 시스템 로딩 중...') : isProcessingPayment ? t('key197', '처리 중...') : '결제하기'}
              </Button>
              {tossError && (
                <p className="text-sm text-red-500 mt-2">
                  {t('key198', '결제 시스템 오류가 발생했습니다. 페이지를 새로고침해주세요.')}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Address Dialog */}
      <Dialog open={isAddAddressDialogOpen} onOpenChange={setIsAddAddressDialogOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">{t('key199', '새 배송지 추가')}</DialogTitle>
            <DialogDescription className="text-gray-500">
              {t('key200', '새로운 배송지를 추가합니다.')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="deliveryAddress" className="text-base font-normal">
                {t('key201', '배송지명')}
              </Label>
              <Input
                id="deliveryAddress"
                placeholder={t('key202', '예: 집, 회사')}
                className="bg-gray-50"
                value={addAddressFormData.deliveryAddress}
                onChange={(e) =>
                  setAddAddressFormData({ ...addAddressFormData, deliveryAddress: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="recipientName" className="text-base font-normal">
                {t('key203', '받는 사람')}
              </Label>
              <Input
                id="recipientName"
                placeholder={t('key204', '받는 사람 이름')}
                className="bg-gray-50"
                value={addAddressFormData.recipientName}
                onChange={(e) =>
                  setAddAddressFormData({ ...addAddressFormData, recipientName: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phoneNumber" className="text-base font-normal">
                {t('key205', '연락처')}
              </Label>
              <Input
                id="phoneNumber"
                placeholder="010-0000-0000"
                className="bg-gray-50"
                value={addAddressFormData.phoneNumber}
                onChange={(e) =>
                  setAddAddressFormData({ ...addAddressFormData, phoneNumber: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="postalCode" className="text-base font-normal">
                {t('key206', '우편번호')}
              </Label>
              <div className="flex gap-2 items-stretch [&_button]:h-9 [&_button]:flex [&_button]:items-center [&_button]:py-0 [&_button]:shrink-0">
                <Input
                  id="postalCode"
                  placeholder="우편번호"
                  className="h-9 bg-gray-50 flex-1 min-w-0"
                  disabled
                  value={addAddressFormData.postalCode}
                  onChange={(e) =>
                    setAddAddressFormData({ ...addAddressFormData, postalCode: e.target.value })
                  }
                />
                <PostalCodeButton
                  onComplete={(data) => {
                    setAddAddressFormData({
                      ...addAddressFormData,
                      postalCode: data.zipCode,
                      address: data.addressName,
                    })
                  }}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address" className="text-base font-normal">
                {t('key207', '주소')}
              </Label>
              <Input
                id="address"
                placeholder="주소"
                className="bg-gray-50"
                disabled
                value={addAddressFormData.address}
                onChange={(e) =>
                  setAddAddressFormData({ ...addAddressFormData, address: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="addressFull" className="text-base font-normal">
                {t('key208', '상세 주소')}
              </Label>
              <Input
                id="addressFull"
                placeholder={t('key209', '상세 주소 (동/호수 등)')}
                className="bg-gray-50"
                value={addAddressFormData.addressFull}
                onChange={(e) =>
                  setAddAddressFormData({ ...addAddressFormData, addressFull: e.target.value })
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="setAsDefault"
                aria-label={t('key210', '기본 배송지로 설정')}
                className="w-5 h-5 rounded border-gray-300"
                checked={addAddressFormData.setAsDefault}
                onChange={(e) =>
                  setAddAddressFormData({ ...addAddressFormData, setAsDefault: e.target.checked })
                }
              />
              <Label htmlFor="setAsDefault" className="text-base font-normal cursor-pointer">
                {t('key210', '기본 배송지로 설정')}
              </Label>
            </div>
          </div>
          <DialogFooter className="flex gap-4 pt-4">
            <Button
              type="button"
              className="flex-1 bg-[#ff5833] hover:bg-[#e64d2e] text-white h-12"
              onClick={handleAddAddress}
              disabled={isAddingAddress}
            >
              {isAddingAddress ? t('key211', '추가 중...') : "추가"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-12"
              onClick={() => setIsAddAddressDialogOpen(false)}
              disabled={isAddingAddress}
            >
              {t('key212', '취소')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

