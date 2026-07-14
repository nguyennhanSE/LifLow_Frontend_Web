'use client'

import { ProductRegistrationForm } from '../components/main/product-registration-form'
import { useEffect, useState } from 'react'

export default function AdminProductNewPage() {
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => {
    setIsMounted(true)
  }, [])
  return <ProductRegistrationForm isMounted={isMounted} />
}

