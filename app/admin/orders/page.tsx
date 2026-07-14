'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Calendar as CalendarIcon,
  Download,
  FileText,
  Package2,
  PackageCheck,
  RefreshCcw,
  Search,
  ShoppingCart,
  Truck,
} from 'lucide-react'
import { format } from 'date-fns'
import { DateRange } from 'react-day-picker'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import { useOrder } from '@/hooks/use-order/order.hook'
import {
  Order,
  EOrderSituation,
  OrderGroup,
  OrderGroupedListResponse,
  PaginationMeta,
} from '@/entities/orders/order.entity'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { PaginationButton } from './components/PaginationButton'
import { useTranslation } from 'react-i18next'
import i18next from 'i18next'

// Helper function to format order status for display
function getOrderStatusDisplay(situation: EOrderSituation | null | undefined): {
  label: string
  badge: 'black' | 'red' | null
} {
  if (!situation) return { label: '', badge: null }
  
  switch (situation) {
    case EOrderSituation.ORDER_PAYMENT_FAILED:
      return { label: i18next.t('key386', '결제실패'), badge: 'red' }
    case EOrderSituation.ORDER_PAYMENT_PENDING:
      return { label: i18next.t('key387', '결제대기'), badge: null }
    case EOrderSituation.ORDER_PAYMENT_COMPLETED:
      return { label: i18next.t('key388', '결제완료'), badge: null }
    case EOrderSituation.ORDER_BEING_SHIPPED:
      return { label: i18next.t('key57', '배송중'), badge: 'black' }
    case EOrderSituation.ORDER_SHIPPED:
      return { label: i18next.t('key389', '배송완료'), badge: null }
    case EOrderSituation.ORDER_CANCELLED:
    case EOrderSituation.ORDER_RETURNED:
      return { label: situation === EOrderSituation.ORDER_CANCELLED ? '취소됨' : '반품됨', badge: 'red' }
    default:
      return { label: situation, badge: null }
  }
}

// Helper function to format currency
function formatCurrency(value: number) {
  return value.toLocaleString('ko-KR') + ' won'
}

export default function AdminOrdersPage() {
  const { t } = useTranslation()
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [stats, setStats] = useState<{
    paymentPending?: number
    newOrders?: number
    paymentCompleted: number
    inTransit: number
    invoiceTransmitted: number
    cancelled: number
    returned: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [selectedOrderStatus, setSelectedOrderStatus] = useState<EOrderSituation | 'ALL'>('ALL')
  const [debouncedOrderStatus, setDebouncedOrderStatus] = useState<EOrderSituation | 'ALL'>('ALL')
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | '7d' | '1m' | 'all'>('all')
  const [debouncedPeriod, setDebouncedPeriod] = useState<'today' | '7d' | '1m' | 'all'>('all')
  const [debouncedDateRange, setDebouncedDateRange] = useState<DateRange | undefined>(undefined)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedOrderGroupForInvoice, setSelectedOrderGroupForInvoice] = useState<OrderGroup | null>(null)
  const [courierCompany, setCourierCompany] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const queryClient = useQueryClient()
  const { getOrders, getOrdersStats, updateOrderGroup } = useOrder()
  const router = useRouter()
  // Query for orders (single page, pagination)
  const {
    data: ordersResponse,
    isLoading: isLoadingOrders,
    isError: isErrorOrders,
    error: ordersError,
  } = useQuery<OrderGroupedListResponse>({
    queryKey: [
      'orders',
      currentPage,
      debouncedQuery,
      debouncedOrderStatus,
      debouncedPeriod,
      debouncedDateRange?.from ? format(debouncedDateRange.from, 'yyyy-MM-dd') : null,
      debouncedDateRange?.to ? format(debouncedDateRange.to, 'yyyy-MM-dd') : null,
    ],
    queryFn: async () => {
      const params: Record<string, unknown> = {
        page: currentPage,
        limit: 10,
      }
      if (debouncedQuery.trim()) params.q = debouncedQuery.trim()
      if (debouncedOrderStatus && debouncedOrderStatus !== 'ALL') {
        params.situation = debouncedOrderStatus
      }
      if (debouncedPeriod && debouncedPeriod !== 'all') params.period = debouncedPeriod
      if (debouncedDateRange?.from) {
        params.dateFrom = format(debouncedDateRange.from, 'yyyy-MM-dd')
      }
      if (debouncedDateRange?.to) {
        params.dateTo = format(debouncedDateRange.to, 'yyyy-MM-dd')
      }

      const result = await getOrders(params)
      if (result == null || result === undefined) {
        return { data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0, hasNext: false, hasPrev: false } }
      }

      const res = result as any
      let groups: OrderGroup[] = []
      if (Array.isArray(res.data)) {
        groups = res.data
      } else if (Array.isArray(res)) {
        groups = res
      } else if (res?.data && Array.isArray(res.data)) {
        groups = res.data
      }

      const pagination = (res.pagination || {
        total: 0,
        page: currentPage,
        limit: 10,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      }) as PaginationMeta

      return { data: groups, pagination }
    },
    retry: 1,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
  })

  const allOrderGroups = ordersResponse?.data ?? []
  const paginationMeta = ordersResponse?.pagination ?? null

  const allOrders = useMemo(() => {
    const flattened = allOrderGroups.flatMap((g) => g.orders ?? [])
    const unique = new Map<string, Order>()
    flattened.forEach((o) => {
      if (o?.id && !unique.has(o.id)) unique.set(o.id, o)
    })
    return Array.from(unique.values())
  }, [allOrderGroups])

  // Get all order IDs from all groups for selection
  const allOrderIds = useMemo(() => {
    return allOrderGroups.flatMap((g) => (g.orders ?? []).map((o) => o.id).filter(Boolean))
  }, [allOrderGroups])

  // Order groups that contain at least one selected order (for bulk situation update)
  const selectedOrderGroups = useMemo(() => {
    if (selectedOrders.length === 0) return []
    const set = new Set(selectedOrders)
    return allOrderGroups.filter((g) =>
      (g.orders ?? []).some((o) => o.id && set.has(o.id)),
    )
  }, [allOrderGroups, selectedOrders])

  // Selected orderGroup for invoice entry
  const selectedOrderGroup = useMemo(() => {
    if (!selectedOrderGroupForInvoice) return null
    return allOrderGroups.find((g) => g.orderGroupNumber === selectedOrderGroupForInvoice.orderGroupNumber) || selectedOrderGroupForInvoice
  }, [selectedOrderGroupForInvoice, allOrderGroups])

  // Mutation for updating invoice - update OrderGroup
  const updateInvoiceMutation = useMutation({
    mutationFn: async ({ orderGroupNumber, courierCompany, invoiceNumber }: { orderGroupNumber: string; courierCompany: string; invoiceNumber: string }) => {
      return await updateOrderGroup(orderGroupNumber, {
        courierCompany: courierCompany || undefined,
        invoiceNumber: invoiceNumber || undefined,
      })
    },
    onSuccess: () => {
      // Invalidate and refetch orders list
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      // Close dialog and reset form
      setSelectedOrderGroupForInvoice(null)
      setCourierCompany('')
      setInvoiceNumber('')
    },
    onError: (error) => {
      console.error('Failed to update invoice:', error)
    },
  })

  // Initialize form when orderGroup is selected
  useEffect(() => {
    if (selectedOrderGroup) {
      setCourierCompany(selectedOrderGroup.courierCompany || '')
      setInvoiceNumber(selectedOrderGroup.invoiceNumber || '')
    } else {
      setCourierCompany('')
      setInvoiceNumber('')
    }
  }, [selectedOrderGroup])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const data = await getOrdersStats()
        console.log('getOrdersStats response:', data)
        setStats(data)
      } catch (error) {
        console.error('Failed to fetch order stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [getOrdersStats])

  // Debounce keyword query - reset to page 1 when filters change
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(keyword.trim())
      setCurrentPage(1)
    }, 500)
    return () => clearTimeout(handler)
  }, [keyword])

  useEffect(() => {
    setDebouncedOrderStatus(selectedOrderStatus)
    setCurrentPage(1)
  }, [selectedOrderStatus])

  useEffect(() => {
    setDebouncedPeriod(selectedPeriod)
    setCurrentPage(1)
  }, [selectedPeriod])

  useEffect(() => {
    setDebouncedDateRange(dateRange)
    setCurrentPage(1)
  }, [dateRange])

  const orderStatuses = useMemo(() => {
    if (!stats) return []

    return [
      { 
        icon: ShoppingCart, 
        label: t('key390', '신규주문'), 
        count: stats.paymentPending || 0, 
        color: 'bg-blue-100 text-blue-600' 
      },
      { 
        icon: PackageCheck, 
        label: t('key388', '결제완료'), 
        count: stats.paymentCompleted || 0, 
        color: 'bg-green-100 text-green-600' 
      },
      // { 
      //   icon: Package2, 
      //   label: '상품준비중', 
      //   count: stats.invoiceTransmitted || 0, 
      //   color: 'bg-yellow-100 text-yellow-600' 
      // },
      { 
        icon: Truck, 
        label: t('key57', '배송중'), 
        count: stats.inTransit || 0, 
        color: 'bg-purple-100 text-purple-600' 
      },
      { 
        icon: FileText, 
        label: t('key391', '송장진송'), 
        count: stats.invoiceTransmitted || 0, 
        color: 'bg-indigo-100 text-indigo-600' 
      },
      {
        icon: RefreshCcw,
        label: t('key392', '취소/반품/교환'),
        count: (stats.cancelled || 0) + (stats.returned || 0),
        color: 'bg-red-100 text-red-600',
      },
    ]
  }, [stats])

  const toggleOrder = (orderId: string) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId],
    )
  }

  const toggleAll = () => {
    setSelectedOrders((prev) => (prev.length === allOrderIds.length ? [] : [...allOrderIds]))
  }

  const toggleGroup = (group: OrderGroup) => {
    const ids = (group.orders ?? []).map((o) => o.id).filter(Boolean)
    if (ids.length === 0) return
    const allSelected = ids.every((id) => selectedOrders.includes(id))
    setSelectedOrders((prev) =>
      allSelected ? prev.filter((id) => !ids.includes(id)) : [...new Set([...prev, ...ids])],
    )
  }

  const handleQuickSelect = (range: 'today' | '7days' | '1month' | 'entire') => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    switch (range) {
      case 'today': {
        setDateRange({ from: today, to: today })
        setSelectedPeriod('today')
        break
      }
      case '7days': {
        const sevenDaysAgo = new Date(today)
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
        setDateRange({ from: sevenDaysAgo, to: today })
        setSelectedPeriod('7d')
        break
      }
      case '1month': {
        const oneMonthAgo = new Date(today)
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
        setDateRange({ from: oneMonthAgo, to: today })
        setSelectedPeriod('1m')
        break
      }
      case 'entire': {
        setDateRange(undefined)
        setSelectedPeriod('all')
        break
      }
    }
  }

  const handleReset = () => {
    setDateRange(undefined)
    setSelectedPeriod('all')
    setSelectedOrderStatus('ALL')
    setKeyword('')
    setCurrentPage(1)
  }

  const handleOpenInvoiceDialog = (group: OrderGroup) => {
    setSelectedOrderGroupForInvoice(group)
  }

  const handleCloseInvoiceDialog = () => {
    setSelectedOrderGroupForInvoice(null)
    setCourierCompany('')
    setInvoiceNumber('')
  }

  const handleSubmitInvoice = () => {
    if (!selectedOrderGroup || !selectedOrderGroup.orderGroupNumber) return
    updateInvoiceMutation.mutate({
      orderGroupNumber: selectedOrderGroup.orderGroupNumber,
      courierCompany,
      invoiceNumber,
    })
  }

  // Filter shortcut: set situation filter → getOrders (GET) refetches with situation param
  const handleFilterBySituation = (situation: EOrderSituation) => {
    setSelectedOrderStatus(situation)
    setCurrentPage(1)
  }

  // Courier company options
  const courierOptions = [
    'CJ대한통운',
    '로젠택배',
    '한진택배',
    '우체국택배',
    '롯데택배',
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <section>
        <h1 className="text-xl font-semibold text-foreground">{t('key393', '주문 관리')}</h1>
        <p className="text-sm text-muted-foreground mt-1">
        {t('key394', '주문 현황을 확인하고 관리할 수 있습니다')}
        </p>
      </section>

      {/* Status Cards */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {loading ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            {t('key395', '통계를 불러오는 중...')}
          </div>
        ) : (
          orderStatuses.map((status, index) => (
            <div
              key={index}
              className="bg-card border-border hover:shadow-sm flex flex-col rounded-lg border p-4 transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className={`${status.color} rounded-lg p-2`}>
                  <status.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="mb-1 text-xs text-muted-foreground">{status.label}</p>
                  <p className="text-2xl font-semibold text-foreground">{status.count}</p>
                  {/* <p className="mt-0.5 text-xs text-muted-foreground">건</p> */}
                </div>
              </div>
            </div>
          ))
        )}
      </section>

      {/* Order Search */}
      <section className="bg-card border-border rounded-lg border p-6">
        <h2 className="mb-4 text-base font-semibold text-foreground">{t('key396', '주문 검색')}</h2>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Period */}
          <div className="space-y-2 lg:col-span-3">
            <Label className="text-sm font-medium">{t('key397', '기간')}</Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'bg-transparent flex w-full justify-start text-left font-normal',
                    !dateRange && 'text-muted-foreground',
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, 'LLL dd, y')} -{' '}
                        {format(dateRange.to, 'LLL dd, y')}
                      </>
                    ) : (
                      format(dateRange.from, 'LLL dd, y')
                    )
                  ) : (
                    <span>{t('key398', '날짜 선택')}</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={1}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Quick Select */}
          <div className="space-y-2 lg:col-span-4">
            <Label className="text-sm font-medium">{t('key399', '빠른 선택')}</Label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="bg-transparent flex-1"
                onClick={() => handleQuickSelect('today')}
              >
                {t('key400', '오늘')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-transparent flex-1"
                onClick={() => handleQuickSelect('7days')}
              >
                {t('74', '7일')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-transparent flex-1"
                onClick={() => handleQuickSelect('1month')}
              >
                {t('127', '1개월')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-transparent flex-1"
                onClick={() => handleQuickSelect('entire')}
              >
                {t('key325', '전체')}
              </Button>
            </div>
          </div>

          {/* Order Status */}
          <div className="space-y-2 lg:col-span-2">
            <Label className="text-sm font-medium">{t('key401', '주문 상태')}</Label>
            <Select 
              value={selectedOrderStatus} 
              onValueChange={(value) => setSelectedOrderStatus(value as EOrderSituation | 'ALL')}
                            
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t('key325', '전체')}</SelectItem>
                <SelectItem value={EOrderSituation.ORDER_PAYMENT_PENDING}>{t('key387', '결제대기')}</SelectItem>
                <SelectItem value={EOrderSituation.ORDER_PAYMENT_COMPLETED}>{t('key388', '결제완료')}</SelectItem>
                <SelectItem value={EOrderSituation.ORDER_BEING_SHIPPED}>{t('key57', '배송중')}</SelectItem>
                <SelectItem value={EOrderSituation.ORDER_SHIPPED}>{t('key389', '배송완료')}</SelectItem>
                <SelectItem value={EOrderSituation.ORDER_CANCELLED}>{t('key212', '취소')}</SelectItem>
                <SelectItem value={EOrderSituation.ORDER_RETURNED}>{t('key60', '반품')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search */}
          <div className="space-y-2 lg:col-span-3">
            <Label className="text-sm font-medium">{t('key402', '검색')}</Label>
            <div className="relative">
              <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder={t('key403', '주문번호, 고객명, 상품명')}
                className="pl-9"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Reset Button */}
        <div className="mt-4 flex justify-center">
          <Button variant="outline" size="sm" onClick={handleReset}>
            {t('key366', '초기화')}
          </Button>
        </div>
      </section>

      {/* Order Table */}
      <section className="bg-card border-border rounded-lg border">
        {/* Table Header Info */}
        <div className="border-border flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-base font-semibold text-foreground">{t('key404', '전체 주문')}</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFilterBySituation(EOrderSituation.ORDER_PAYMENT_COMPLETED)}
            >
              {t('key56', '결제 완료')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFilterBySituation(EOrderSituation.ORDER_BEING_SHIPPED)}
            >
              {t('key405', '출고완료 처리')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFilterBySituation(EOrderSituation.ORDER_SHIPPED)}
            >
              {t('key406', '배송완료 처리')}
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr className="text-xs font-medium text-muted-foreground">
                <th className="w-12 p-4">
                  <Checkbox
                    checked={selectedOrders.length === allOrderIds.length && allOrderIds.length > 0}
                    onCheckedChange={toggleAll}
                  />
                </th>
                <th className="p-4 text-left">{t('key407', '주문그룹번호')}</th>
                <th className="p-4 text-left">{t('key408', '상품정보')}</th>
                <th className="p-4 text-left">{t('key409', '주문자')}</th>
                <th className="p-4 text-left">{t('key205', '연락처')}</th>
                <th className="p-4 text-left">{t('key410', '주문일시')}</th>
                <th className="p-4 text-left">{t('key411', '주문금액')}</th>
                <th className="p-4 text-center w-28">{t('key336', '상태')}</th>
                <th className="p-4 text-left">{t('key338', '관리')}</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {isErrorOrders ? (
                <tr>
                  <td colSpan={9} className="p-4 text-center text-red-500">
                    {t('key339', '오류가 발생했습니다:')} {ordersError instanceof Error ? ordersError.message : t('key340', '알 수 없는 오류')}
                  </td>
                </tr>
              ) : isLoadingOrders ? (
                <tr>
                  <td colSpan={9} className="p-4 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <Spinner className="h-4 w-4" />
                      <span>{t('key74', '로딩 중...')}</span>
                    </div>
                  </td>
                </tr>
              ) : allOrderGroups.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-4 text-center text-muted-foreground">
                    {t('key341', '데이터가 없습니다.')}
                  </td>
                </tr>
              ) : (
                allOrderGroups.map((group, groupIdx) => {
                  // Use index as fallback to ensure unique keys
                  const groupKey = group.orderGroupNumber ? t('ordergroupnumbergroupidx', '{{orderGroupNumber}}-{{groupIdx}}', { orderGroupNumber: group.orderGroupNumber, groupIdx }) : t('groupgroupidx', 'group-{{groupIdx}}', { groupIdx })
                  const groupOrders = group.orders ?? []
                  // Sort orders by product name alphabetically
                  const sortedOrders = [...groupOrders].sort((a, b) => {
                    const nameA = (a.productName || '').toLowerCase()
                    const nameB = (b.productName || '').toLowerCase()
                    return nameA.localeCompare(nameB)
                  })
                  const groupOrderIds = sortedOrders.map((o) => o.id).filter(Boolean)
                  const allInGroupSelected =
                    groupOrderIds.length > 0 && groupOrderIds.every((id) => selectedOrders.includes(id))
                  
                  // Get product information (sorted alphabetically). Fallback when orders is empty (e.g. ORDER_PAYMENT_PENDING)
                  const productNames = sortedOrders
                    .map((o) => o.productNameWithOptions || o.productName)
                    .filter(Boolean)
                  
                  // Orderer/contact/date: from first order, or from group.user/createdAt when orders is empty
                  const firstOrder = sortedOrders[0]
                  const ordererName = firstOrder?.ordererName || group.user?.name || 'N/A'
                  const contactInfo = firstOrder?.recipientMobilePhone || firstOrder?.recipientPhoneNumber || group.user?.phoneNumber || group.user?.email || 'N/A'
                  const orderDate = group.createdAt
                    ? format(new Date(group.createdAt), 'yyyy-MM-dd HH:mm')
                    : 'N/A'
                  
                  // Get status from group
                  const statusDisplay = getOrderStatusDisplay(group.situation || undefined)
                  
                  // Check if any order in group needs invoice input
                  // Show dialog only for ORDER_IN_PREPARE or ORDER_PAYMENT_COMPLETED without invoice info
                  // For other statuses (like ORDER_BEING_SHIPPED), show navigation button
                  const needsInvoiceInput = (group.situation === EOrderSituation.ORDER_PAYMENT_COMPLETED || 
                                            group.situation === EOrderSituation.ORDER_PAYMENT_PENDING)
                                            
                  
                  return (
                    <tr
                      key={groupKey}
                      className="border-border border-t transition-colors hover:bg-muted/20"
                    >
                      <td className="p-4">
                        <Checkbox
                          checked={allInGroupSelected}
                          onCheckedChange={() => toggleGroup(group)}
                          disabled={groupOrderIds.length === 0}
                        />
                      </td>
                      <td className="p-4">
                        <span className="font-medium text-foreground">
                          {group.orderGroupNumber || 'N/A'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          {productNames.length > 0 ? (
                            productNames.map((productName, idx) => (
                              <span key={idx} className="text-foreground text-sm">
                                {productName}
                              </span>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              {group.situation === EOrderSituation.ORDER_PAYMENT_PENDING ? '-' : '-'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-foreground">{ordererName}</span>
                          {firstOrder?.ordererId && (
                            <span className="text-xs text-muted-foreground">
                              {/* ID: {firstOrder.ordererId} */}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-foreground">{contactInfo}</span>
                          {/* {firstOrder?.recipientPhoneNumber && firstOrder.recipientPhoneNumber !== contactInfo && (
                            <span className="text-xs text-muted-foreground">
                              {firstOrder.recipientPhoneNumber}
                            </span>
                          )} */}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-foreground">{orderDate}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-foreground font-medium">
                            {formatCurrency(group.finalAmount || 0)}
                          </span>
                          {/* {group.discountAmount && group.discountAmount > 0 && (
                            <span className="text-xs text-muted-foreground">
                              할인: {formatCurrency(group.discountAmount)}
                            </span>
                          )} */}
                        </div>
                      </td>
                      <td className="p-4 text-center w-28">
                        {statusDisplay.label ? (
                          <span
                            className={cn(
                              'inline-flex min-w-[72px] items-center justify-center rounded-full px-2.5 py-1 text-xs font-medium leading-none',
                              statusDisplay.badge === 'black' && 'bg-foreground text-background',
                              statusDisplay.badge === 'red' && 'bg-destructive text-white',
                              !statusDisplay.badge && 'bg-muted/40 text-muted-foreground',
                            )}
                          >
                            {statusDisplay.label}
                          </span>
                        ) : null}
                      </td>
                      <td className="p-4">
                        <div className="space-y-2 min-w-[120px]">
                          {group.courierCompany && (
                            <div className="text-xs">
                              <span className="text-muted-foreground">{t('key270', '택배사:')} </span>
                              <span className="text-foreground font-medium">{group.courierCompany}</span>
                            </div>
                          )}
                          {group.invoiceNumber && (
                            <div className="text-xs">
                              <span className="text-muted-foreground">{t('key412', '송장번호:')} </span>
                              <span className="text-foreground font-medium">{group.invoiceNumber}</span>
                            </div>
                          )}
                          <div className="space-y-2">
                            {needsInvoiceInput && (
                              <Button
                                variant="default"
                                size="sm"
                                className="w-full bg-black text-white hover:bg-black/90"
                                onClick={() => handleOpenInvoiceDialog(group)}
                              >
                                {t('key413', '송장입력')}
                              </Button>
                            )}
                            <Button
                              variant="default"
                              size="sm"
                              className="w-full bg-black text-white hover:bg-black/90"
                              onClick={() => router.push(`/admin/orders/${group.orderGroupNumber}`)}
                            >
                              {t('key414', '상세보기')}
                            </Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="border-border flex flex-col gap-4 border-t px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {paginationMeta?.total != null
                ? t('totalLength', '전체 {{total}}건 ({{length}}건 표시)', { total: paginationMeta.total, length: allOrderGroups.length })
                : t('length3', '{{length}}건의 주문그룹', { length: allOrderGroups.length })}
            </p>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              {t('csv2', 'CSV 내보내기')}
            </Button>
          </div>
          <PaginationButton
            currentPage={paginationMeta?.page ?? 1}
            totalPages={Math.max(1, paginationMeta?.totalPages ?? 1)}
            onPageChange={(page) => {
              setCurrentPage(page)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            isLoading={isLoadingOrders}
          />
        </div>
      </section>

      {/* Invoice Entry Dialog */}
      <Dialog open={selectedOrderGroup !== null} onOpenChange={(open) => !open && handleCloseInvoiceDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('key415', '송장번호 입력')}</DialogTitle>
          </DialogHeader>
          
          {selectedOrderGroup && (
            <div className="space-y-4 py-4">
              {/* Order Group Number */}
              <div>
                <p className="text-sm font-medium text-foreground mb-1">
                  {t('key416', '주문그룹:')} {selectedOrderGroup.orderGroupNumber || 'N/A'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('key417', '송장번호를 입력해주세요 (')}{selectedOrderGroup.orders?.length || 0}{t('key418', '건의 주문)')}
                </p>
              </div>

              {/* Courier */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('key419', '택배사')}</Label>
                <Select value={courierCompany} onValueChange={setCourierCompany}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('key420', '택배사를 선택해주세요')} />
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

              {/* Invoice Number */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('key421', '송장번호')}</Label>
                <Input
                  placeholder={t('key422', '송장번호를 입력해주세요')}
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                />
              </div>

              {/* Recipient Information - from first order */}
              {selectedOrderGroup.orders && selectedOrderGroup.orders.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t('key423', '수령인 정보')}</Label>
                  <div className="rounded-md bg-muted p-3 space-y-2 text-sm">
                    {(() => {
                      const firstOrder = selectedOrderGroup.orders[0]
                      return (
                        <>
                          <div>
                            <span className="text-muted-foreground">{t('key424', '이름:')} </span>
                            <span className="text-foreground font-medium">
                              {firstOrder.recipient || firstOrder.ordererName || 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">{t('key425', '연락처:')} </span>
                            <span className="text-foreground font-medium">
                              {firstOrder.recipientMobilePhone || firstOrder.ordererMobilePhone || 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">{t('key426', '주소:')} </span>
                            <span className="text-foreground font-medium">
                              {firstOrder.recipientAddressFull 
                                ? t('valRecipientaddressfull', '({{val}}) {{recipientAddressFull}}', { val: firstOrder.recipientPostalCode || '', recipientAddressFull: firstOrder.recipientAddressFull })
                                : 'N/A'}
                            </span>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseInvoiceDialog}
              disabled={updateInvoiceMutation.isPending}
            >
              {t('key212', '취소')}
            </Button>
            <Button
              onClick={handleSubmitInvoice}
              disabled={updateInvoiceMutation.isPending || !courierCompany || !invoiceNumber}
              className="bg-black text-white hover:bg-black/90"
            >
              {updateInvoiceMutation.isPending && (
                <Spinner className="mr-2 h-4 w-4" />
              )}
              {t('key427', '등록')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


