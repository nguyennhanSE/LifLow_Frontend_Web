"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Package2, Loader2 } from "lucide-react"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useOrder } from "@/hooks/use-order/order.hook"
import { Order, EOrderSituation, OrderGroup } from "@/entities/orders/order.entity"
import { useTranslation } from 'react-i18next'
import i18next from 'i18next'

// Helper function to map order situation to display text
const getOrderStatusText = (situation?: EOrderSituation | null): string => {
  const statusMap: Record<EOrderSituation, string> = {
    [EOrderSituation.ORDER_PAYMENT_PENDING]: "결제 대기",
    [EOrderSituation.ORDER_PAYMENT_COMPLETED]: "결제 완료",
    [EOrderSituation.ORDER_BEING_SHIPPED]: "배송 중",
    [EOrderSituation.ORDER_SHIPPED]: "배송 완료",
    [EOrderSituation.ORDER_CANCELLED]: "취소됨",
    [EOrderSituation.ORDER_RETURNED]: "반품됨",
  }
  return situation ? statusMap[situation] : i18next.t('key258', '알 수 없음')
}

// Helper function to check if status should have badge styling
const isHighlightedStatus = (situation?: EOrderSituation | null): boolean => {
  return situation
    ? [
        EOrderSituation.ORDER_BEING_SHIPPED,
        EOrderSituation.ORDER_SHIPPED,
      ].includes(situation)
    : false
}

// Helper function to format date
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// Helper function to format currency
const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "0"
  }
  return amount.toLocaleString("ko-KR")
}

// Helper function to parse image URL from imageRegistrationThumbnail
const parseImageUrl = (imageString: string | null | undefined): string | null => {
  if (!imageString) return null
  
  try {
    // Try parsing as JSON first (could be array or object)
    const parsed = JSON.parse(imageString)
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed[0]
    }
    if (typeof parsed === 'string') {
      return parsed
    }
    return null
  } catch {
    // If not JSON, treat as direct URL string
    const trimmed = imageString.trim()
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) {
      return trimmed
    }
    // If comma-separated, take first one
    if (trimmed.includes(',')) {
      return trimmed.split(',')[0].trim()
    }
    return trimmed
  }
}

export default function OrderDetailPage() {
  const { t } = useTranslation()
  const params = useParams()
  const router = useRouter()
  const orderGroupNumber = params.id as string
  const { getOrderGroupByOrderGroupNumber } = useOrder()
  
  const [orderGroup, setOrderGroup] = useState<OrderGroup | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (orderGroupNumber) {
      fetchOrderDetail()
    }
  }, [orderGroupNumber])

  const fetchOrderDetail = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getOrderGroupByOrderGroupNumber(orderGroupNumber)
      setOrderGroup(data)
    } catch (err) {
      console.error("Failed to fetch order detail:", err)
      setError("주문 정보를 불러오지 못했습니다")
    } finally {
      setLoading(false)
    }
  }

  const handleBackToList = () => {
    router.push("/my-page/orders")
  }

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (error || !orderGroup) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <Package2 className="size-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">{t('key617', '주문을 찾을 수 없습니다')}</h3>
          <p className="text-muted-foreground mb-4">{error || t('key618', '찾으시는 주문이 존재하지 않습니다')}</p>
          <Button onClick={handleBackToList}>{t('key619', '주문 목록으로')}</Button>
        </div>
      </div>
    )
  }

  const orders = orderGroup.orders || []
  const firstOrder = orders[0]
  const orderDate = firstOrder?.orderDate || orderGroup.createdAt?.toString() || ""

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        className="mb-6 -ml-2 hover:bg-transparent"
        onClick={handleBackToList}
      >
        <ArrowLeft className="size-4 mr-2" />
        {t('key619', '주문 목록으로')}
      </Button>

      {/* Page Title */}
      <h1 className="text-2xl font-semibold mb-6">{t('key274', '주문 상세')}</h1>

      <div className="space-y-4">
        {/* Ordering Information */}
        <Card className="p-6">
          <h2 className="text-base font-medium mb-4">{t('key620', '주문 정보')}</h2>
          
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <Package2 className="size-5 text-muted-foreground" />
              <div>
                <h3 className="font-semibold text-lg">{orderGroup.orderGroupNumber || orderGroup.orderGroupName}</h3>
                {orderDate && (
                  <p className="text-sm text-muted-foreground">{formatDate(orderDate)}</p>
                )}
              </div>
            </div>
            <span
              className={
                isHighlightedStatus(orderGroup.situation)
                  ? "px-3 py-1 bg-[#ff5833] text-white text-sm rounded"
                  : "px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded"
              }
            >
              {getOrderStatusText(orderGroup.situation)}
            </span>
          </div>

          {firstOrder && (
            <div className="grid grid-cols-3 gap-6 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">{t('key409', '주문자')}</p>
                <p className="font-medium">{firstOrder.ordererName || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">{t('key205', '연락처')}</p>
                <p className="font-medium">{firstOrder.ordererMobilePhone || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">{t('key80', '이메일')}</p>
                <p className="font-medium">{orderGroup.user?.email || "-"}</p>
              </div>
            </div>
          )}
        </Card>

        {/* Order Products */}
        <Card className="p-6">
          <h2 className="text-base font-medium mb-4">{t('key182', '주문 상품')}</h2>
          
          {orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order) => {
                const productImageUrl = parseImageUrl(order.product?.imageRegistrationThumbnail)
                return (
                  <div key={order.id} className="flex items-start justify-between pb-4 border-b last:border-0 last:pb-0">
                    <div className="flex gap-4">
                      <div className="relative h-20 w-20 shrink-0 bg-muted rounded-md overflow-hidden">
                        {productImageUrl ? (
                          <Image
                            src={productImageUrl}
                            alt={order.productName || "상품"}
                            fill
                            className="object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = '/placeholder.svg'
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                            {t('key320', '이미지 없음')}
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium mb-2">
                          {order.productNameWithOptions || order.productName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(order.salePrice)}{t('key269', '원 ×')} {order.quantity || 0}개
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">{formatCurrency((order.salePrice || 0) * (order.quantity || 0))}</p>
                      <p className="text-sm text-muted-foreground">원</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-muted-foreground">{t('key621', '주문 상품이 없습니다')}</p>
          )}
        </Card>

        {/* Shipping Information */}
        {firstOrder && (
          <Card className="p-6">
            <h2 className="text-base font-medium mb-4">{t('key622', '배송 정보')}</h2>
            
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">{t('key623', '수령인')}</p>
                <p className="font-medium">{firstOrder.recipient || "-"}</p>
              </div>
              
              <div>
                <p className="text-muted-foreground mb-1">{t('key205', '연락처')}</p>
                <p className="font-medium">{firstOrder.recipientMobilePhone || "-"}</p>
                {firstOrder.recipientPhoneNumber && (
                  <p className="font-medium">{firstOrder.recipientPhoneNumber}</p>
                )}
              </div>
              
              <div>
                <p className="text-muted-foreground mb-1">{t('key624', '배송 주소')}</p>
                <p className="font-medium">
                  ({firstOrder.recipientPostalCode || ""}) {firstOrder.recipientAddressFull || "-"}
                </p>
              </div>

              {firstOrder.deliveryMessage && (
                <div>
                  <p className="text-muted-foreground mb-1">{t('key625', '배송 메시지')}</p>
                  <p className="font-medium">{firstOrder.deliveryMessage}</p>
                </div>
              )}

              {firstOrder.desiredDeliveryDate && (
                <div>
                  <p className="text-muted-foreground mb-1">{t('key626', '희망 배송일')}</p>
                  <p className="font-medium">{formatDate(firstOrder.desiredDeliveryDate)}</p>
                </div>
              )}
            </div>

            {/* Courier Information (if available) */}
            {orderGroup.courierCompany && (
              <div className="mt-6 pt-6 border-t space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('key419', '택배사')}</span>
                  <span className="font-medium">{orderGroup.courierCompany}</span>
                </div>
                {orderGroup.invoiceNumber && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('key627', '송장 번호')}</span>
                    <span className="font-medium">{orderGroup.invoiceNumber}</span>
                  </div>
                )}
              </div>
            )}
          </Card>
        )}

        {/* Payment Information */}
        <Card className="p-6">
          <h2 className="text-base font-medium mb-4">{t('key575', '결제 정보')}</h2>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('key191', '상품 금액')}</span>
              <span className="font-medium">{formatCurrency(orderGroup.originalAmount)}원</span>
            </div>
            
            {(orderGroup.discountAmount ?? 0) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('key246', '할인')}</span>
                <span className="font-medium text-red-600">-{formatCurrency(orderGroup.discountAmount)}원</span>
              </div>
            )}

            {(orderGroup.pointsUsed ?? 0) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('key615', '사용 포인트')}</span>
                <span className="font-medium text-blue-600">-{formatCurrency(orderGroup.pointsUsed)}원</span>
              </div>
            )}
            
            {orderGroup.deliveryFee !== undefined && orderGroup.deliveryFee !== null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('key192', '배송비')}</span>
                <span className="font-medium">{orderGroup.deliveryFee > 0 ? `${formatCurrency(orderGroup.deliveryFee)}원` : "무료"}</span>
              </div>
            )}

            <div className="pt-3 border-t">
              <div className="flex justify-between items-center">
                <span className="font-medium">{t('key190', '최종 결제 금액')}</span>
                <div className="text-right">
                  <p className="text-2xl font-bold text-[#ff5833]">
                    {formatCurrency(orderGroup.finalAmount || orderGroup.originalAmount)}
                  </p>
                  <p className="text-sm text-[#ff5833]">원</p>
                </div>
              </div>
            </div>

            {firstOrder?.paymentMethod && (
              <div className="flex justify-between pt-3 border-t">
                <span className="text-muted-foreground">{t('key601', '결제 수단')}</span>
                <span className="font-medium">{firstOrder.paymentMethod}</span>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

