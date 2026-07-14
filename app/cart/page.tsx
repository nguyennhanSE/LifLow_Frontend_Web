import type { Metadata } from "next"
import { CartSection } from "@/components/home/cart/cart-section";

export const metadata: Metadata = {
  title: "장바구니",
  robots: { index: false, follow: false },
}

export default function CartPage() {
    return (
        <CartSection />
    )
}

