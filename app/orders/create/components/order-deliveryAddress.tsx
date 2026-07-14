"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useUser } from "@/hooks/use-user/user.hook"
import { useToast } from "@/hooks/use-toast"

interface ShippingAddress {
  id: string
  name: string
  addressFull: string
  address?: string
  postalCode: number
  phoneNumber?: string
  isDefault?: boolean
  setAsDefault?: boolean
  recipientName?: string
  deliveryAddress?: string
}

interface OrderDeliveryAddressProps {
  onSelectedAddressChange?: (addressId: string) => void
  onAddNewAddressClick?: () => void
  refreshTrigger?: number
}

export function OrderDeliveryAddress({
  onSelectedAddressChange,
  onAddNewAddressClick,
  refreshTrigger,
}: OrderDeliveryAddressProps) {
  const { getMyDeliveryAddress } = useUser()
  const { toast } = useToast()
  const [addresses, setAddresses] = useState<ShippingAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAddresses = async () => {
      try {
        setLoading(true)
        const data = await getMyDeliveryAddress()
        setAddresses(data || [])
        
        // Auto-select default address
        if (data && data.length > 0) {
          const defaultAddress = data.find(
            (addr: ShippingAddress) => addr.isDefault === true || addr.setAsDefault === true
          )
          if (defaultAddress) {
            setSelectedAddressId(defaultAddress.id)
            onSelectedAddressChange?.(defaultAddress.id)
          } else {
            // If no default, select first address
            setSelectedAddressId(data[0].id)
            onSelectedAddressChange?.(data[0].id)
          }
        }
      } catch (error) {
        console.error('Error loading delivery addresses:', error)
        toast({
          title: "오류",
          description: "배송 주소를 불러오는데 실패했습니다",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadAddresses()
  }, [getMyDeliveryAddress, toast, refreshTrigger])

  if (loading) {
    return (
      <div className="border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">배송지 정보</h2>
        <div className="text-center py-4 text-muted-foreground">주소를 불러오는 중...</div>
      </div>
    )
  }

  if (addresses.length === 0) {
    return (
      <div className="border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">배송지 정보</h2>
        <div className="text-center py-4 text-muted-foreground">등록된 배송지가 없습니다</div>
        <Button
          variant="outline"
          className="w-full bg-transparent mt-4"
          onClick={onAddNewAddressClick}
        >
          새 배송지 추가
        </Button>
      </div>
    )
  }

  return (
    <div className="border rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4">배송지 정보</h2>
      <RadioGroup value={selectedAddressId} onValueChange={(value) => {
        setSelectedAddressId(value)
        onSelectedAddressChange?.(value)
      }}>
        <div className="space-y-4">
          {addresses.map((address) => {
            const isDefault = address.isDefault === true || address.setAsDefault === true
            const isSelected = selectedAddressId === address.id
            return (
              <div
                key={address.id}
                className={`flex items-start gap-4 rounded-lg p-4 border-2 transition-all cursor-pointer ${
                  isSelected
                    ? "border-[#FF6B5A] bg-[#FF6B5A]/5"
                    : isDefault
                    ? "border-[#FF6B5A]/50 bg-muted/30"
                    : "border-gray-200 bg-muted/50 hover:border-gray-300"
                }`}
                onClick={() => {
                  setSelectedAddressId(address.id)
                  onSelectedAddressChange?.(address.id)
                }}
              >
                <div className="shrink-0 pt-0.5">
                  <RadioGroupItem
                    value={address.id}
                    id={address.id}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {isDefault && <span className="text-[#FF6B5A] text-sm">★</span>}
                    <span className="font-medium text-base">
                      {address.deliveryAddress || address.name || 'Address'}
                    </span>
                    {isDefault && (
                      <span className="text-[#FF6B5A] text-xs ml-1">기본 배송지</span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground space-y-0.5">
                    <p className="leading-relaxed">{address.deliveryAddress || address.name || "-"}</p>
                    <p className="leading-relaxed">{address.recipientName || "-"} | {address.phoneNumber || "-"}</p>
                    <p className="leading-relaxed">({address.postalCode ?? "-"}) {address.address || "-"}</p>
                    <p className="leading-relaxed">{address.addressFull || "-"}</p>
                  </div>
                </div>
              </div>
            )
          })}

          <Button
            variant="outline"
            className="w-full bg-transparent mt-6"
            onClick={onAddNewAddressClick}
          >
            새 배송지 추가
          </Button>
        </div>
      </RadioGroup>
    </div>
  )
}
