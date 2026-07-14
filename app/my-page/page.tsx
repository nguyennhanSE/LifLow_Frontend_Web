"use client"

import { Card } from "@/components/ui/card"
import { CreditCard, FileText, LogOut, MapPin, Package, User } from "lucide-react"
import { useAuthHook } from "@/hooks/use-auth/auth.hook"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { useUser } from "@/hooks/use-user/user.hook"
import { OrderGroup, EOrderSituation } from "@/entities/orders/order.entity"
import { Spinner } from "@/components/ui/spinner"

// Helper function to format order status for display
function getOrderStatusDisplay(situation: EOrderSituation | null | undefined): {
  label: string
  color: string
} {
  if (!situation) return { label: '주문 대기', color: 'text-gray-600' }
  
  switch (situation) {
    case EOrderSituation.ORDER_PAYMENT_PENDING:
      return { label: '결제 대기', color: 'text-yellow-600' }
    case EOrderSituation.ORDER_PAYMENT_COMPLETED:
      return { label: '결제 완료', color: 'text-green-600' }
    case EOrderSituation.ORDER_BEING_SHIPPED:
      return { label: '배송중', color: 'text-purple-600' }
    case EOrderSituation.ORDER_SHIPPED:
      return { label: '배송 완료', color: 'text-green-600' }
    case EOrderSituation.ORDER_CANCELLED:
      return { label: '주문 취소', color: 'text-red-600' }
    case EOrderSituation.ORDER_RETURNED:
      return { label: '반품', color: 'text-red-600' }
    default:
      return { label: situation, color: 'text-gray-600' }
  }
}

export default function ProfilePage() {
  const { handleLogout } = useAuthHook()
  const router = useRouter()
  const { getMyInformation } = useUser()

  const { data: userData, isLoading } = useQuery({
    queryKey: ['myInformation', 'withOrders'],
    queryFn: () => getMyInformation({ includeOrders: true }),
  })

  const orderGroups: OrderGroup[] = (userData as { orderGroups?: OrderGroup[] })?.orderGroups ?? []
  const recentOrderGroups = orderGroups.slice(0, 5)

  const onLogout = async () => {
    try {
      // Get refresh token from cookies
      const refreshToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('refresh_token='))
        ?.split('=')[1]

      if (refreshToken) {
        await handleLogout(refreshToken)
      }
      // Redirect to home page after logout
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Banner */}
      <Card className="bg-linear-to-r from-indigo-500 via-purple-500 to-purple-600 text-white p-8 relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <p className="text-sm opacity-90">쭈왕몰과 함께한 시간</p>
          <p className="text-base opacity-90">총 구매 횟수</p>
          <div className="flex items-baseline gap-2">
            <span className="text-6xl font-bold">{orderGroups.length}</span>
            <span className="text-2xl">회</span>
          </div>
        </div>
        <div className="absolute right-8 top-1/2 -translate-y-1/2 text-6xl">🎉</div>
      </Card>

      {/* Recent Order History */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">최근 주문 내역</h2>
          <button 
            onClick={() => router.push('/my-page/orders')}
            className="text-orange-500 text-sm hover:underline"
          >
            전체 보기
          </button>
        </div>

        {recentOrderGroups.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>주문 내역이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentOrderGroups.map((orderGroup) => {
              const status = getOrderStatusDisplay(orderGroup.situation)
              const orders = orderGroup.orders || []
              return (
                <Card key={orderGroup.orderGroupNumber} className="p-4 border">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <h3 className="font-medium">
                        {orders.length > 0
                          ? orders.map((o) => o.productName || o.productNameWithOptions).filter(Boolean).join(", ")
                          : "-"}
                      </h3>
                      <p className="text-sm text-muted-foreground">주문번호: {orderGroup.orderGroupNumber}</p>
                    </div>
                    <span className={`text-sm font-medium ${status.color} ml-4 shrink-0`}>
                      {status.label}
                    </span>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </Card>

      {/* Action Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card onClick={() => router.push('/my-page/orders')} className="p-6 flex flex-col items-center justify-center gap-3 hover:shadow-md transition-shadow cursor-pointer">
          <Package className="size-8" />
          <span className="text-sm font-medium">주문 조회</span>
        </Card>

        <Card onClick={() => router.push('/my-page/points')} className="p-6 flex flex-col items-center justify-center gap-3 hover:shadow-md transition-shadow cursor-pointer">
          <CreditCard className="size-8" />
          <span className="text-sm font-medium">포인트</span>
        </Card>

        <Card onClick={() => router.push('/my-page/information')} className="p-6 flex flex-col items-center justify-center gap-3 hover:shadow-md transition-shadow cursor-pointer">
          <User className="size-8" />
          <span className="text-sm font-medium">회원 정보</span>
        </Card>

        <Card onClick={() => router.push('/my-page/address')} className="p-6 flex flex-col items-center justify-center gap-3 hover:shadow-md transition-shadow cursor-pointer">
          <MapPin className="size-8" />
          <span className="text-sm font-medium">배송지</span>
        </Card>

        <Card onClick={() => router.push('/my-page/recipe')} className="p-6 flex flex-col items-center justify-center gap-3 hover:shadow-md transition-shadow cursor-pointer col-span-2 lg:col-span-1">
          <FileText className="size-8" />
          <span className="text-sm font-medium">내 레시피</span>
        </Card>

        <Card 
          className="p-6 flex flex-col items-center justify-center gap-3 hover:shadow-md transition-shadow cursor-pointer col-span-2 lg:col-span-1"
          onClick={onLogout}
        >
          <LogOut className="size-8 text-red-500" />
          <span className="text-sm font-medium text-red-500">로그아웃</span>
        </Card>
      </div>
    </div>
  )
}
