'use client'

import { use, useState, useRef, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { format } from 'date-fns'
import { ArrowLeft, Edit, Package, Truck, FileText, User, Phone, MapPin, Calendar, DollarSign, X, Mail } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useOrder } from '@/hooks/use-order/order.hook'
import { OrderGroup, EOrderSituation, Order } from '@/entities/orders/order.entity'
import { UpdateOrderGroupDto } from '@/hooks/use-order/order.dto'

// Helper function to format order status for display
function getOrderStatusDisplay(situation: EOrderSituation | null | undefined): {
  label: string
  color: string
} {
  if (!situation) return { label: 'N/A', color: 'bg-gray-50 text-gray-600 border-gray-200' }
  
  switch (situation) {
    case EOrderSituation.ORDER_PAYMENT_PENDING:
      return { label: '결제 대기', color: 'bg-orange-50 text-orange-600 border-orange-200' }
    case EOrderSituation.ORDER_PAYMENT_COMPLETED:
      return { label: '결제 완료', color: 'bg-green-50 text-green-600 border-green-200' }
    // case EOrderSituation.ORDER_PREPARE:
    //   return { label: '상품 준비중', color: 'bg-yellow-50 text-yellow-600 border-yellow-200' }
    case EOrderSituation.ORDER_BEING_SHIPPED:
      return { label: '배송중', color: 'bg-blue-50 text-blue-600 border-blue-200' }
    case EOrderSituation.ORDER_SHIPPED:
      return { label: '배송 완료', color: 'bg-purple-50 text-purple-600 border-purple-200' }
    case EOrderSituation.ORDER_CANCELLED:
      return { label: '취소됨', color: 'bg-red-50 text-red-600 border-red-200' }
    case EOrderSituation.ORDER_RETURNED:
      return { label: '반품됨', color: 'bg-red-50 text-red-600 border-red-200' }
    default:
      return { label: situation, color: 'bg-gray-50 text-gray-600 border-gray-200' }
  }
}

// Helper function to format currency
function formatCurrency(value: number | null | undefined) {
  if (!value) return '0원'
  return value.toLocaleString('ko-KR') + '원'
}

const courierOptions = [
  'CJ대한통운',
  '로젠택배',
  '한진택배',
  '우체국택배',
  '롯데택배',
]

export default function AdminOrderIdPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const queryClient = useQueryClient()
  const { 
    getOrderGroupByOrderGroupNumber,
    updateOrderGroup,
  } = useOrder()

  const [isEditMode, setIsEditMode] = useState(false)
  const [editFormData, setEditFormData] = useState<UpdateOrderGroupDto>({
    orderGroupName: '',
    situation: undefined,
    courierCompany: '',
    invoiceNumber: '',
    deliveryFee: undefined,
    pointsUsed: undefined,
  })
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false)

  // Fetch order group data
  const {
    data: orderGroupData,
    isLoading: isLoadingOrderGroup,
    isError: isErrorOrderGroup,
    refetch: refetchOrderGroup,
  } = useQuery({
    queryKey: ['order-group', resolvedParams.id],
    queryFn: async () => {
      const result = await getOrderGroupByOrderGroupNumber(resolvedParams.id)
      return result as OrderGroup
    },
    enabled: !!resolvedParams.id,
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: UpdateOrderGroupDto) => {
      return await updateOrderGroup(resolvedParams.id, data)
    },
    onSuccess: async () => {
      await refetchOrderGroup()
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order-group', resolvedParams.id] })
      setIsEditMode(false)
      alert('주문 그룹이 성공적으로 수정되었습니다.')
    },
    onError: (error) => {
      console.error('Failed to update order group:', error)
      alert('주문 그룹 수정에 실패했습니다. 다시 시도해주세요.')
    },
  })

  const handleOpenEditMode = () => {
    if (orderGroupData) {
      setEditFormData({
        orderGroupName: orderGroupData.orderGroupName || '',
        situation: orderGroupData.situation || undefined,
        courierCompany: orderGroupData.courierCompany || '',
        invoiceNumber: orderGroupData.invoiceNumber || '',
        deliveryFee: orderGroupData.deliveryFee || undefined,
        pointsUsed: orderGroupData.pointsUsed || undefined,
      })
      setIsEditMode(true)
    }
  }

  const handleCancelEdit = () => {
    setIsEditMode(false)
  }

  const handleEditFormChange = (field: keyof UpdateOrderGroupDto, value: any) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmitEdit = () => {
    updateMutation.mutate(editFormData)
  }

  const handleOpenInvoiceDialog = () => {
    setInvoiceDialogOpen(true)
  }

  const handleCloseInvoiceDialog = () => {
    setInvoiceDialogOpen(false)
  }

  const handleSubmitInvoice = () => {
    if (!editFormData.courierCompany?.trim() || !editFormData.invoiceNumber?.trim()) {
      alert('택배사와 송장번호를 모두 입력해주세요.')
      return
    }
    updateMutation.mutate({
      courierCompany: editFormData.courierCompany,
      invoiceNumber: editFormData.invoiceNumber,
    })
    setInvoiceDialogOpen(false)
  }

  const isLoading = isLoadingOrderGroup
  const isError = isErrorOrderGroup

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner />
      </div>
    )
  }

  if (isError || !orderGroupData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">주문 그룹을 찾을 수 없습니다</h2>
          <Button onClick={() => router.push('/admin/orders')}>목록으로</Button>
        </div>
      </div>
    )
  }

  const orders = orderGroupData.orders || []
  const statusDisplay = getOrderStatusDisplay(orderGroupData.situation)
  const user = orderGroupData.user
  const firstOrder = orders[0]

  const createdAt = orderGroupData.createdAt
    ? format(new Date(orderGroupData.createdAt), 'yyyy-MM-dd HH:mm')
    : firstOrder?.orderDate
    ? format(new Date(firstOrder.orderDate), 'yyyy-MM-dd HH:mm')
    : 'N/A'

  const updatedAt = orderGroupData.updatedAt
    ? format(new Date(orderGroupData.updatedAt), 'yyyy-MM-dd HH:mm')
    : 'N/A'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2">
          <Link 
            href="/admin/orders" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>목록으로</span>
          </Link>
        </div>
        <div>
          <h1 className="text-3xl font-bold mb-2">주문 그룹 상세</h1>
          <p className="text-gray-600">
            주문 그룹 정보를 확인하고 수정할 수 있습니다
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* Top Section - Two Cards Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Card - Ordering Information */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-bold mb-4">주문 정보</h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">주문번호</div>
                <div className="font-medium">{orderGroupData.orderGroupNumber || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">주문일시</div>
                <div className="font-medium">{createdAt}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">주문상태</div>
                <span className={`inline-block px-3 py-1 text-sm rounded border ${statusDisplay.color}`}>
                  {statusDisplay.label}
                </span>
              </div>
            </div>
          </div>

          {/* Right Card - Orderer Information */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-bold mb-4">주문자 정보</h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">이름</div>
                <div className="font-medium">{user?.name || firstOrder?.ordererName || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">연락처</div>
                <div className="font-medium">
                  {user?.phoneNumber || firstOrder?.ordererMobilePhone || 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">이메일 주소</div>
                <div className="font-medium">{user?.email || 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recipient Information Card */}
        {firstOrder && (
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-bold mb-4">수령인 정보</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">이름</div>
                <div className="font-medium">{firstOrder.recipient || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">연락처</div>
                <div className="font-medium">
                  {firstOrder.recipientMobilePhone || firstOrder.recipientPhoneNumber || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Order Products Card */}
        {orders.length > 0 && (
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-bold mb-4">주문 상품</h3>
            <div className="space-y-4">
              {orders.map((order, index) => (
                <div key={order.id || index} className="border rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    {/* Product thumbnail */}
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                      {order.product?.imageRegistrationThumbnail ? (
                        <Image
                          src={order.product.imageRegistrationThumbnail}
                          alt={order.productName || 'Product'}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium mb-2">
                        {order.productNameWithOptions || order.productName || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        {order.productNameWithOptions && order.productNameWithOptions !== order.productName && (
                          <div>
                            <span className="text-gray-500">Option: </span>
                            {order.productNameWithOptions}
                          </div>
                        )}
                        <div>
                          <span className="text-gray-500">주문 수량: </span>
                          {order.quantity || 0}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">
                        {formatCurrency(order.salePrice)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment Information Card */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-bold mb-4">주문 정보</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">총 주문 정보</div>
              <div className="font-medium text-right">{formatCurrency(orderGroupData.originalAmount)}</div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">총 주문 수량</div>
              <div className="font-medium text-right">{orders.length}</div>
            </div>
            <div className="flex justify-between items-center pt-3 border-t">
              <div className="text-sm text-gray-600 font-medium">총 결제 금액</div>
              <div className="font-bold text-lg text-red-600 text-right">
                {formatCurrency(orderGroupData.finalAmount)}
              </div>
            </div>
          </div>
        </div>

        {/* Main Card for Edit Mode and Actions */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="p-8">

            {/* Action Buttons */}
            <div className="pt-4 space-y-3">
              {!isEditMode ? (
                <>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleOpenEditMode}
                      className="bg-black text-white hover:bg-gray-800 flex-1"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      수정
                    </Button>
                    {(!orderGroupData.courierCompany || !orderGroupData.invoiceNumber) && 
                     (orderGroupData.situation === EOrderSituation.ORDER_PAYMENT_COMPLETED || orderGroupData.situation === EOrderSituation.ORDER_BEING_SHIPPED) && (
                      <Button
                        onClick={handleOpenInvoiceDialog}
                        variant="outline"
                        className="flex-1"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        송장 입력
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  {/* Edit Form */}
                  <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                    <div className="space-y-2">
                      <Label htmlFor="edit-group-name">주문 그룹명</Label>
                      <Input
                        id="edit-group-name"
                        value={editFormData.orderGroupName || ''}
                        onChange={(e) => handleEditFormChange('orderGroupName', e.target.value)}
                        placeholder="주문 그룹명을 입력하세요"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-situation">상태</Label>
                      <Select
                        value={editFormData.situation || ''}
                        onValueChange={(value) => handleEditFormChange('situation', value as EOrderSituation)}
                      >
                        <SelectTrigger id="edit-situation">
                          <SelectValue placeholder="상태를 선택하세요" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={EOrderSituation.ORDER_PAYMENT_PENDING}>결제 대기</SelectItem>
                          <SelectItem value={EOrderSituation.ORDER_PAYMENT_COMPLETED}>결제 완료</SelectItem>
                          {/* <SelectItem value={EOrderSituation.ORDER_IN_PREPARE}>상품 준비중</SelectItem> */}
                          <SelectItem value={EOrderSituation.ORDER_BEING_SHIPPED}>배송중</SelectItem>
                          <SelectItem value={EOrderSituation.ORDER_SHIPPED}>배송 완료</SelectItem>
                          <SelectItem value={EOrderSituation.ORDER_CANCELLED}>취소됨</SelectItem>
                          <SelectItem value={EOrderSituation.ORDER_RETURNED}>반품됨</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-courier">택배사</Label>
                      <Select
                        value={editFormData.courierCompany || undefined}
                        onValueChange={(v) => handleEditFormChange('courierCompany', v)}
                      >
                        <SelectTrigger id="edit-courier" className="w-full">
                          <SelectValue placeholder="택배사를 선택해주세요" />
                        </SelectTrigger>
                        <SelectContent>
                          {courierOptions.map((courier) => (
                            <SelectItem key={courier} value={courier}>
                              {courier}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-invoice">송장번호</Label>
                      <Input
                        id="edit-invoice"
                        value={editFormData.invoiceNumber || ''}
                        onChange={(e) => handleEditFormChange('invoiceNumber', e.target.value)}
                        placeholder="송장번호를 입력하세요"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-delivery-fee">배송비</Label>
                        <Input
                          id="edit-delivery-fee"
                          type="number"
                          value={editFormData.deliveryFee || ''}
                          onChange={(e) => handleEditFormChange('deliveryFee', e.target.value ? Number(e.target.value) : undefined)}
                          placeholder="배송비를 입력하세요"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-points">사용 포인트</Label>
                        <Input
                          id="edit-points"
                          type="number"
                          value={editFormData.pointsUsed || ''}
                          onChange={(e) => handleEditFormChange('pointsUsed', e.target.value ? Number(e.target.value) : undefined)}
                          placeholder="사용 포인트를 입력하세요"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={updateMutation.isPending}
                      className="flex-1"
                    >
                      취소
                    </Button>
                    <Button
                      onClick={handleSubmitEdit}
                      disabled={updateMutation.isPending}
                      className="bg-black text-white hover:bg-gray-800 flex-1"
                    >
                      {updateMutation.isPending ? (
                        <>
                          <Spinner className="w-4 h-4 mr-2" />
                          저장 중...
                        </>
                      ) : (
                        '저장'
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Dialog */}
      <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>송장 정보 입력</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dialog-courier">택배사 *</Label>
              <Select
                value={editFormData.courierCompany || undefined}
                onValueChange={(v) => handleEditFormChange('courierCompany', v)}
              >
                <SelectTrigger id="dialog-courier" className="w-full">
                  <SelectValue placeholder="택배사를 선택해주세요" />
                </SelectTrigger>
                <SelectContent>
                  {courierOptions.map((courier) => (
                    <SelectItem key={courier} value={courier}>
                      {courier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dialog-invoice">송장번호 *</Label>
              <Input
                id="dialog-invoice"
                value={editFormData.invoiceNumber || ''}
                onChange={(e) => handleEditFormChange('invoiceNumber', e.target.value)}
                placeholder="송장번호를 입력하세요"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseInvoiceDialog}
            >
              취소
            </Button>
            <Button
              onClick={handleSubmitInvoice}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <Spinner className="w-4 h-4 mr-2" />
                  저장 중...
                </>
              ) : (
                '저장'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
