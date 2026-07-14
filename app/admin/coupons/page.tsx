'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { Gift, Users, Plus, Edit, Trash2 } from 'lucide-react'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useCoupon } from '@/hooks/use-coupon/coupon.hook'
import { Coupon } from '@/entities/coupons/coupon.entity'
import { CreateCouponDialog } from './components/create-coupon-dialog'
import { UpdateCouponDialog } from './components/update-coupon-dialog'
import { useTranslation } from 'react-i18next'

export default function AdminBannerPage() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<{
    totalCoupons: number
    totalAutoIssueCoupons: number
    totalActiveCoupons: number
    totalInactiveCoupons: number
    totalExpiredCoupons: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasUserScrolled, setHasUserScrolled] = useState(false)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false)
  const [selectedCouponId, setSelectedCouponId] = useState<string | null>(null)
  const [deletingCouponId, setDeletingCouponId] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const { getCouponDashboard, getCoupons, deleteCoupon } = useCoupon()

  // Infinite query for coupons
  const {
    data: couponsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingCoupons,
    isError: isErrorCoupons,
    error: couponsError,
  } = useInfiniteQuery<Coupon[]>({
    queryKey: ['coupons'],
    queryFn: async ({ pageParam = 0 }) => {
      try {
        const page = (pageParam as number) / 10 + 1
        const params = {
          page,
          limit: 10,
        }

        const result = await getCoupons(params)
        // Handle different response structures
        if (Array.isArray(result)) {
          return result
        }
        // Handle paginated response with docs property
        if (result && typeof result === 'object' && 'docs' in result) {
          return (result as any).docs || []
        }
        // Handle response with data property
        if (result && typeof result === 'object' && 'data' in result) {
          return (result as any).data || []
        }
        return []
      } catch (err) {
        throw err
      }
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const lastLength = Array.isArray(lastPage) ? (lastPage.length ?? 0) : 0
      if (lastLength < 10) return undefined // no more pages
      const safePages = Array.isArray(allPages) ? allPages : []
      const nextOffset = safePages.reduce(
        (sum, page) => sum + (Array.isArray(page) ? (page.length ?? 0) : 0),
        0,
      )
      return nextOffset
    },
    retry: 1,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
  })

  // Flatten pages data
  const allCoupons = useMemo(() => {
    if (!couponsData?.pages) return []
    return couponsData.pages.flat()
  }, [couponsData])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const data = await getCouponDashboard()
        setStats(data)
      } catch (error) {
        console.error('Failed to fetch coupon stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [getCouponDashboard])

  // Infinite scroll setup
  useEffect(() => {
    const onScroll = () => setHasUserScrolled(true)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const el = bottomRef.current
    if (!el) return
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0]
      if (entry.isIntersecting && hasUserScrolled && hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    }, { root: null, rootMargin: '0px', threshold: 0.25 })
    observer.observe(el)
    return () => {
      observer.unobserve(el)
      observer.disconnect()
    }
  }, [bottomRef, hasUserScrolled, hasNextPage, isFetchingNextPage, fetchNextPage])

  // Helper function to format currency
  function formatCurrency(value: number | null | undefined) {
    if (!value) return ''
    return value.toLocaleString('ko-KR') + '원'
  }

  async function handleDeleteCoupon(id: string) {
    try {
      setDeletingCouponId(id)
      await deleteCoupon(id)
      await queryClient.invalidateQueries({ queryKey: ['coupons'] })
    } catch (err) {
      console.error('Failed to delete coupon:', err)
    } finally {
      setDeletingCouponId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{t('key469', '쿠폰 관리')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('key470', '쿠폰을 생성하고 관리합니다')}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* <Button variant="outline" className="bg-transparent gap-2">
            <Users className="h-4 w-4" />
            등급 관리
          </Button> */}
          <Button 
            className="bg-black text-white hover:bg-black/90 gap-2"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            {t('key471', '새 쿠폰 만들기')}
          </Button>
        </div>
      </section>

      {/* Status Cards */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            {t('key395', '통계를 불러오는 중...')}
          </div>
        ) : (
          <>
        <div className="bg-card border-border hover:shadow-sm rounded-lg border p-5 transition-shadow">
          <p className="mb-2 text-xs text-muted-foreground">{t('key472', '전체 쿠폰')}</p>
              <p className="text-3xl font-semibold text-foreground">{stats?.totalCoupons || 0}</p>
          {/* <p className="mt-1 text-xs text-muted-foreground">개</p> */}
        </div>

        <div className="bg-card border-border hover:shadow-sm rounded-lg border p-5 transition-shadow">
          <p className="mb-2 text-xs text-muted-foreground">{t('key473', '활성 쿠폰')}</p>
              <p className="text-3xl font-semibold text-green-600">{stats?.totalActiveCoupons || 0}</p>
          {/* <p className="mt-1 text-xs text-muted-foreground">개</p> */}
        </div>

        <div className="bg-card border-border hover:shadow-sm rounded-lg border p-5 transition-shadow">
          <p className="mb-2 text-xs text-muted-foreground">{t('key474', '자동 발급')}</p>
              <p className="text-3xl font-semibold text-blue-600">{stats?.totalAutoIssueCoupons || 0}</p>
          {/* <p className="mt-1 text-xs text-muted-foreground">개</p> */}
        </div>

        <div className="bg-card border-border hover:shadow-sm rounded-lg border p-5 transition-shadow">
          <p className="mb-2 text-xs text-muted-foreground">{t('key475', '포인트 쿠폰')}</p>
              <p className="text-3xl font-semibold text-purple-600">{stats?.totalInactiveCoupons || 0}</p>
          {/* <p className="mt-1 text-xs text-muted-foreground">개</p> */}
        </div>
          </>
        )}
      </section>

      {/* Coupon List */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-foreground">{t('key476', '쿠폰 목록')}</h2>

        <div className="space-y-4">
          {isErrorCoupons ? (
            <div className="text-center py-8 text-red-500">
              {t('key339', '오류가 발생했습니다:')} {couponsError instanceof Error ? couponsError.message : t('key340', '알 수 없는 오류')}
            </div>
          ) : isLoadingCoupons ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="flex items-center justify-center gap-2">
                <Spinner className="h-4 w-4" />
                <span>{t('key74', '로딩 중...')}</span>
              </div>
            </div>
          ) : allCoupons.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('key341', '데이터가 없습니다.')}
            </div>
          ) : (
            allCoupons.map((coupon) => (
            <div
              key={coupon.id}
              className="bg-card border-border hover:shadow-sm rounded-lg border p-6 transition-shadow"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-muted rounded-lg p-2">
                    <Gift className="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                        {coupon.name || 'N/A'}
                    </h3>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                      coupon.isActive 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {coupon.isActive ? '활성' : '비활성'}
                  </span>
                    {coupon.isAutoIssue && (
                    <span className="inline-flex items-center rounded-md bg-black px-3 py-1 text-xs font-medium text-white">
                      {t('key477', '자동발급')}
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setIsUpdateDialogOpen(true)
                      setSelectedCouponId(coupon.id)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => handleDeleteCoupon(coupon.id)}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    disabled={deletingCouponId === coupon.id || coupon.isPermanent === true}
                    title={coupon.isPermanent ? t('key478', '상시 쿠폰은 삭제할 수 없습니다') : '삭제'}
                  >
                    {deletingCouponId === coupon.id ? (
                      <Spinner className="h-4 w-4" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">{t('key479', '코드')}</p>
                    <p className="text-sm font-medium text-foreground">{coupon.code || 'N/A'}</p>
                    {/* {coupon.minPurchaseAmount && coupon.type === 'AMOUNT' && (
                    <p className="mt-2 text-xs text-muted-foreground">
                        최소 구매금액: {formatCurrency(coupon.minPurchaseAmount)}
                        {coupon.maxDiscountAmount && ` / 최대 할인: ${formatCurrency(coupon.maxDiscountAmount)}`}
                    </p>
                  )} */}
                </div>
                <div>
                  {coupon.discountRate != null && (
                    <>
                      <p className="mb-1 text-xs text-muted-foreground">{t('key480', '할인율')}</p>
                      <p className="text-sm font-medium text-foreground">{t('discountrate', '{{discountRate}}%', { discountRate: coupon.discountRate })}</p>
                    </>
                  )}
                  {coupon.discountAmount != null && coupon.discountAmount > 0 && (
                    <>
                      <p className="mb-1 text-xs text-muted-foreground">{t('key347', '할인금액')}</p>
                      <p className="text-sm font-medium text-foreground">
                          {formatCurrency(coupon.discountAmount)}
                      </p>
                    </>
                  )}
                  {coupon.minPurchaseAmount != null && coupon.minPurchaseAmount > 0 && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {t('key481', '최소 구매금액:')} {formatCurrency(coupon.minPurchaseAmount)}
                    </p>
                  )}
                  {coupon.maxDiscountAmount && coupon.maxDiscountAmount > 0 && (
                    <p className="mt-2 text-xs text-muted-foreground">
                        {t('key482', '최대 할인:')} {formatCurrency(coupon.maxDiscountAmount)}
                    </p>
                  )}
                </div>

                <div>
                  {coupon.startDate && coupon.endDate && (
                    <>
                      <p className="mb-1 text-xs text-muted-foreground">{t('key483', '유효기간')}</p>
                      <p className="text-sm font-medium text-foreground min-h-[1.25rem]">
                        {coupon.startDate && format(new Date(coupon.startDate), 'yyyy-MM-dd HH:mm')}
                        {coupon.startDate && coupon.endDate && t('key484', ' ~ ')}
                        {coupon.endDate && format(new Date(coupon.endDate), 'yyyy-MM-dd HH:mm')}
                      </p>
                    </>
                  )}
                </div>

                <div>
                    {coupon.targetGrades && coupon.targetGrades.length > 0 && (
                    <>
                      <p className="mb-1 text-xs text-muted-foreground">{t('key485', '발급 대상')}</p>
                      <p className="text-sm font-medium text-foreground">
                          {coupon.targetGrades.join(', ')}
                          {coupon.autoIssueDayOfMonth && t('autoissuedayofmonth', '(매달 {{autoIssueDayOfMonth}}일)', { autoIssueDayOfMonth: coupon.autoIssueDayOfMonth })}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
            ))
          )}
        </div>
      </section>

      {/* Intersection observer target for infinite scroll */}
      <div ref={bottomRef} className="h-4" />
      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Spinner className="h-5 w-5" />
        </div>
      )}

      {/* Create Coupon Dialog */}
      <CreateCouponDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
      <UpdateCouponDialog
        open={isUpdateDialogOpen}
        onOpenChange={setIsUpdateDialogOpen}
        id={selectedCouponId || ''}
      />
    </div>
  )
}


