import { Suspense } from "react"
import OrderSuccessClient from "./order-success-client"

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <OrderSuccessClient />
    </Suspense>
  )
}

