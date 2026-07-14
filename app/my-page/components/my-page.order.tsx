"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Package, Loader2 } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useOrder } from "@/hooks/use-order/order.hook"
import { usePayment } from "@/hooks/use-payment/payment.hook"
import { Order, EOrderSituation, OrderGroup } from "@/entities/orders/order.entity"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from 'react-i18next'
import i18next from 'i18next'

// Helper function to map order situation to display text
const getOrderStatusText = (situation?: EOrderSituation | null): string => {
  const statusMap: Record<EOrderSituation, string> = {
    [EOrderSituation.ORDER_PAYMENT_FAILED]: "결제 실패",
    [EOrderSituation.ORDER_PAYMENT_PENDING]: "결제 대기",
    [EOrderSituation.ORDER_PAYMENT_COMPLETED]: "결제 완료",
    [EOrderSituation.ORDER_BEING_SHIPPED]: "배송 중",
    [EOrderSituation.ORDER_SHIPPED]: "배송 완료",
    [EOrderSituation.ORDER_CANCELLED]: "주문 취소",
    [EOrderSituation.ORDER_RETURNED]: "반품",
  }
  return situation ? statusMap[situation] : i18next.t('key258', '알 수 없음')
}

// Helper function to check if status should have badge styling
const isHighlightedStatus = (situation?: EOrderSituation | null): boolean => {
  return situation ? [
    EOrderSituation.ORDER_CANCELLED,
    EOrderSituation.ORDER_BEING_SHIPPED,
    EOrderSituation.ORDER_SHIPPED,
    EOrderSituation.ORDER_PAYMENT_FAILED,
  ].includes(situation) : false
}

// Helper function to format date
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
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

export default function MyPageOrder() {
  const { t } = useTranslation()
  const router = useRouter()
  const { getMyOrders } = useOrder()
  const { cancelPayment, returnPayment } = usePayment()
  const { toast } = useToast()
  const [orderGroups, setOrderGroups] = useState<OrderGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [cancelingOrderGroup, setCancelingOrderGroup] = useState<OrderGroup | null>(null)
  const [isCanceling, setIsCanceling] = useState(false)
  const [returnDialogOpen, setReturnDialogOpen] = useState(false)
  const [returnReason, setReturnReason] = useState("")
  const [returningOrderGroup, setReturningOrderGroup] = useState<OrderGroup | null>(null)
  const [isReturning, setIsReturning] = useState(false)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const data = await getMyOrders()
      setOrderGroups(data)
    } catch (error) {
      console.error("Failed to fetch orders:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewOrderDetail = (orderGroupNumber: string) => {
    router.push(`/my-page/orders/${orderGroupNumber}`)
  }

  const handleCancelOrder = (orderGroupNumber: string) => {
    // TODO: Implement cancel order functionality
    console.log("Cancel order group:", orderGroupNumber)
  }

  const openCancelDialog = (orderGroup: OrderGroup) => {
    setCancelingOrderGroup(orderGroup)
    setCancelReason("")
    setCancelDialogOpen(true)
  }

  const closeCancelDialog = () => {
    setCancelDialogOpen(false)
    setCancelingOrderGroup(null)
    setCancelReason("")
  }

  const openReturnDialog = (orderGroup: OrderGroup) => {
    setReturningOrderGroup(orderGroup)
    setReturnReason("")
    setReturnDialogOpen(true)
  }

  const closeReturnDialog = () => {
    setReturnDialogOpen(false)
    setReturningOrderGroup(null)
    setReturnReason("")
  }

  const handleConfirmReturn = async () => {
    if (!returningOrderGroup?.paymentId?.trim()) {
      toast({
        title: "오류",
        description: t('key259', '결제 정보를 찾을 수 없습니다.'),
        variant: "destructive",
      })
      return
    }
    if (!returnReason.trim()) {
      toast({
        title: "반품 사유 입력",
        description: t('key260', '반품 사유를 입력해주세요.'),
        variant: "destructive",
      })
      return
    }
    setIsReturning(true)
    try {
      await returnPayment({
        paymentId: returningOrderGroup.paymentId,
        returnReason: returnReason.trim(),
      })
      toast({
        title: "반품 요청 완료",
        description: t('key261', '반품 요청이 처리되었습니다.'),
      })
      closeReturnDialog()
      await fetchOrders()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t('key262', '반품 요청에 실패했습니다.')
      toast({
        title: "반품 요청 실패",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsReturning(false)
    }
  }

  const handleConfirmCancel = async () => {
    if (!cancelingOrderGroup?.paymentId?.trim()) {
      toast({
        title: "오류",
        description: t('key259', '결제 정보를 찾을 수 없습니다.'),
        variant: "destructive",
      })
      return
    }
    if (!cancelReason.trim()) {
      toast({
        title: "취소 사유 입력",
        description: t('key263', '취소 사유를 입력해주세요.'),
        variant: "destructive",
      })
      return
    }
    setIsCanceling(true)
    try {
      await cancelPayment({
        paymentId: cancelingOrderGroup.paymentId,
        cancelReason: cancelReason.trim(),
      })
      toast({
        title: "결제 취소 요청 완료",
        description: t('key264', '결제 취소가 처리되었습니다.'),
      })
      closeCancelDialog()
      await fetchOrders()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t('key265', '결제 취소에 실패했습니다.')
      toast({
        title: "결제 취소 실패",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsCanceling(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (orderGroups.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="size-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">{t('key266', '주문 내역이 없습니다')}</h3>
        <p className="text-muted-foreground">{t('key267', '주문 내역이 여기에 표시됩니다')}</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">{t('key225', '주문/배송 조회')}</h2>

      <div className="space-y-6">
        {orderGroups.map((orderGroup) => {
          const orders = orderGroup.orders || []
          const firstOrder = orders[0]
          const orderDate = firstOrder?.orderDate || orderGroup.createdAt?.toString() || ""
          
          return (
            <Card key={orderGroup.orderGroupNumber} className="overflow-hidden border border-gray-200">
              {/* Order Group Header */}
              <div className="p-6 pb-4">
                <div className="flex items-stretch justify-between gap-6">
                  <div className="min-w-0 flex flex-1 flex-col justify-between">
                    <div className="flex items-center gap-3">
                      <Package className="size-5 text-muted-foreground shrink-0" />
                      <h3 className="font-medium truncate">{orderGroup.orderGroupNumber || orderGroup.orderGroupName}</h3>
                      <span
                        className={
                          isHighlightedStatus(orderGroup.situation)
                            ? "px-2 py-0.5 bg-[#ff5833] text-white text-xs rounded"
                            : "px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                        }
                      >
                        {getOrderStatusText(orderGroup.situation)}
                      </span>
                    </div>
                    {orderDate && (
                      <p className="text-sm text-muted-foreground mt-auto">{formatDate(orderDate)}</p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">{t('key268', '주문 금액')}</p>
                    <p className="text-3xl font-semibold leading-tight mt-1">
                      {formatCurrency(orderGroup.finalAmount || orderGroup.originalAmount || 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">원</p>
                  </div>
                </div>
              </div>

              {/* Products List */}
              {orders.length > 0 && (
                <div className="border-t border-gray-200 px-6 py-4 space-y-4">
                  {orders.map((order) => {
                    const productImageUrl = order.product?.imageRegistrationThumbnail
                    return (
                      <div key={order.id} className="flex gap-4">
                        <div className="relative h-16 w-16 shrink-0 bg-muted rounded-md overflow-hidden">
                          {productImageUrl ? (
                            <Image
                              src={productImageUrl}
                              alt={order.productName || "Product"}
                              fill
                              className="object-cover"
                              onError={(e) => {
                                // Fallback to placeholder on error
                                const target = e.target as HTMLImageElement
                                target.src = '/placeholder.svg'
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                              {t('noImage', 'No Image')}
                            </div>
                          )}
                        </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <h4 className="font-medium">{order.productNameWithOptions || order.productName}</h4>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(order.salePrice)} {t('key269', '원 ×')} {order.quantity || 0}
                        </p>
                      </div>
                    </div>
                    )
                  })}
                </div>
              )}

              {/* Recipient Info */}
              {firstOrder && (
                <div className="px-6 pb-4">
                  <div className="rounded-md bg-gray-50 p-4">
                    <p className="text-sm">
                      <span className="text-muted-foreground">{t('key203', '받는 사람')} </span>
                      <span className="font-medium">{firstOrder.recipient}</span> /{" "}
                      <span className="text-muted-foreground">{firstOrder.recipientMobilePhone}</span>
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">{t('recipientpostalcodeRecipientaddressfull', '({{recipientPostalCode}}) {{recipientAddressFull}}', { recipientPostalCode: firstOrder.recipientPostalCode, recipientAddressFull: firstOrder.recipientAddressFull })}</p>
                  </div>
                </div>
              )}

              {/* Courier Info (if available) */}
              {orderGroup.courierCompany && orderGroup.invoiceNumber && (
                <div className="px-6 pb-4">
                  <div className="space-y-1 pb-4 border-b">
                    <p className="text-sm">
                      <span className="text-muted-foreground">{t('key270', '택배사:')} </span>
                      <span className="font-medium">{orderGroup.courierCompany}</span>
                    </p>
                    <p className="text-sm">
                      <span className="text-muted-foreground">{t('key271', '운송장 번호:')} </span>
                      <span className="font-medium">{orderGroup.invoiceNumber}</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="px-6 pb-6 pt-2">
                <div className="flex gap-3 flex-wrap">
                  {orderGroup.situation === EOrderSituation.ORDER_PAYMENT_COMPLETED &&
                    orderGroup.paymentId && (
                    <Button
                      variant="outline"
                      className="flex-1 min-w-[120px] bg-red-500 text-white border-gray-200 hover:bg-red-600 h-12"
                      onClick={() => openCancelDialog(orderGroup)}
                    >
                      {t('key272', '결제 취소')}
                    </Button>
                  )}
                  {orderGroup.situation === EOrderSituation.ORDER_SHIPPED && (
                    <Button
                      variant="outline"
                      className="flex-1 min-w-[120px] bg-red-500 text-white border-gray-200 hover:bg-red-600 h-12"
                      onClick={() => openReturnDialog(orderGroup)}
                    >
                      {t('key273', '교환/반품')}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="flex-1 bg-transparent border-gray-200 hover:bg-gray-50 h-12"
                    onClick={() => handleViewOrderDetail(orderGroup.orderGroupNumber)}
                  >
                    {t('key274', '주문 상세')}
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Cancel Payment Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={(open) => !open && closeCancelDialog()}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('key272', '결제 취소')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cancel-reason">{t('key275', '취소 사유 *')}</Label>
              <Textarea
                id="cancel-reason"
                placeholder={t('key276', '취소 사유를 입력해주세요')}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeCancelDialog}
              disabled={isCanceling}
            >
              {t('key277', '닫기')}
            </Button>
            <Button
              onClick={handleConfirmCancel}
              disabled={isCanceling || !cancelReason.trim()}
            >
              {isCanceling ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  {t('key197', '처리 중...')}
                </>
              ) : (
                t('key278', '결제 취소 요청')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return Payment Dialog */}
      <Dialog open={returnDialogOpen} onOpenChange={(open) => !open && closeReturnDialog()}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('key273', '교환/반품')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="return-reason">{t('key279', '반품 사유 *')}</Label>
              <Textarea
                id="return-reason"
                placeholder={t('key280', '반품 사유를 입력해주세요')}
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeReturnDialog}
              disabled={isReturning}
            >
              {t('key277', '닫기')}
            </Button>
            <Button
              onClick={handleConfirmReturn}
              disabled={isReturning || !returnReason.trim()}
            >
              {isReturning ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  {t('key197', '처리 중...')}
                </>
              ) : (
                "반품 요청"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
