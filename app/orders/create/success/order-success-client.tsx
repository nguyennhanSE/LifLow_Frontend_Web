"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Loader2 } from "lucide-react"
import { usePayment } from "@/hooks/use-payment/payment.hook"
import type { CouponIdQuantityDto } from "@/hooks/use-payment/payment.dto"
import { useTranslation } from 'react-i18next'

export default function OrderSuccessClient() {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { confirmPayment } = usePayment()
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  )
  const [paymentInfo, setPaymentInfo] = useState<{
    paymentKey: string
    orderId: string
    amount: string
  } | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>("")

  useEffect(() => {
    const confirmPaymentProcess = async () => {
      // Get payment information from URL query parameters
      // Toss Payments redirects here with: paymentKey, orderId, amount
      const paymentKey = searchParams.get("paymentKey")
      const orderId = searchParams.get("orderId")
      const amount = searchParams.get("amount")
      const deliveryFee = searchParams.get("deliveryFee")

      console.log("Payment Success - Received parameters:", {
        paymentKey,
        orderId,
        amount,
        deliveryFee,
      })

      if (!paymentKey || !orderId || !amount) {
        console.error("Missing payment parameters")
        setErrorMessage("결제 정보가 누락되었습니다")
        setStatus("error")
        // Redirect to fail page after a short delay
        setTimeout(() => {
          router.push(
            "/orders/create/fail?code=MISSING_PARAMS&message=Missing payment information",
          )
        }, 2000)
        return
      }

      setPaymentInfo({
        paymentKey,
        orderId,
        amount,
      })

      try {
        let cartItems: string[] = []
        const storedCartItemIds = localStorage.getItem("pendingCartItemIds")
        if (storedCartItemIds) {
          try {
            cartItems = JSON.parse(storedCartItemIds)
          } catch (e) {
            console.error("Failed to parse pendingCartItemIds", e)
          }
        }

        let coupons: CouponIdQuantityDto[] | undefined = undefined
        const storedOrderCoupons = localStorage.getItem("pendingOrderCoupons")
        if (storedOrderCoupons) {
          try {
            coupons = JSON.parse(storedOrderCoupons)
          } catch (e) {
            console.error("Failed to parse pendingOrderCoupons", e)
          }
        }

        const paymentToken = localStorage.getItem("pendingPaymentToken") || ""

        await confirmPayment({
          paymentKey: paymentKey,
          orderGroupNumber: orderId,
          amount: parseInt(amount),
          deliveryFee: deliveryFee ? parseInt(deliveryFee) : 0,
          cartItems,
          coupons,
          paymentToken,
        })

        localStorage.removeItem("pendingCartItemIds")
        localStorage.removeItem("pendingOrderCoupons")
        localStorage.removeItem("pendingOrderGroupNumber")
        localStorage.removeItem("pendingOrderGroupAt")
        localStorage.removeItem("pendingPaymentToken")

        setStatus("success")
      } catch (error: any) {
        console.error("Payment confirmation failed:", error)
        const errorMsg =
          error?.response?.data?.message ||
          error?.message ||
          t('key584', '결제 확인에 실패했습니다')
        setErrorMessage(errorMsg)
        setStatus("error")

        // Redirect to fail page
        setTimeout(() => {
          router.push(
            `/orders/create/fail?code=CONFIRM_FAILED&message=${encodeURIComponent(
              errorMsg,
            )}&orderId=${orderId}`,
          )
        }, 2000)
      }
    }

    confirmPaymentProcess()
  }, [searchParams, confirmPayment, router])

  const formatCurrency = (value: string) => {
    return parseInt(value).toLocaleString("ko-KR")
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-[#FF6B5A]" />
          <h2 className="text-xl font-semibold mb-2">{t('key585', '결제 확인 중...')}</h2>
          <p className="text-muted-foreground">
            {t('key586', '결제를 확인하는 중입니다. 잠시만 기다려주세요')}
          </p>
          {paymentInfo && (
            <div className="mt-4 text-sm text-muted-foreground">
              <p>{t('orderid', '주문 번호: {{orderId}}', { orderId: paymentInfo.orderId })}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold mb-2 text-red-500">
            {t('key587', '결제 확인 실패')}
          </h2>
          <p className="text-muted-foreground mb-2">
            {errorMessage || "오류가 발생했습니다"}
          </p>
          <p className="text-sm text-muted-foreground">
            {t('key588', '오류 페이지로 이동 중...')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">{t('key589', '결제 완료!')}</h1>
          <p className="text-muted-foreground mb-8">
            {t('key590', '주문이 성공적으로 완료되었습니다.')}
          </p>

          {paymentInfo && (
            <div className="bg-muted rounded-lg p-6 mb-8 text-left">
              <h2 className="font-semibold mb-4">{t('key575', '결제 정보')}</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('key591', '주문 번호:')}</span>
                  <span className="font-mono text-sm">{paymentInfo.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('key592', '결제 키:')}</span>
                  <span
                    className="font-mono text-sm truncate max-w-[200px]"
                    title={paymentInfo.paymentKey}
                  >
                    {paymentInfo.paymentKey}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-3">
                  <span className="text-muted-foreground">{t('key593', '결제 금액:')}</span>
                  <span className="font-semibold text-[#FF6B5A]">
                    {formatCurrency(paymentInfo.amount)} 원
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => router.push(`/my-page/orders/${paymentInfo?.orderId}`)}>
              {t('key594', '주문 내역 보기')}
            </Button>
            <Button
              onClick={() => router.push("/")}
              className="bg-[#FF6B5A] hover:bg-[#FF6B5A]/90"
            >
              {t('key171', '홈으로 돌아가기')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}


