'use client'

import { useState } from 'react'
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
import { useCoupon } from '@/hooks/use-coupon/coupon.hook'
import { useMembership } from '@/hooks/use-membership/membership.hook'
import { CouponType } from '@/entities/coupons/coupon.entity'
import { CreateCouponDto } from '@/hooks/use-coupon/coupon.dto'
import { Membership } from '@/entities/membership.entity'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { Checkbox } from '@/components/ui/checkbox'
import { useTranslation } from 'react-i18next'

interface CreateCouponDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateCouponDialog({ open, onOpenChange }: CreateCouponDialogProps) {
  const { t } = useTranslation()
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [startDateOpen, setStartDateOpen] = useState(false)
  const [endDateOpen, setEndDateOpen] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState<CreateCouponDto>({
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
  const { createCoupon } = useCoupon()
  const { getMembership } = useMembership()

  // Fetch memberships
  const { data: membershipsData, isLoading: isLoadingMemberships } = useQuery<Membership[]>({
    queryKey: ['memberships'],
    queryFn: async () => {
      const result = await getMembership(1, 100, 'asc')
      return Array.isArray(result) ? result : []
    },
  })

  // Mutation for creating coupon
  const createCouponMutation = useMutation({
    mutationFn: async (data: CreateCouponDto) => {
      return await createCoupon(data)
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
  }

  // Handle form submission
  const handleSubmit = () => {
    const submitData: CreateCouponDto = {
      name: formData.name,
      code: formData.code,
      type: formData.type,
      startDate: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
      endDate: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
      isActive: formData.isActive,
      isAutoIssue: formData.isAutoIssue,
      imageUrl: formData.imageUrl || undefined,
      // Include fields based on type
      ...(formData.type === CouponType.PERCENT
        ? {
            discountRate: formData.discountRate || undefined,
          }
        : {
            discountAmount: formData.discountAmount || undefined,
          }),
      // Both types can have minPurchaseAmount and maxDiscountAmount
      minPurchaseAmount: formData.minPurchaseAmount || undefined,
      maxDiscountAmount: formData.maxDiscountAmount || undefined,
      // Auto issue day of month (1st of every month)
      autoIssueDayOfMonth: formData.isAutoIssue ? '01' : undefined,
      targetGrades: formData.targetGrades?.length ? formData.targetGrades : undefined,
    }
    createCouponMutation.mutate(submitData)
  }

  // Handle dialog close
  const handleClose = () => {
    onOpenChange(false)
    resetForm()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('key471', '새 쿠폰 만들기')}</DialogTitle>
          <DialogDescription>{t('key719', '새로운 구폰을 생성합니다.')}</DialogDescription>
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

              {/* Coupon type */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('key708', '쿠폰 타입')}</Label>
              <Select
                value={formData.type || CouponType.PERCENT}
                onValueChange={(value) => {
                  const newType = value as CouponType
                  setFormData({ 
                    ...formData, 
                    type: newType,
                  })
                }}
              >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('key709', '쿠폰 타입 선택')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={CouponType.PERCENT}>{t('key710', '할인율 (%)')}</SelectItem>
                    <SelectItem value={CouponType.AMOUNT}>{t('key711', '할인 금액 (원)')}</SelectItem>
                    <SelectItem value={CouponType.FREE_SHIPPING}>{t('key712', '무료 배송')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Minimum purchase amount - luôn có thể nhập (FREE_SHIPPING일 때 비활성화) */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('key713', '최소 구매 금액 (원)')}</Label>
                <Input
                  type="number"
                  disabled={formData.type === CouponType.FREE_SHIPPING}
                  className={cn(
                    formData.type === CouponType.FREE_SHIPPING && 'bg-muted cursor-not-allowed'
                  )}
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

              {/* Discount rate (%) or Discount amount (원) - thay đổi theo type */}
              {formData.type === CouponType.PERCENT ? (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t('key710', '할인율 (%)')}</Label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={formData.discountRate && formData.discountRate >= 1 ? formData.discountRate : ''}
                    placeholder="1–100"
                    onChange={(e) => {
                      const raw = e.target.value
                      if (raw === '') {
                        setFormData({ ...formData, discountRate: 0 })
                        return
                      }
                      const num = Number(raw)
                      if (Number.isNaN(num)) return
                      const clamped = Math.min(100, Math.max(1, num))
                      setFormData({ ...formData, discountRate: clamped })
                    }}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t('key711', '할인 금액 (원)')}</Label>
                  <Input
                    type="number"
                    disabled={formData.type === CouponType.FREE_SHIPPING}
                    className={cn(
                      formData.type === CouponType.FREE_SHIPPING && 'bg-muted cursor-not-allowed'
                    )}
                    value={formData.discountAmount || 0}
                    onChange={(e) => setFormData({ ...formData, discountAmount: Number(e.target.value) })}
                  />
                </div>
              )}

              {/* Maximum discount amount - luôn có thể nhập */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('key715', '최대 할인 금액 (원)')}</Label>
                <Input
                  disabled={formData.type === CouponType.AMOUNT || formData.type === CouponType.FREE_SHIPPING}
                  className={cn(
                    (formData.type === CouponType.AMOUNT || formData.type === CouponType.FREE_SHIPPING) &&
                      'bg-muted cursor-not-allowed'
                  )}
                  type="number"
                  value={formData.maxDiscountAmount || 0}
                  onChange={(e) => setFormData({ ...formData, maxDiscountAmount: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>

          {/* Full-width: Coupon Image URL */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t('url', '쿠폰 이미지 URL (선택)')}</Label>
            <Input
              placeholder="https://..."
              value={formData.imageUrl || ''}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            />
          </div>

          {/* Date Pickers - Side by side */}
          <div className="grid grid-cols-2 gap-4">
            {/* Start date */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('key716', '시작일')}</Label>
              <Popover open={startDateOpen} onOpenChange={formData.isAutoIssue ? undefined : setStartDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={formData.isAutoIssue}
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !startDate && 'text-muted-foreground',
                      formData.isAutoIssue && 'bg-muted cursor-not-allowed',
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
              <Popover open={endDateOpen} onOpenChange={formData.isAutoIssue ? undefined : setEndDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={formData.isAutoIssue}
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !endDate && 'text-muted-foreground',
                      formData.isAutoIssue && 'bg-muted cursor-not-allowed',
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

          {/* Toggle Switches */}
          <div className="space-y-4">
            {/* Activate toggle */}
            <div className="flex items-center gap-3">
              <Switch
                checked={formData.isActive ?? true}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                className="data-[state=checked]:bg-black"
              />
              <Label className="text-sm font-medium">{t('key718', '활성화')}</Label>
            </div>

            {/* Automatic issuance toggle */}
            <div className="flex items-center gap-3 border-t pt-4">
              <Switch
                checked={formData.isAutoIssue ?? false}
                onCheckedChange={(checked) => {
                  setFormData({ ...formData, isAutoIssue: checked })
                  if (checked) {
                    setStartDate(undefined)
                    setEndDate(undefined)
                    setStartDateOpen(false)
                    setEndDateOpen(false)
                  }
                }}
                className="data-[state=checked]:bg-black"
              />
              <Label className="text-sm font-medium">{t('129', '등급별 자동 발급 (매달 1일)')}</Label>
            </div>

            {/* Target Grades Selection — always available */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('key720', '대상 등급 선택')}</Label>
              <p className="text-xs text-muted-foreground">
                {t('lv2TargetgradesAposlv2Apos', '예: LV2. 새싹 선택 시 targetGrades에 &apos;LV2. 새싹&apos; 전송')}
              </p>
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
                              <span className="text-muted-foreground ml-2">{t('nickname', '({{nickName}})', { nickName: membership.nickName })}</span>
                            )}
                          </Label>
                        </div>
                      )
                    })}
                  </div>
                  {formData.isAutoIssue && (
                    <>
                      <div className="text-left text-black text-sm">{t('130', '발급일: 매달 1일 (고정)')}</div>
                      <span className="text-left text-muted-foreground text-sm">
                        {t('131', '선택된 등급의 회원에게 매월 1일에 자동으로 쿠폰이 발급됩니다')}
                      </span>
                    </>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">{t('key721', '등급이 없습니다.')}</p>
              )}
              {formData.targetGrades && formData.targetGrades.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {t('key722', '선택된 등급:')} {formData.targetGrades.join(', ')}
                </p>
              )}
            </div>


          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={createCouponMutation.isPending}
          >
            {t('key212', '취소')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              createCouponMutation.isPending ||
              !formData.name ||
              !formData.code ||
              (formData.type === CouponType.PERCENT &&
                (formData.discountRate == null || formData.discountRate < 1 || formData.discountRate > 100))
            }
            className="bg-foreground text-background"
          >
            {createCouponMutation.isPending && (
              <Spinner className="mr-2 h-4 w-4" />
            )}
            {t('key513', '생성')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

