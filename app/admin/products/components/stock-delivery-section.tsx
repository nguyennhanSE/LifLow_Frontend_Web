"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { useTranslation } from 'react-i18next'

interface StockDeliverySectionProps {
  deliveryMethod: string
  deliveryFeeInput: string
  origin?: string
  stockManagement: boolean
  sameDayDelivery: boolean
  onDeliveryMethodChange: (value: string) => void
  onDeliveryFeeInputChange: (value: string) => void
  onOriginChange: (value: string) => void
  onStockManagementChange: (value: boolean) => void
  onSameDayDeliveryChange: (value: boolean) => void
}

export function StockDeliverySection({
  deliveryMethod,
  deliveryFeeInput,
  origin,
  stockManagement,
  sameDayDelivery,
  onDeliveryMethodChange,
  onDeliveryFeeInputChange,
  onOriginChange,
  onStockManagementChange,
  onSameDayDeliveryChange,
}: StockDeliverySectionProps) {
  const { t } = useTranslation()
  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="mb-4 text-lg font-semibold">{t('key641', '제고 및 배송')}</h2>
        <div className="space-y-4">
          <div className="pb-4 border-b">
            <div className="flex gap-4">
              <div className="space-y-2 flex-1">
                <Label htmlFor="origin">{t('key642', '원산지')}</Label>
                <Input 
                  id="origin" 
                  type="text" 
                  value={origin || ""} 
                  className="bg-white"
                  placeholder={t('key643', '예: 대한민국')}
                  onChange={(e) => onOriginChange(e.target.value)}
                />
              </div>
              {/* <div className="flex-1 space-y-2 grid justify-start items-end">
                <Label className="font-semibold">Inventory Management</Label>
                <div className="flex items-center gap-3">
                  <Switch id="stockManagement" checked={stockManagement} onCheckedChange={onStockManagementChange} />
                  <Label htmlFor="stockManagement" className="font-normal cursor-pointer">
                    Use inventory management
                  </Label>
                </div>
              </div> */}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="deliveryMethod">{t('key644', '배송 방법')}</Label>
              <Select value={deliveryMethod || ""} onValueChange={onDeliveryMethodChange}>
                <SelectTrigger id="deliveryMethod" className="bg-white w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {/* <SelectItem value="standard">Standard</SelectItem> */}
                  <SelectItem value="regular">{t('key645', '일반 배송')}</SelectItem>
                  <SelectItem value="quick">{t('key646', '빠른 배송')}</SelectItem>
                  <SelectItem value="direct">{t('key647', '직접 배송')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deliveryFee">{t('key192', '배송비')}</Label>
              <Input
                id="deliveryFee"
                type="number"
                value={deliveryFeeInput || ""}
                className="bg-white"
                onChange={(e) => onDeliveryFeeInputChange(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {/* <div className="space-y-2">
              <Label htmlFor="freeDeliveryThreshold">Free shipping threshold amount</Label>
              <Input id="freeDeliveryThreshold" type="number" defaultValue="50000" className="bg-white" />
            </div> */}
            {/* <div className="space-y-2 grid justify-start items-end">
              <Label className="font-semibold">Departing today</Label>
              <div className="flex items-center gap-3">
                <Switch id="sameDayDelivery" checked={sameDayDelivery} onCheckedChange={onSameDayDeliveryChange} />
                <Label htmlFor="sameDayDelivery" className="font-normal cursor-pointer">
                  Products departing today
                </Label>
              </div>
            </div> */}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

