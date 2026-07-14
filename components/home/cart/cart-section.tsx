'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Trash2, Plus, Minus } from 'lucide-react'
import { useCart } from '@/hooks/use-cart/cart.hook'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'

interface CartItem {
  id: string
  cartId: string
  productId: string
  quantity: number
  salePrice: number
  createdAt: string
  updatedAt: string
  product: {
    id: string
    productName: string
    productCode: string
    salePrice: number
    imageRegistrationThumbnail: string
    deliveryFeeInput?: number | string | null
  }
}

interface CartData {
  id: string
  userId: string
  status: string
  totalAmount: number
  checkedOutAt: any
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    email: string
    phoneNumber: string
  }
  cartItems: CartItem[]
}

const formatCurrency = (value: number) => {
  return value.toLocaleString('ko-KR')
}

export function CartSection() {
  const { t } = useTranslation()
  const router = useRouter()
  const { getMyCart, deleteItemFromCart, bulkUpdateCartItems, bulkDeleteCartItems } = useCart()
  const { toast } = useToast()
  const [cartData, setCartData] = useState<CartData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [deletingItems, setDeletingItems] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)

  useEffect(() => {
    const fetchCart = async () => {
      try {
        setLoading(true)
        const data = await getMyCart()
        setCartData(data)
        // Initialize quantities from cart items
        const initialQuantities: Record<string, number> = {}
        data.cartItems?.forEach((item: CartItem) => {
          initialQuantities[item.id] = item.quantity
        })
        setQuantities(initialQuantities)
        // Select all items by default
        setSelectedItems(new Set(data.cartItems?.map((item: CartItem) => item.id) || []))
      } catch (error) {
        console.error('Error fetching cart:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCart()
  }, [getMyCart])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(cartData?.cartItems?.map((item) => item.id) || []))
    } else {
      setSelectedItems(new Set())
    }
  }

  const handleSelectItem = (itemId: string, checked: boolean) => {
    const newSelected = new Set(selectedItems)
    if (checked) {
      newSelected.add(itemId)
    } else {
      newSelected.delete(itemId)
    }
    setSelectedItems(newSelected)
  }

  const handleQuantityChange = (itemId: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[itemId] || 1
      const newQuantity = Math.max(1, current + delta)
      return { ...prev, [itemId]: newQuantity }
    })
  }

  const handleDeleteItem = async (itemId: string) => {
    if (deletingItems.has(itemId)) return // Prevent multiple clicks
    
    setDeletingItems((prev) => new Set(prev).add(itemId))
    
    try {
      const result = await deleteItemFromCart(itemId)
      
      if (result) {
        // Remove item from local state
        if (cartData) {
          setCartData({
            ...cartData,
            cartItems: cartData.cartItems.filter((item) => item.id !== itemId),
          })
        }
        
        // Remove from selected items
        setSelectedItems((prev) => {
          const newSelected = new Set(prev)
          newSelected.delete(itemId)
          return newSelected
        })
        
        // Remove from quantities
        setQuantities((prev) => {
          const newQuantities = { ...prev }
          delete newQuantities[itemId]
          return newQuantities
        })
        
        toast({
          title: t('key155', '성공'),
          description: t('key156', '장바구니에서 상품이 제거되었습니다'),
        })
        
        // Refresh cart data to ensure consistency
        const refreshedData = await getMyCart()
        if (refreshedData) {
          setCartData(refreshedData)
          const initialQuantities: Record<string, number> = {}
          refreshedData.cartItems?.forEach((item: CartItem) => {
            initialQuantities[item.id] = item.quantity
          })
          setQuantities(initialQuantities)
        }
      } else {
        toast({
          title: t('key157', '오류'),
          description: t('key158', '장바구니에서 상품 제거에 실패했습니다'),
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error deleting item:', error)
      toast({
        title: "오류",
        description: t('key159', '상품 제거 중 오류가 발생했습니다'),
        variant: "destructive",
      })
    } finally {
      setDeletingItems((prev) => {
        const newSet = new Set(prev)
        newSet.delete(itemId)
        return newSet
      })
    }
  }

  const handleBulkDelete = async () => {
    const idsToDelete = Array.from(selectedItems)
    if (idsToDelete.length === 0) return

    setBulkDeleting(true)
    try {
      const result = await bulkDeleteCartItems(idsToDelete)

      if (result) {
        toast({
          title: t('key155', '성공'),
          description: t('key160', '선택한 상품이 장바구니에서 제거되었습니다'),
        })
        const refreshedData = await getMyCart()
        if (refreshedData) {
          setCartData(refreshedData)
          const initialQuantities: Record<string, number> = {}
          refreshedData.cartItems?.forEach((item: CartItem) => {
            initialQuantities[item.id] = item.quantity
          })
          setQuantities(initialQuantities)
          setSelectedItems(new Set())
        }
      } else {
        toast({
          title: t('key157', '오류'),
          description: t('key161', '선택한 상품 제거에 실패했습니다'),
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error bulk deleting items:", error)
      toast({
        title: "오류",
        description: t('key159', '상품 제거 중 오류가 발생했습니다'),
        variant: "destructive",
      })
    } finally {
      setBulkDeleting(false)
    }
  }

  const isAllSelected =
    cartData?.cartItems && cartData.cartItems.length > 0
      ? cartData.cartItems.every((item) => selectedItems.has(item.id))
      : false

  const selectedCartItems = cartData?.cartItems?.filter((item) => selectedItems.has(item.id)) || []
  const productAmount = selectedCartItems.reduce(
    (sum, item) => sum + (item.salePrice * (quantities[item.id] || item.quantity)),
    0
  )
  const shippingCost = selectedCartItems.reduce(
    (sum, item) => sum + Number(item.product.deliveryFeeInput || 0),
    0
  )
  const totalOrderAmount = productAmount + shippingCost

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t('key162', '장바구니 불러오는 중...')}</p>
        </div>
      </div>
    )
  }

  if (!cartData || !cartData.cartItems || cartData.cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">{t('key163', '장바구니')}</h1>
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t('key164', '장바구니가 비어있습니다')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-8">{t('key163', '장바구니')}</h1>

      <div className="flex flex-col lg:flex-row gap-4 sm:gap-8 justify-center">
        {/* Left Section: Shopping Cart Items */}
        <div className="flex-1 border rounded-lg bg-card p-3 sm:p-4">
          {/* Select All & Delete */}
          <div className="flex items-center gap-2 pb-4 border-b">
            <Checkbox
              id="select-all"
              checked={isAllSelected}
              onCheckedChange={handleSelectAll}
            />
            <label htmlFor="select-all" className="text-sm cursor-pointer">
              {t('key165', '전체 선택')}
            </label>
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={selectedItems.size === 0 || bulkDeleting}
              className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('key166', '선택 삭제')}
            </button>
          </div>

          {/* Column Headers (desktop only) */}
          <div className="hidden md:grid grid-cols-[1fr_140px_140px] gap-4 py-3 border-b text-sm text-muted-foreground">
            <div className="pl-10">{t('key167', '상품정보')}</div>
            <div className="text-center">{t('key168', '수량')}</div>
            <div className="text-center">{t('key169', '금액')}</div>
          </div>

          {/* Cart Items */}
          <div className="divide-y">
            {cartData.cartItems.map((item) => {
              const isSelected = selectedItems.has(item.id)
              const quantity = quantities[item.id] || item.quantity
              const itemTotal = item.salePrice * quantity

              return (
                <div key={item.id} className="py-4">
                  {/* Desktop: table row */}
                  <div className="hidden md:grid grid-cols-[1fr_140px_140px] gap-4 items-center">
                    <div className="flex items-center gap-4 min-w-0">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                      />
                      <div className="relative w-20 h-20 shrink-0 rounded-md overflow-hidden bg-muted">
                        <Image
                          src={item.product.imageRegistrationThumbnail || '/placeholder.svg'}
                          alt={item.product.productName}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-medium text-sm mb-1 truncate">{item.product.productName}</h3>
                        <p className="text-xs text-muted-foreground">{t('productcode', '옵션: {{productCode}}', { productCode: item.product.productCode })}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(item.id, -1)}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center text-sm">{quantity}</span>
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(item.id, 1)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-end gap-3">
                      <span className="text-sm font-medium">{formatCurrency(itemTotal)}원</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteItem(item.id)}
                        disabled={deletingItems.has(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Mobile: card layout */}
                  <div className="md:hidden flex gap-3">
                    <div className="flex items-start pt-0.5">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                      />
                    </div>
                    <div className="relative w-20 h-20 shrink-0 rounded-md overflow-hidden bg-muted">
                      <Image
                        src={item.product.imageRegistrationThumbnail || '/placeholder.svg'}
                        alt={item.product.productName}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium text-sm leading-snug line-clamp-2">{item.product.productName}</h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 -mt-1 -mr-2 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteItem(item.id)}
                          disabled={deletingItems.has(item.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{t('productcode', '옵션: {{productCode}}', { productCode: item.product.productCode })}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1.5">
                          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleQuantityChange(item.id, -1)}>
                            <Minus className="h-3.5 w-3.5" />
                          </Button>
                          <span className="w-7 text-center text-sm">{quantity}</span>
                          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleQuantityChange(item.id, 1)}>
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <span className="text-sm font-semibold">{formatCurrency(itemTotal)}원</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Section: Order Summary */}
        <div className="lg:w-80">
          <div className="border rounded-lg p-4 sm:p-6 lg:sticky lg:top-4">
            <h2 className="text-lg font-bold mb-4">{t('key170', '주문 금액')}</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('key171', '상품 금액')}</span>
                <span>{formatCurrency(productAmount)} 원</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('key172', '배송비')}</span>
                <span>{formatCurrency(shippingCost)} 원</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-3 border-t">
                <span>{t('key173', '총 주문 금액')}</span>
                <span className="text-primary">{formatCurrency(totalOrderAmount)} 원</span>
              </div>
            </div>

            <div className="space-y-3">
              <Button 
                className="w-full bg-[#FF6B4A] hover:bg-[#FF5A39] text-white"
                onClick={async () => {
                  if (selectedCartItems.length === 0) {
                    return
                  }
                  
                  // Prepare bulk update DTO with updated quantities
                  const bulkUpdateDto = {
                    items: selectedCartItems.map((item) => ({
                      id: item.id,
                      data: {
                        productId: item.productId,
                        quantity: quantities[item.id] || item.quantity,
                      },
                    })),
                  }
                  
                  // Update cart items before placing order
                  const updateResult = await bulkUpdateCartItems(bulkUpdateDto)
                  
                  if (!updateResult) {
                    toast({
                      title: "오류",
                      description: "장바구니 상품 업데이트에 실패했습니다",
                      variant: "destructive",
                    })
                    return
                  }
                  
                  // Prepare order items with cartItemId and updated quantities
                  const orderItems = selectedCartItems.map((item) => ({
                    cartItemId: item.id,
                    productId: item.productId,
                    product: item.product,
                    quantity: quantities[item.id] || item.quantity,
                    salePrice: item.salePrice,
                    cartId: item.cartId,
                    deliveryInputFee:item.product.deliveryFeeInput || 0,
                  }))
                  
                  // Save to localStorage with directPay: false (from cart)
                  localStorage.setItem('pendingOrderItems', JSON.stringify({ items: orderItems, directPay: false }))
                  
                  // Navigate to checkout page
                  router.push('/orders/create')
                }}
              >
                {t('key174', '주문하기')}
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => router.push('/market')}
              >
                {t('key175', '쇼핑 계속하기')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

