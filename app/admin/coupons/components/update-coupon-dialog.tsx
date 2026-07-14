'use client'

import { useEffect, useState } from 'react'
import { Calendar as CalendarIcon } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { format, startOfDay } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { useQuery } from '@tanstack/react-query'
import { useCoupon } from '@/hooks/use-coupon/coupon.hook'
import { useMembership } from '@/hooks/use-membership/membership.hook'
import { CouponType } from '@/entities/coupons/coupon.entity'
import { UpdateCouponDto } from '@/hooks/use-coupon/coupon.dto'
import { Membership } from '@/entities/membership.entity'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { useTranslation } from 'react-i18next'

interface UpdateCouponDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  id: string
}

export function UpdateCouponDialog({ open, onOpenChange, id }: UpdateCouponDialogProps) {
  const { t } = useTranslation()
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [startDateOpen, setStartDateOpen] = useState(false)
  const [endDateOpen, setEndDateOpen] = useState(false)

  // Read-only from API: dùng để disable switch khi đã phát hành
  const [couponMeta, setCouponMeta] = useState<{ canAutoIssue: boolean; hasBeenIssued: boolean }>({
    canAutoIssue: false,
    hasBeenIssued: false,
  })
  
  // Form state
  const [formData, setFormData] = useState<UpdateCouponDto>({
    name: '',
    code: '',
    type: CouponType.PERCENT,
    discountRate: 0,
    discountAmount: 0,
    minPurchaseAmount: 0,
    maxDiscountAmount: 0,
    imageUrl: '',
    startDate: undefined,
    endDate: undefined,
    isActive: true,
    isAutoIssue: false,
    autoIssueDayOfMonth: undefined,
    targetGrades: [],
  })

  const queryClient = useQueryClient()
  const { updateCoupon, getCouponById } = useCoupon()
  const { getMembership } = useMembership()

  const { data: membershipsData, isLoading: isLoadingMemberships } = useQuery<Membership[]>({
    queryKey: ['memberships'],
    queryFn: async () => {
      const result = await getMembership(1, 100, 'asc')
      return result?.data ?? result ?? []
    },
    enabled: open,
  })

  // Mutation for creating coupon
  const updateCouponMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: UpdateCouponDto }) => {
      return await updateCoupon(id, data)
    },
    onSuccess: () => {
      // Invalidate and refetch coupons list
      queryClient.invalidateQueries({ queryKey: ['coupons'] })
      // Reset form and close dialog
      resetForm()
      onOpenChange(false)
    },
    onError: (error) => {
      console.error('Failed to create coupon:', error)
    },
  })

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      type: CouponType.PERCENT,
      discountRate: 0,
      discountAmount: 0,
      minPurchaseAmount: 0,
      maxDiscountAmount: 0,
      imageUrl: '',
      startDate: undefined,
      endDate: undefined,
      isActive: true,
      isAutoIssue: false,
      autoIssueDayOfMonth: undefined,
      targetGrades: [],
    })
    setStartDate(undefined)
    setEndDate(undefined)
    setCouponMeta({ canAutoIssue: false, hasBeenIssued: false })
  }

  const isFreeShipping = formData.type === CouponType.FREE_SHIPPING

  // Handle form submission (FREE_SHIPPING: chỉ gửi name, code, type)
  const handleSubmit = () => {
    const submitData: UpdateCouponDto = isFreeShipping
      ? { name: formData.name, code: formData.code, type: CouponType.FREE_SHIPPING }
      : {
          name: formData.name,
          code: formData.code,
          type: formData.type,
          startDate: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
          endDate: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
          isActive: formData.isActive,
          isAutoIssue: formData.isAutoIssue,
          imageUrl: formData.imageUrl || undefined,
          ...(formData.type === CouponType.PERCENT
            ? { discountRate: formData.discountRate || undefined }
            : { discountAmount: formData.discountAmount || undefined }),
          minPurchaseAmount: formData.minPurchaseAmount || undefined,
          maxDiscountAmount: formData.maxDiscountAmount || undefined,
          autoIssueDayOfMonth: formData.isAutoIssue ? '01' : undefined,
          targetGrades: formData.isAutoIssue ? formData.targetGrades : undefined,
        }
    updateCouponMutation.mutate({ id, data: submitData })
  }

  // Handle dialog close
  const handleClose = () => {
    onOpenChange(false)
    resetForm()
  }

  useEffect(() => {
    if (open && id) {
      const fetchCoupon = async () => {
        try {
          const coupon = await getCouponById(id)
          setCouponMeta({
            canAutoIssue: coupon.canAutoIssue ?? false,
            hasBeenIssued: coupon.hasBeenIssued ?? false,
          })
          setFormData({
            name: coupon.name || '',
            code: coupon.code || '',
            type: coupon.type || CouponType.PERCENT,
            discountRate: coupon.discountRate ?? 0,
            discountAmount: coupon.discountAmount ?? 0,
            minPurchaseAmount: coupon.minPurchaseAmount ?? 0,
            maxDiscountAmount: coupon.maxDiscountAmount ?? 0,
            imageUrl: coupon.imageUrl ?? '',
            startDate: undefined,
            endDate: undefined,
            isActive: coupon.isActive ?? true,
            isAutoIssue: coupon.isAutoIssue ?? false,
            autoIssueDayOfMonth: coupon.autoIssueDayOfMonth ?? undefined,
            targetGrades: coupon.targetGrades ?? [],
          })
          setStartDate(coupon.startDate ? new Date(coupon.startDate) : undefined)
          setEndDate(coupon.endDate ? new Date(coupon.endDate) : undefined)
          setStartDateOpen(false)
          setEndDateOpen(false)
        } catch (error) {
          console.error('Failed to fetch coupon:', error)
        }
      }
      fetchCoupon()
    }
  }, [getCouponById, id, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('key705', '쿠폰 수정')}</DialogTitle>
          <DialogDescription>{t('key706', '쿠폰을 수정합니다.')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Two Column Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Coupon name */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('key707', '쿠폰명')}</Label>
                <Input
                  placeholder={t('vip10', '예: VIP 회원 10% 할인')}
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* Coupon type — FREE_SHIPPING thì chỉ hiển thị, không cho đổi */}
              <div className="space-y-2 ">
                <Label className="text-sm font-medium">{t('key708', '쿠폰 타입')}</Label>
                <Select
                  value={formData.type || CouponType.PERCENT}
                  onValueChange={(value) => {
                    const newType = value as CouponType
                    setFormData({ ...formData, type: newType })
                  }}
                  disabled={isFreeShipping}
                >
                  <SelectTrigger
                    className={cn('w-full', isFreeShipping && 'bg-muted cursor-not-allowed')}
                  >
                    <SelectValue placeholder={t('key709', '쿠폰 타입 선택')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={CouponType.PERCENT}>{t('key710', '할인율 (%)')}</SelectItem>
                    <SelectItem value={CouponType.AMOUNT}>{t('key711', '할인 금액 (원)')}</SelectItem>
                    <SelectItem value={CouponType.FREE_SHIPPING}>{t('key712', '무료 배송')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Minimum purchase amount — FREE_SHIPPING일 때 비활성화 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('key713', '최소 구매 금액 (원)')}</Label>
                <Input
                  type="number"
                  disabled={isFreeShipping}
                  className={cn(isFreeShipping && 'bg-muted cursor-not-allowed')}
                  value={formData.minPurchaseAmount || 0}
                  onChange={(e) => setFormData({ ...formData, minPurchaseAmount: Number(e.target.value) })}
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Coupon Code */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('key714', '쿠폰 코드')}</Label>
                <Input
                  placeholder={t('vip102', '예: VIP10')}
                  value={formData.code || ''}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
              </div>

              {/* Discount rate (%) or Discount amount (원) — FREE_SHIPPING일 때 비활성화 */}
              {formData.type === CouponType.PERCENT ? (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t('key710', '할인율 (%)')}</Label>
                  <Input
                    type="number"
                    disabled={isFreeShipping}
                    className={cn(isFreeShipping && 'bg-muted cursor-not-allowed')}
                    value={formData.discountRate || 0}
                    onChange={(e) => setFormData({ ...formData, discountRate: Number(e.target.value) })}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t('key711', '할인 금액 (원)')}</Label>
                  <Input
                    type="number"
                    disabled={isFreeShipping}
                    className={cn(isFreeShipping && 'bg-muted cursor-not-allowed')}
                    value={formData.discountAmount || 0}
                    onChange={(e) => setFormData({ ...formData, discountAmount: Number(e.target.value) })}
                  />
                </div>
              )}

              {/* Maximum discount amount — AMOUNT/FREE_SHIPPING일 때 비활성화 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('key715', '최대 할인 금액 (원)')}</Label>
                <Input
                  disabled={formData.type === CouponType.AMOUNT || isFreeShipping}
                  className={cn(
                    (formData.type === CouponType.AMOUNT || isFreeShipping) && 'bg-muted cursor-not-allowed'
                  )}
                  type="number"
                  value={formData.maxDiscountAmount || 0}
                  onChange={(e) => setFormData({ ...formData, maxDiscountAmount: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>

          {/* Full-width: Coupon Image URL — FREE_SHIPPING일 때 비활성화 */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t('url', '쿠폰 이미지 URL (선택)')}</Label>
            <Input
              placeholder="https://..."
              disabled={isFreeShipping}
              className={cn(isFreeShipping && 'bg-muted cursor-not-allowed')}
              value={formData.imageUrl || ''}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            />
          </div>

          {/* Date Pickers — FREE_SHIPPING 또는 isAutoIssue일 때 숨김/비활성화 */}
          {!formData.isAutoIssue && !isFreeShipping && (
            <div className="grid grid-cols-2 gap-4">
              {/* Start date */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('key716', '시작일')}</Label>
                <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !startDate && 'text-muted-foreground',
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, 'PPP') : <span>{t('key398', '날짜 선택')}</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => {
                        setStartDate(date)
                        setStartDateOpen(false)
                      }}
                      disabled={(date) => date < startOfDay(new Date())}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* End date */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('key717', '종료일')}</Label>
                <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !endDate && 'text-muted-foreground',
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, 'PPP') : <span>{t('key398', '날짜 선택')}</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => {
                        setEndDate(date)
                        setEndDateOpen(false)
                      }}
                      disabled={(date) => date < startOfDay(new Date())}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          {/* Toggle Switches — FREE_SHIPPING일 때 비활성화 */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Switch
                checked={formData.isActive ?? true}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                disabled={isFreeShipping}
                className="data-[state=checked]:bg-black"
              />
              <Label className={cn('text-sm font-medium', isFreeShipping && 'text-muted-foreground')}>
                {t('key718', '활성화')}
              </Label>
            </div>

            {/* Automatic issuance toggle: khi canAutoIssue && hasBeenIssued thì bật nhưng không cho tắt */}
            {/* <div className="flex items-center gap-3">
              <Switch
                checked={formData.isAutoIssue ?? false}
                onCheckedChange={(checked) => setFormData({ ...formData, isAutoIssue: checked })}
                disabled={couponMeta.canAutoIssue && couponMeta.hasBeenIssued}
                className="data-[state=checked]:bg-black"
              />
              <Label className="text-sm font-medium">
                등급별 자동 발급 (매달 1일)
                {couponMeta.canAutoIssue && couponMeta.hasBeenIssued && (
                  <span className="ml-1 text-muted-foreground text-xs">(이미 발급됨 - 해제 불가)</span>
                )}
              </Label>
            </div> */}
            {/* Target Grades Selection — giống create, có targetGrades thì tick sẵn */}
            {/* <div className="space-y-2">
              <Label className="text-sm font-medium">대상 등급 선택</Label>
              {isLoadingMemberships ? (
                <div className="flex items-center justify-center py-4">
                  <Spinner className="h-5 w-5" />
                </div>
              ) : membershipsData && membershipsData.length > 0 ? (
                <>
                  <div className="rounded-lg p-4 space-y-3 max-h-48 overflow-y-auto grid grid-cols-2">
                    {membershipsData.map((membership) => {
                      const isSelected = formData.targetGrades?.includes(membership.name) || false
                      return (
                        <div key={membership.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`membership-${membership.id}`}
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              const currentGrades = formData.targetGrades || []
                              if (checked) {
                                if (!currentGrades.includes(membership.name)) {
                                  setFormData({
                                    ...formData,
                                    targetGrades: [...currentGrades, membership.name],
                                  })
                                }
                              } else {
                                setFormData({
                                  ...formData,
                                  targetGrades: currentGrades.filter((grade) => grade !== membership.name),
                                })
                              }
                            }}
                          />
                          <Label
                            htmlFor={`membership-${membership.id}`}
                            className="text-sm font-normal cursor-pointer flex-1"
                          >
                            {membership.name}
                            {membership.nickName && (
                              <span className="text-muted-foreground ml-2">({membership.nickName})</span>
                            )}
                          </Label>
                        </div>
                      )
                    })}
                  </div>
                  {formData.isAutoIssue && (
                    <>
                      <div className="text-left text-black text-sm">발급일: 매달 1일 (고정)</div>
                      <span className="text-left text-muted-foreground text-sm">
                        선택된 등급의 회원에게 매월 1일에 자동으로 쿠폰이 발급됩니다
                      </span>
                    </>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">등급이 없습니다.</p>
              )}

            </div> */}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={updateCouponMutation.isPending}
          >
            {t('key212', '취소')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={updateCouponMutation.isPending || !formData.name || !formData.code}
            className="bg-foreground text-background"
          >
            {updateCouponMutation.isPending && (
              <Spinner className="mr-2 h-4 w-4" />
            )}
            {t('key288', '수정')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

