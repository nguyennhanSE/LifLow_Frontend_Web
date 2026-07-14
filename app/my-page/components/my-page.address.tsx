"use client"

import { useEffect, useState } from "react"
import { Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useUser } from "@/hooks/use-user/user.hook"
import { CreateShippingAddressDto, UpdateShippingAddressDto } from "@/hooks/use-user/user.dto"
import { useToast } from "@/hooks/use-toast"
import { PostalCodeButton } from "@/components/common/PostalCodeButton"
import { cn } from "@/lib/utils"
import { useTranslation } from 'react-i18next'

interface ShippingAddress {
  id?: string
  name?: string
  isDefault?: boolean

  deliveryAddress?: string
  recipientName?: string
  phoneNumber?: string
  postalCode?: number
  address?: string
  addressFull?: string
  setAsDefault?: boolean
}

export default function MyPageAddress() {
  const { t } = useTranslation()
  const [addresses, setAddresses] = useState<ShippingAddress[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    deliveryAddress: "",
    recipientName: "",
    phoneNumber: "",
    postalCode: "",
    address: "",
    addressFull: "",
    setAsDefault: false,
  })

  const [editFormData, setEditFormData] = useState({
    deliveryAddress: "",
    recipientName: "",
    phoneNumber: "",
    postalCode: "",
    address: "",
    addressFull: "",
    setAsDefault: false,
  })

  const {
    getMyDeliveryAddress,
    addMyDeliveryAddress,
    updateMyDeliveryAddress,
    deleteMyDeliveryAddress,
  } = useUser()
  const { toast } = useToast()

  // Load addresses on mount
  useEffect(() => {
    loadAddresses()
  }, [])

  const loadAddresses = async () => {
    try {
      setIsLoading(true)
      const data = await getMyDeliveryAddress()
      setAddresses(data)
    } catch (error) {
      toast({
        title: "오류",
        description: t('key304', '배송지 주소를 불러오는데 실패했습니다'),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddAddress = async () => {
    // Validation
    if (!formData.deliveryAddress.trim()) {
      toast({
        title: "오류",
        description: t('key172', '배송지명을 입력해주세요'),
        variant: "destructive",
      })
      return
    }
    if (!formData.recipientName.trim()) {
      toast({
        title: "오류",
        description: t('key173', '받는 사람 이름을 입력해주세요'),
        variant: "destructive",
      })
      return
    }
    if (!formData.phoneNumber.trim()) {
      toast({
        title: "오류",
        description: t('key174', '연락처를 입력해주세요'),
        variant: "destructive",
      })
      return
    }
    if (!formData.postalCode.trim()) {
      toast({
        title: "오류",
        description: t('key175', '우편번호를 입력해주세요'),
        variant: "destructive",
      })
      return
    }
    if (!formData.address.trim()) {
      toast({
        title: "오류",
        description: t('key176', '주소를 입력해주세요'),
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      
      // Prepare data according to CreateShippingAddressDto
      const addressData: CreateShippingAddressDto = {
        deliveryAddress: formData.deliveryAddress.trim(),
        recipientName: formData.recipientName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        postalCode: parseInt(formData.postalCode) || 0,
        address: formData.address.trim(),
        addressFull: formData.addressFull.trim(),
        setAsDefault: formData.setAsDefault,
      }
      
      console.log("Sending address data:", addressData)
      await addMyDeliveryAddress(addressData)
      toast({
        title: "성공",
        description: t('key177', '배송지 주소가 성공적으로 추가되었습니다'),
      })
      setIsDialogOpen(false)
      setFormData({
        deliveryAddress: "",
        recipientName: "",
        phoneNumber: "",
        postalCode: "",
        address: "",
        addressFull: "",
        setAsDefault: false,
      })
      loadAddresses()
    } catch (error: any) {
      console.error("Error adding address:", error)
      toast({
        title: "오류",
        description: error?.response?.data?.message || t('key178', '배송지 주소 추가에 실패했습니다'),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const openEditDialog = (address: ShippingAddress) => {
    if (!address.id) {
      toast({
        title: "오류",
        description: t('id', '배송지 ID를 찾을 수 없습니다'),
        variant: "destructive",
      })
      return
    }

    setEditingAddressId(address.id)
    setEditFormData({
      deliveryAddress: address.deliveryAddress || address.name || "",
      recipientName: address.recipientName || "",
      phoneNumber: address.phoneNumber || "",
      postalCode: typeof address.postalCode === "number" ? String(address.postalCode) : "",
      address: address.address || "",
      addressFull: address.addressFull || "",
      setAsDefault: address.setAsDefault === true || address.isDefault === true,
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateAddress = async () => {
    if (!editingAddressId) {
      toast({
        title: "오류",
        description: t('key305', '수정할 배송지를 선택해주세요'),
        variant: "destructive",
      })
      return
    }

    // Validation
    if (!editFormData.deliveryAddress.trim()) {
      toast({
        title: "오류",
        description: t('key172', '배송지명을 입력해주세요'),
        variant: "destructive",
      })
      return
    }
    if (!editFormData.recipientName.trim()) {
      toast({
        title: "오류",
        description: t('key173', '받는 사람 이름을 입력해주세요'),
        variant: "destructive",
      })
      return
    }
    if (!editFormData.phoneNumber.trim()) {
      toast({
        title: "오류",
        description: t('key174', '연락처를 입력해주세요'),
        variant: "destructive",
      })
      return
    }
    if (!editFormData.postalCode.trim()) {
      toast({
        title: "오류",
        description: t('key175', '우편번호를 입력해주세요'),
        variant: "destructive",
      })
      return
    }
    if (!editFormData.address.trim() && !editFormData.addressFull.trim()) {
      toast({
        title: "오류",
        description: t('key176', '주소를 입력해주세요'),
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)

      const addressData: UpdateShippingAddressDto = {
        deliveryAddress: editFormData.deliveryAddress.trim(),
        recipientName: editFormData.recipientName.trim(),
        phoneNumber: editFormData.phoneNumber.trim(),
        postalCode: parseInt(editFormData.postalCode) || 0,
        address: editFormData.address.trim(),
        addressFull: editFormData.addressFull.trim(),
        setAsDefault: editFormData.setAsDefault,
      }

      await updateMyDeliveryAddress(editingAddressId, addressData)
      toast({
        title: "성공",
        description: t('key306', '배송지 주소가 성공적으로 수정되었습니다'),
      })

      setIsEditDialogOpen(false)
      setEditingAddressId(null)
      setEditFormData({
        deliveryAddress: "",
        recipientName: "",
        phoneNumber: "",
        postalCode: "",
        address: "",
        addressFull: "",
        setAsDefault: false,
      })
      loadAddresses()
    } catch (error: any) {
      console.error("Error updating address:", error)
      toast({
        title: "오류",
        description: error?.response?.data?.message || t('key307', '배송지 주소 수정에 실패했습니다'),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAddress = async (address: ShippingAddress) => {
    if (!address.id) {
      toast({
        title: "오류",
        description: t('id', '배송지 ID를 찾을 수 없습니다'),
        variant: "destructive",
      })
      return
    }

    const ok = window.confirm("이 배송지를 삭제할까요?")
    if (!ok) return

    try {
      setIsLoading(true)
      await deleteMyDeliveryAddress(address.id)
      toast({
        title: "성공",
        description: t('key308', '배송지가 삭제되었습니다'),
      })
      loadAddresses()
    } catch (error: any) {
      console.error("Error deleting address:", error)
      toast({
        title: "오류",
        description: error?.response?.data?.message || t('key309', '배송지 삭제에 실패했습니다'),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetDefaultAddress = async (address: ShippingAddress) => {
    if (!address.id) {
      toast({
        title: "오류",
        description: t('id', '배송지 ID를 찾을 수 없습니다'),
        variant: "destructive",
      })
      return
    }

    const deliveryAddress = address.deliveryAddress || address.name || ""
    const recipientName = address.recipientName || ""
    const phoneNumber = address.phoneNumber || ""
    const postalCode = typeof address.postalCode === "number" ? address.postalCode : 0
    const addr = address.address || ""
    const addressFull = address.addressFull || ""

    // Guard: update API needs full payload
    if (!deliveryAddress.trim() || !recipientName.trim() || !phoneNumber.trim() || !postalCode) {
      toast({
        title: "오류",
        description: t('key310', '배송지 정보가 부족하여 기본 배송지로 설정할 수 없습니다'),
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      const dto: UpdateShippingAddressDto = {
        deliveryAddress: deliveryAddress.trim(),
        recipientName: recipientName.trim(),
        phoneNumber: phoneNumber.trim(),
        postalCode,
        address: addr.trim(),
        addressFull: addressFull.trim(),
        setAsDefault: true,
      }
      await updateMyDeliveryAddress(address.id, dto)
      toast({
        title: "성공",
        description: t('key311', '기본 배송지로 설정되었습니다'),
      })
      loadAddresses()
    } catch (error: any) {
      console.error("Error setting default address:", error)
      toast({
        title: "오류",
        description: error?.response?.data?.message || t('key312', '기본 배송지 설정에 실패했습니다'),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 w-full max-w-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t('key228', '배송지 관리')}</h1>
        <Button 
          className="bg-[#ff5833] hover:bg-[#e64d2e] text-white px-6"
          onClick={() => setIsDialogOpen(true)}
        >
          {t('key199', '새 배송지 추가')}
        </Button>
      </div>

      {/* Address Cards */}
      {isLoading ? (
        <div className="text-center py-8">{t('key74', '로딩 중...')}</div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-8 text-gray-500">{t('key313', '배송지가 없습니다')}</div>
      ) : (
        <div className="space-y-6">
          {addresses.map((address, idx) => {
            const title = address.deliveryAddress || address.name || "배송지"
            const isDefault = address.isDefault === true || address.setAsDefault === true
            const key = address.id || `${title}-${address.postalCode ?? "no-postal"}-${idx}`

            return (
            <div key={key} className="border border-gray-200 rounded-lg p-6 relative bg-white">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-medium">{title}</h3>
                  {isDefault && (
                    <span className="bg-[#ff5833] text-white text-sm px-3 py-1 rounded">
                      {t('key314', '기본 배송지')}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={t('editAddress', 'Edit address')}
                    className="border-gray-300 hover:bg-gray-50 bg-transparent"
                    disabled={!address.id}
                    onClick={() => openEditDialog(address)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={t('deleteAddress', 'Delete address')}
                    className="border-gray-300 hover:bg-gray-50 bg-transparent"
                    disabled={!address.id}
                    onClick={() => handleDeleteAddress(address)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-1 text-gray-600 mb-4">
                <p>{address.deliveryAddress || address.name || "-"}</p>
                <p>{address.recipientName || "-"} | {address.phoneNumber || "-"}</p>
                <p>({address.postalCode ?? "-"}) {address.address || "-"}</p>
                <p>{address.addressFull || "-"}</p>
              </div>

              {!isDefault && (
                <Button
                  variant="outline"
                  className="border-gray-300 hover:bg-gray-50 bg-transparent"
                  disabled={!address.id || isLoading}
                  onClick={() => handleSetDefaultAddress(address)}
                >
                  {t('key210', '기본 배송지로 설정')}
                </Button>
              )}
            </div>
          )})}
        </div>
      )}

      {/* Add Address Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">{t('key199', '새 배송지 추가')}</DialogTitle>
            <DialogDescription className="text-gray-500">
              {t('key200', '새로운 배송지를 추가합니다.')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {/* Delivery address */}
            <div className="grid gap-2">
              <Label htmlFor="deliveryAddress" className="text-base font-normal">
                {t('key201', '배송지명')}
              </Label>
              <Input
                id="deliveryAddress"
                placeholder={t('key202', '예: 집, 회사')}
                className="bg-gray-50"
                value={formData.deliveryAddress}
                onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
              />
            </div>

            {/* Recipient Name */}
            <div className="grid gap-2">
              <Label htmlFor="recipientName" className="text-base font-normal">
                {t('key203', '받는 사람')}
              </Label>
              <Input
                id="recipientName"
                placeholder={t('key204', '받는 사람 이름')}
                className="bg-gray-50"
                value={formData.recipientName}
                onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
              />
            </div>

            {/* Phone Number */}
            <div className="grid gap-2">
              <Label htmlFor="phoneNumber" className="text-base font-normal">
                {t('key205', '연락처')}
              </Label>
              <Input
                id="phoneNumber"
                placeholder="010-0000-0000"
                className="bg-gray-50"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              />
            </div>

            {/* Postal Code */}
            <div className="grid gap-2">
              <Label htmlFor="postalCode" className="text-base font-normal">
                {t('key206', '우편번호')}
              </Label>
              <div className="flex gap-2 items-stretch [&_button]:h-9 [&_button]:flex [&_button]:items-center [&_button]:py-0 [&_button]:shrink-0">
                <Input
                  id="postalCode"
                  placeholder="우편번호"
                  className="h-9 bg-gray-50 flex-1 min-w-0"
                  disabled
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                />
                <PostalCodeButton
                  onComplete={(data) => {
                    setFormData({ ...formData, postalCode: data.zipCode, address: data.addressName });
                  }}
                />
              </div>
            </div>

            {/* Address */}
            <div className="grid gap-2">
              <Label htmlFor="address" className="text-base font-normal">
                {t('key207', '주소')}
              </Label>
              <Input
                id="address"
                placeholder="주소"
                className="bg-gray-50"
                disabled
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            {/* Address Full */}
            <div className="grid gap-2">
              <Label htmlFor="addressFull" className="text-base font-normal">
                {t('key208', '상세 주소')}
              </Label>
              <Input
                id="addressFull"
                placeholder={t('key209', '상세 주소 (동/호수 등)')}
                className="bg-gray-50"
                value={formData.addressFull}
                onChange={(e) => setFormData({ ...formData, addressFull: e.target.value })}
              />
            </div>

            {/* Set default checkbox */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="setAsDefault"
                aria-label={t('key210', '기본 배송지로 설정')}
                className="w-5 h-5 rounded border-gray-300"
                checked={formData.setAsDefault}
                onChange={(e) => setFormData({ ...formData, setAsDefault: e.target.checked })}
              />
              <Label htmlFor="setAsDefault" className="text-base font-normal cursor-pointer">
                {t('key210', '기본 배송지로 설정')}
              </Label>
            </div>
          </div>

          {/* Footer buttons */}
          <DialogFooter className="flex gap-4 pt-4">
            <Button
              type="button"
              className="flex-1 bg-[#ff5833] hover:bg-[#e64d2e] text-white h-12"
              onClick={handleAddAddress}
              disabled={isLoading}
            >
              {isLoading ? t('key211', '추가 중...') : "추가"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-12"
              onClick={() => setIsDialogOpen(false)}
              disabled={isLoading}
            >
              {t('key212', '취소')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Address Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open)
          if (!open) {
            setEditingAddressId(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">{t('key315', '배송지 수정')}</DialogTitle>
            <DialogDescription className="text-gray-500">
              {t('key316', '선택한 배송지 정보를 수정합니다.')}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* Delivery address */}
            <div className="grid gap-2">
              <Label htmlFor="edit_deliveryAddress" className="text-base font-normal">
                {t('key201', '배송지명')}
              </Label>
              <Input
                id="edit_deliveryAddress"
                placeholder={t('key202', '예: 집, 회사')}
                className="bg-gray-50"
                value={editFormData.deliveryAddress}
                onChange={(e) => setEditFormData({ ...editFormData, deliveryAddress: e.target.value })}
              />
            </div>

            {/* Recipient Name */}
            <div className="grid gap-2">
              <Label htmlFor="edit_recipientName" className="text-base font-normal">
                {t('key203', '받는 사람')}
              </Label>
              <Input
                id="edit_recipientName"
                placeholder={t('key204', '받는 사람 이름')}
                className="bg-gray-50"
                value={editFormData.recipientName}
                onChange={(e) => setEditFormData({ ...editFormData, recipientName: e.target.value })}
              />
            </div>

            {/* Phone Number */}
            <div className="grid gap-2">
              <Label htmlFor="edit_phoneNumber" className="text-base font-normal">
                {t('key205', '연락처')}
              </Label>
              <Input
                id="edit_phoneNumber"
                placeholder="010-0000-0000"
                className="bg-gray-50"
                value={editFormData.phoneNumber}
                onChange={(e) => setEditFormData({ ...editFormData, phoneNumber: e.target.value })}
              />
            </div>

            {/* Postal Code */}
            <div className="grid gap-2">
              <Label htmlFor="edit_postalCode" className="text-base font-normal">
                {t('key206', '우편번호')}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="edit_postalCode"
                  placeholder="우편번호"
                  className="bg-gray-50"
                  value={editFormData.postalCode}
                  onChange={(e) => setEditFormData({ ...editFormData, postalCode: e.target.value })}
                />
                <PostalCodeButton
                  onComplete={(data) => {
                    setEditFormData({ ...editFormData, postalCode: data.zipCode, address: data.addressName });
                  }}
                />
              </div>
            </div>

            {/* Address */}
            <div className="grid gap-2">
              <Label htmlFor="edit_address" className="text-base font-normal">
                {t('key207', '주소')}
              </Label>
              <Input
                id="edit_address"
                placeholder="주소"
                className="bg-gray-50"
                value={editFormData.address}
                onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
              />
            </div>

            {/* Address Full */}
            <div className="grid gap-2">
              <Label htmlFor="edit_addressFull" className="text-base font-normal">
                {t('key208', '상세 주소')}
              </Label>
              <Input
                id="edit_addressFull"
                placeholder={t('key209', '상세 주소 (동/호수 등)')}
                className="bg-gray-50"
                value={editFormData.addressFull}
                onChange={(e) => setEditFormData({ ...editFormData, addressFull: e.target.value })}
              />
            </div>

            {/* Set default checkbox */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit_setAsDefault"
                aria-label={t('key210', '기본 배송지로 설정')}
                className="w-5 h-5 rounded border-gray-300 disabled:opacity-60 disabled:cursor-not-allowed"
                checked={editFormData.setAsDefault}
                disabled={addresses.length === 1}
                onChange={(e) => setEditFormData({ ...editFormData, setAsDefault: e.target.checked })}
              />
              <Label
                htmlFor="edit_setAsDefault"
                className={cn("text-base font-normal cursor-pointer", addresses.length === 1 && "cursor-not-allowed opacity-60")}
              >
                {t('key210', '기본 배송지로 설정')}
              </Label>
            </div>
          </div>

          <DialogFooter className="flex gap-4 pt-4">
            <Button
              type="button"
              className="flex-1 bg-[#ff5833] hover:bg-[#e64d2e] text-white h-12"
              onClick={handleUpdateAddress}
              disabled={isLoading}
            >
              {isLoading ? t('key317', '수정 중...') : "수정"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-12"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isLoading}
            >
              {t('key212', '취소')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

