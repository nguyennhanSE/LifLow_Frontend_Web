import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Providers } from "@/components/providers"
import "./globals.css"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { ServiceWorkerRegister } from "@/components/sw-register"
import { FCMProvider } from "@/components/fcm-provider"
import { GlobalSSEProvider } from "./providers/globalSSEProvider"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://liflow.co.kr"

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#FF5833",
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Liflow - 주왕몰 | 프리미엄 한식 쇼핑몰",
    template: "%s | Liflow",
  },
  description:
    "주왕몰 - 엄선된 한국 식자재와 전통 조미료를 만나보세요. 주왕산가든에서 운영하는 프리미엄 한식 쇼핑몰 Liflow에서 신선한 배송과 품질 보증으로 특별한 한 끼를 완성하세요.",
  keywords: [
    "주왕몰",
    "juwangmall",
    "쭈왕몰",
    "주왕산가든",
    "한식",
    "한국 식자재",
    "전통 조미료",
    "프리미엄 식품",
    "온라인 쇼핑몰",
    "신선식품",
    "라이플로우",
    "Liflow",
    "liflow",
  ],
  authors: [{ name: "농업회사법인 라이플로우(주)" }],
  creator: "농업회사법인 라이플로우(주)",
  publisher: "농업회사법인 라이플로우(주)",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "쭈왕몰",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: SITE_URL,
    siteName: "Liflow",
    title: "Liflow - 주왕몰 | 프리미엄 한식 쇼핑몰",
    description:
      "주왕몰 - 엄선된 한국 식자재와 전통 조미료를 만나보세요. 주왕산가든에서 운영하는 프리미엄 한식 쇼핑몰 Liflow에서 신선한 배송과 품질 보증으로 특별한 한 끼를 완성하세요.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Liflow - 주왕몰 | 프리미엄 한식 쇼핑몰",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Liflow - 주왕몰 | 프리미엄 한식 쇼핑몰",
    description:
      "주왕몰 - 엄선된 한국 식자재와 전통 조미료를 만나보세요. 주왕산가든에서 운영하는 프리미엄 한식 쇼핑몰 Liflow에서 신선한 배송과 품질 보증으로 특별한 한 끼를 완성하세요.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "DS1UbzJil0QRsC3HOKx6fx9WVUM5F_hnHQYSGdKYjZY",
    // naver: "your-naver-verification-code",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className="overflow-x-hidden">
      <body className="font-sans antialiased overflow-x-hidden min-w-0 w-full">
        <Providers>
          <GlobalSSEProvider>
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
          </GlobalSSEProvider>
          <Analytics />
          <ServiceWorkerRegister />
          <FCMProvider />
        </Providers>
      </body>
    </html>
  )
}
