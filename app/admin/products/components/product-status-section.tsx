"use client"

import { useState, useMemo } from "react"
import { addDays, format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Spinner } from "@/components/ui/spinner"
import { useProduct } from "@/hooks/use-product/product.hook"
import { ProductBadge, CreateProductSpecialOfferDto } from "@/hooks/use-product/product.dto"

interface WeeklyDealForm {
  discountAmount: number
  startDate: Date
  endDate: Date
}

interface ProductStatusSectionProps {
  saleStatus: string
  displayStatus: "Y" | "N"
  hotDeal: boolean
  newProduct: boolean
  weeklySpecial: boolean
  bestProduct: boolean
  consumerPrice?: number
  salePrice?: number
  productId?: string | null
  onSaleStatusChange: (value: string) => void
  onDisplayStatusChange: (value: "Y" | "N") => void
  onHotDealChange: (value: boolean) => void
  onNewProductChange: (value: boolean) => void
  onWeeklySpecialChange: (value: boolean) => void
  onBestProductChange: (value: boolean) => void
  onWeeklySpecialSubmit?: (formData: WeeklyDealForm) => void
  onProductBadgesChange?: (badges: ProductBadge) => void
  onSpecialOfferChange?: (specialOffer: CreateProductSpecialOfferDto | null) => void
  /** When provided, turning off weekly special will call this (e.g. updateProductById with specialOffer.status = false) and show loader */
  onTurnOffWeeklySpecial?: (productId: string) => Promise<void>
}

function formatCurrency(value: number) {
  return value.toLocaleString('ko-KR')
}

export function ProductStatusSection({
  saleStatus,
  displayStatus,
  hotDeal,
  newProduct,
  weeklySpecial,
  bestProduct,
  consumerPrice,
  salePrice,
  productId,
  onSaleStatusChange,
  onDisplayStatusChange,
  onHotDealChange,
  onNewProductChange,
  onWeeklySpecialChange,
  onBestProductChange,
  onWeeklySpecialSubmit,
  onProductBadgesChange,
  onSpecialOfferChange,
  onTurnOffWeeklySpecial,
}: ProductStatusSectionProps) {
  const [isWeeklySpecialDialogOpen, setIsWeeklySpecialDialogOpen] = useState(false)
  const [isTurningOffWeeklySpecial, setIsTurningOffWeeklySpecial] = useState(false)
  const [isSettingWeeklySpecial, setIsSettingWeeklySpecial] = useState(false)
  const { createSpecialOffer } = useProduct()
  const [weeklyDealForm, setWeeklyDealForm] = useState<WeeklyDealForm>({
    discountAmount: 1000,
    startDate: new Date(),
    endDate: addDays(new Date(), 7),
  })

  const dealPrice = useMemo(() => {
    const basePrice = salePrice || 0
    return Math.max(basePrice - (weeklyDealForm.discountAmount || 0), 0)
  }, [consumerPrice, salePrice, weeklyDealForm.discountAmount])

  const discountRate = useMemo(() => {
    const basePrice = consumerPrice || salePrice || 0
    if (basePrice > 0 && weeklyDealForm.discountAmount > 0) {
      return Math.round((weeklyDealForm.discountAmount / basePrice) * 100)
    }
    return 0
  }, [consumerPrice, salePrice, weeklyDealForm.discountAmount])

  const handleWeeklySpecialToggle = async (checked: boolean) => {
    if (checked) {
      setIsWeeklySpecialDialogOpen(true)
      setWeeklyDealForm({
        discountAmount: 1000,
        startDate: new Date(),
        endDate: addDays(new Date(), 7),
      })
    } else {
      if (productId && onTurnOffWeeklySpecial) {
        setIsTurningOffWeeklySpecial(true)
        try {
          await onTurnOffWeeklySpecial(productId)
          onWeeklySpecialChange(false)
          if (onSpecialOfferChange) {
            onSpecialOfferChange(null)
          }
        } finally {
          setIsTurningOffWeeklySpecial(false)
        }
      } else {
        onWeeklySpecialChange(false)
        if (onSpecialOfferChange) {
          onSpecialOfferChange(null)
        }
      }
    }
  }

  const handleWeeklySpecialSubmit = async () => {
    if (onWeeklySpecialSubmit) {
      onWeeklySpecialSubmit(weeklyDealForm)
    }
    
    // Create specialOffer object
    if (onSpecialOfferChange) {
      const specialOffer: CreateProductSpecialOfferDto = {
        status: true,
        discountAmount: weeklyDealForm.discountAmount,
        specialPriceApplied: dealPrice,
        startDate: weeklyDealForm.startDate,
        endDate: weeklyDealForm.endDate,
      }
      // If we have a productId, persist via API immediately
      if (productId) {
        setIsSettingWeeklySpecial(true)
        try {
          await createSpecialOffer(productId, specialOffer)
          toast.success("이번주 특가 설정이 완료되었습니다.")
        } catch {
          toast.error("이번주 특가 설정에 실패했습니다.")
          return
        } finally {
          setIsSettingWeeklySpecial(false)
        }
      }

      onSpecialOfferChange(specialOffer)
    }
    
    onWeeklySpecialChange(true)
    setIsWeeklySpecialDialogOpen(false)
  }
  
  const handleWeeklySpecialCancel = () => {
    setIsWeeklySpecialDialogOpen(false)
    onWeeklySpecialChange(false)
    // Clear specialOffer when cancelled
    if (onSpecialOfferChange) {
      onSpecialOfferChange(null)
    }
  }

  // Update productBadges when badge switches change
  const updateProductBadges = (hotDealValue: boolean, newProductValue: boolean, bestProductValue: boolean) => {
    if (onProductBadgesChange) {
      const badges: ProductBadge = {
        isHotDeal: hotDealValue,
        isNewProduct: newProductValue,
        isBestSeller: bestProductValue,
      }
      onProductBadgesChange(badges)
    }
  }

  const handleHotDealChange = (value: boolean) => {
    onHotDealChange(value)
    updateProductBadges(value, newProduct, bestProduct)
  }

  const handleNewProductChange = (value: boolean) => {
    onNewProductChange(value)
    updateProductBadges(hotDeal, value, bestProduct)
  }

  const handleBestProductChange = (value: boolean) => {
    onBestProductChange(value)
    updateProductBadges(hotDeal, newProduct, value)
  }

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <h2 className="mb-4 text-lg font-semibold">태그</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="hotDeal" className="font-normal">
                  Hot Deal
                </Label>
                {hotDeal && (
                  <Badge className="bg-orange-100 text-orange-500 border border-orange-500">핫딜</Badge>
                )}
              </div>
              <Switch id="hotDeal" checked={hotDeal} onCheckedChange={handleHotDealChange} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="newProduct" className="font-normal">
                  New products
                </Label>
                {newProduct && (
                  <Badge className="bg-blue-100 text-blue-500 border border-blue-500">신상품</Badge>
                )}
              </div>
              <Switch id="newProduct" checked={newProduct} onCheckedChange={handleNewProductChange} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="weeklySpecial" className="font-normal">
                  Specials this week
                </Label>
                {weeklySpecial && (
                  <Badge className="bg-white text-orange-500 border border-orange-500">
                    {discountRate > 0 ? `${discountRate}%` : ''}
                  </Badge>
                )}
              </div>
              <Dialog open={isWeeklySpecialDialogOpen} onOpenChange={setIsWeeklySpecialDialogOpen}>
                <div className="relative inline-flex items-center">
                  {weeklySpecial && isTurningOffWeeklySpecial && (
                    <span className="absolute inset-0 flex items-center justify-center z-10 bg-background/80 rounded-md">
                      <Spinner className="size-5" />
                    </span>
                  )}
                  <Switch
                    id="weeklySpecial"
                    checked={weeklySpecial}
                    disabled={isTurningOffWeeklySpecial}
                    onCheckedChange={handleWeeklySpecialToggle}
                  />
                </div>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>이번주 특가 설정</DialogTitle>
                    <DialogDescription className='text-muted-foreground text-sm'>
                      특가 할인율과 기간을 설정합니다
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-5 py-2">
                    {/* Price Summary */}
                    <div className="rounded-lg bg-orange-50 p-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">정가</span>
                        <span className="text-gray-500 line-through">
                          {formatCurrency(salePrice || 0)}원
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-orange-600">
                        <span>할인금액</span>
                        <span>
                          -{formatCurrency(weeklyDealForm.discountAmount || 0)}원
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-sm font-semibold">특가 적용 가격</span>
                        <span className="text-xl font-bold text-orange-600">
                          {formatCurrency(dealPrice)}원
                        </span>
                      </div>
                    </div>

                    {/* Discount Input */}
                    <div className="space-y-2">
                      <Label htmlFor="discountAmount" className="text-sm font-semibold">
                        특가 할인금액 (원)
                      </Label>
                      <Input
                        id="discountAmount"
                        type="number"
                        value={weeklyDealForm.discountAmount}
                        onChange={(e) =>
                          setWeeklyDealForm((prev) => ({
                            ...prev,
                            discountAmount: Number(e.target.value || 0),
                          }))
                        }
                        className="text-base"
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>특가 시작 시간</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-between text-left font-normal"
                            >
                              {format(weeklyDealForm.startDate, 'yyyy.MM.dd (EEE)', { locale: ko })}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="p-0">
                            <Calendar
                              mode="single"
                              disabled
                              selected={weeklyDealForm.startDate}
                              onSelect={(date) =>
                                date &&
                                setWeeklyDealForm((prev) => ({
                                  ...prev,
                                  startDate: date,
                                }))
                              }
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label>특가 종료 시간</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-between text-left font-normal"
                            >
                              {format(weeklyDealForm.endDate, 'yyyy.MM.dd (EEE)', { locale: ko })}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="p-0">
                            <Calendar
                              mode="single"
                              selected={weeklyDealForm.endDate}
                              onSelect={(date) =>
                                date &&
                                setWeeklyDealForm((prev) => ({
                                  ...prev,
                                  endDate: date,
                                }))
                              }
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={handleWeeklySpecialCancel}
                    >
                      취소
                    </Button>
                    <Button
                      className="bg-black text-white hover:bg-black/90"
                      type="button"
                      onClick={handleWeeklySpecialSubmit}
                      disabled={isSettingWeeklySpecial}
                    >
                      {isSettingWeeklySpecial ? (
                        <span className="inline-flex items-center gap-2">
                          <Spinner className="size-4" />
                          설정 중...
                        </span>
                      ) : (
                        "설정 완료"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="bestProduct" className="font-normal">
                  Best
                </Label>
                {bestProduct && (
                  <Badge className="bg-purple-100 text-purple-500 border border-purple-500">BEST</Badge>
                )}
              </div>
              <Switch id="bestProduct" checked={bestProduct} onCheckedChange={handleBestProductChange} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h2 className="mb-4 text-lg font-semibold">상태</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">판매 상태</Label>
              <Select value={saleStatus || ''} onValueChange={onSaleStatusChange}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Y">판매중</SelectItem>
                  <SelectItem value="N">품절</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">노출 상태</Label>
              <Select
                value={displayStatus}
                onValueChange={(v) => onDisplayStatusChange(v as "Y" | "N")}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Y">노출</SelectItem>
                  <SelectItem value="N">숨김</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

