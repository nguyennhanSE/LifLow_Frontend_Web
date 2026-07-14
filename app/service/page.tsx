import type { Metadata } from "next"
import { ServiceSection } from "@/components/home/service-section";

export const metadata: Metadata = {
  title: "고객센터",
  description: "Liflow 고객센터 - 주문, 배송, 교환/반품 등 궁금하신 사항을 안내해 드립니다.",
}

export default function ServicePage() {
    return (
        <ServiceSection />
    )
}