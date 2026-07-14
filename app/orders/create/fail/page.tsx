import { Suspense } from "react"
import OrderFailClient from "./order-fail-client"

export default function OrderFailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <OrderFailClient />
    </Suspense>
  )
}

