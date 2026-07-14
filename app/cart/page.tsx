import type { Metadata } from "next"
import { CartSection } from "@/components/home/cart/cart-section";import i18next from 'i18next'


export const metadata: Metadata = {
  title: i18next.t('key82', '장바구니'),
  robots: { index: false, follow: false },
}

export default function CartPage() {
    return (
        <CartSection />
    )
}

