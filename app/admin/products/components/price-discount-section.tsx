"use client"

import { useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { useTranslation, Trans } from 'react-i18next'

interface PriceDiscountSectionProps {
  consumerPrice: number | undefined
  salePrice: number | undefined
  discountRate: number | undefined
  discountStartDate: Date | undefined
  discountEndDate: Date | undefined
  onConsumerPriceChange: (value: number | undefined) => void
  onSalePriceChange: (value: number | undefined) => void
  onDiscountStartDateChange: (value: Date | undefined) => void
  onDiscountEndDateChange: (value: Date | undefined) => void
  onDiscountRateChange: (rate: number) => void
}

export function PriceDiscountSection({
  consumerPrice,
  salePrice,
  discountRate,
  discountStartDate,
  discountEndDate,
  onConsumerPriceChange,
  onSalePriceChange,
  onDiscountStartDateChange,
  onDiscountEndDateChange,
  onDiscountRateChange,
}: PriceDiscountSectionProps) {
  const { t } = useTranslation()
  const isDiscountPeriodDisabled = !discountRate || discountRate === 0

  const calculateDiscountRate = (regular: number | undefined, sale: number | undefined) => {
    const regularPrice = regular || 0
    const salePriceValue = sale || 0
    if (regularPrice > 0 && salePriceValue < regularPrice) {
      const rate = ((regularPrice - salePriceValue) / regularPrice) * 100
      const rateValue = Math.round(rate)
      onDiscountRateChange(rateValue)
    } else {
      onDiscountRateChange(0)
    }
  }

  // Calculate discount rate when consumerPrice or salePrice changes
  useEffect(() => {
    if (consumerPrice && salePrice) {
      calculateDiscountRate(consumerPrice, salePrice)
    } else {
      onDiscountRateChange(0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consumerPrice, salePrice])

  // If discountRate becomes 0, clear discount period
  useEffect(() => {
    if (isDiscountPeriodDisabled) {
      onDiscountStartDateChange(undefined)
      onDiscountEndDateChange(undefined)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDiscountPeriodDisabled])

  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="mb-4 text-lg font-semibold">{t('key658', '가격 및 할인')}</h2>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="regularPrice">{t('key346', '정가')}</Label>
              <Input
                id="regularPrice"
                type="number"
                placeholder="0"
                className="bg-white"
                value={consumerPrice || ""}
                onChange={(e) => {
                  const value = Number.parseFloat(e.target.value) || undefined
                  onConsumerPriceChange(value)
                  calculateDiscountRate(value, salePrice)
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salePrice"><Trans i18nKey="spanClassnametextdestructivespan">판매가 <span className="text-destructive">*</span></Trans></Label>
              <Input
                id="salePrice"
                type="number"
                placeholder="0"
                className="bg-white"
                value={salePrice || ""}
                onChange={(e) => {
                  const value = Number.parseFloat(e.target.value) || undefined
                  onSalePriceChange(value)
                  calculateDiscountRate(consumerPrice, value)
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('key480', '할인율')}</Label>
              <Input value={discountRate?.toString() + '%' || "0%"} type= "text" readOnly className="bg-white"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="discountStart">{t('key659', '할인 시작일')}</Label>
              <Input
                type="date"
                id="discountStart"
                disabled={isDiscountPeriodDisabled}
                className={isDiscountPeriodDisabled ? "bg-muted cursor-not-allowed" : "bg-white"}
                value={
                  discountStartDate
                    ? new Date(discountStartDate).toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  onDiscountStartDateChange(
                    e.target.value ? new Date(e.target.value) : undefined
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discountEnd">{t('key660', '할인 종료일')}</Label>
              <Input
                type="date"
                id="discountEnd"
                disabled={isDiscountPeriodDisabled}
                className={isDiscountPeriodDisabled ? "bg-muted cursor-not-allowed" : "bg-white"}
                value={
                  discountEndDate
                    ? new Date(discountEndDate).toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  onDiscountEndDateChange(
                    e.target.value ? new Date(e.target.value) : undefined
                  )
                }
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

