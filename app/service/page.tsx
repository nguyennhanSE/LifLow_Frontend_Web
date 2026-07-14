import type { Metadata } from "next"
import { ServiceSection } from "@/components/home/service-section";import i18next from 'i18next'


export const metadata: Metadata = {
  title: i18next.t('key52', '고객센터'),
  description: i18next.t('liflow4', 'Liflow 고객센터 - 주문, 배송, 교환/반품 등 궁금하신 사항을 안내해 드립니다.'),
}

export default function ServicePage() {
    return (
        <ServiceSection />
    )
}