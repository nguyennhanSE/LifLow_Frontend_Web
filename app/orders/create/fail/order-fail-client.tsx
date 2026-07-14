"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { XCircle } from "lucide-react"

export default function OrderFailClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [errorInfo, setErrorInfo] = useState<{
    code: string
    message: string
    orderId: string | null
  } | null>(null)

  useEffect(() => {
    // Get error information from URL query parameters
    // Toss Payments redirects here with: code, message, orderId
    const code = searchParams.get("code") || "UNKNOWN_ERROR"
    const message =
      searchParams.get("message") || "결제 중 오류가 발생했습니다"
    const orderId =
      searchParams.get("orderId") ||
      localStorage.getItem("pendingOrderGroupNumber")

    console.log("Payment Failed - Received parameters:", {
      code,
      message,
      orderId,
    })

    setErrorInfo({
      code,
      message,
      orderId,
    })

    // Clear pending data (Toss đã redirect về đây = user bấm hủy, không gọi cancelOrderGroup)
    localStorage.removeItem("pendingOrderGroupNumber")
    localStorage.removeItem("pendingOrderGroupAt")
    localStorage.removeItem("pendingCartItemIds")
    localStorage.removeItem("pendingOrderCoupons")
    localStorage.removeItem("pendingPaymentToken")
  }, [searchParams])

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">결제 실패</h1>
          <p className="text-muted-foreground mb-8">
            {errorInfo?.message || "결제 처리 중 오류가 발생했습니다."}
          </p>

          {errorInfo && (
            <div className="bg-muted rounded-lg p-6 mb-8 text-left">
              <h2 className="font-semibold mb-4">오류 상세</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">오류 코드:</span>
                  <span className="font-mono text-sm text-red-500">
                    {errorInfo.code}
                  </span>
                </div>
                {errorInfo.orderId && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">주문 번호:</span>
                    <span className="font-mono text-sm">{errorInfo.orderId}</span>
                  </div>
                )}
                <div className="border-t pt-3">
                  <p className="text-sm text-muted-foreground">
                    {errorInfo.message}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              결제 정보를 확인하고 다시 시도해주세요.
            </p>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={() => router.push("/cart")}>
                장바구니로 돌아가기
              </Button>
              <Button
                onClick={() => router.push("/orders/create")}
                className="bg-[#FF6B5A] hover:bg-[#FF6B5A]/90"
              >
                다시 시도
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


