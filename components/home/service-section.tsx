"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  ShoppingBag,
  Wallet,
  Shield,
  Heart,
  Users,
  DollarSign,
  FileText,
  Clock,
  Package,
  Truck,
  Tag,
  CheckCircle2,
  Headphones,
} from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useTranslation } from 'react-i18next'

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(";").shift()?.trim() || null
  return null
}

export function ServiceSection() {
  const { t } = useTranslation()
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    setIsLoggedIn(!!getCookie("access_token"))
  }, [])

  const handleClickProduct = () => {
    router.push('/market')
  }
  const handleClickSignIn = () => {
    router.push('/sign-up')
  }
  return (
    <div className="min-h-screen bg-[white]">
      {/* Hero Section */}
      <section className="w-full py-16 text-center bg-gradient-to-r from-[#FEF2F2] to-[#FFF7ED]">
        <div className="container mx-auto px-4">
          <div className="inline-block bg-[#ff5833] text-white px-4 py-1 rounded-full text-sm mb-4">
          {t('juwangMallService', 'JUWANG MALL SERVICE')}
          </div>
          <h1 className="text-2xl font-bold text-[#2d2d2d] mb-2">{t('key47', '신선함을 전하는')}</h1>
          <p className="text-[#ff5833] text-xl font-semibold mb-4">{t('key48', '쭈왕몰 서비스')}</p>
          <p className="text-[#6b6b6b] text-2xl mb-2">{t('key49', '엄선된 식품만을 제공하는 쭈왕몰에서')}</p>
          <p className="text-[#6b6b6b] text-2xl mb-8">{t('key50', '안전하고 신선한 상품을 만나보세요')}</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={handleClickProduct} className="bg-[#ff5833] hover:bg-[#e04422] text-white px-8 py-6 text-lg rounded-lg">
              {t('key51', '상품 둘러보기')}
            </Button>
            <Button
              variant="outline"
              className="border-[#2d2d2d] text-[#2d2d2d] bg-white px-8 py-6 text-lg rounded-lg hover:bg-[#2d2d2d] hover:text-white "
              onClick={handleClickSignIn}
              disabled={isLoggedIn}
            >
              {t('key52', '회원가입하기')}
            </Button>
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-[#2d2d2d] mb-4">{t('key53', '쭈왕몰만의 특별함')}</h2>
        <p className="text-center text-[#6b6b6b] mb-12">{t('key54', '고객에게 최상의 경험을 제공하기 위해 노력합니다')}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 text-center bg-white hover:shadow-lg transition-shadow h-[205px] gap-y-1 shadow-lg">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#e8f4ff] flex items-center justify-center">
              <ShoppingBag className="w-8 h-8 text-[#3b82f6]" />
            </div>
            <h3 className="font-semibold text-lg mb-2 text-[#2d2d2d]">{t('key55', '엄선된 상품')}</h3>
            <p className="text-sm text-[#6b6b6b]">{t('key56', '쭈왕이 직접 선별한 신선하고 안전한 식품만을 판매합니다')}</p>
          </Card>

          <Card className="p-6 text-center bg-white hover:shadow-lg transition-shadow h-[205px] gap-y-1 shadow-lg">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#dcfce7] flex items-center justify-center">
              <Truck className="w-8 h-8 text-[#22c55e]" />
            </div>
            <h3 className="font-semibold text-lg mb-2 text-[#2d2d2d]">{t('key57', '빠른 배송')}</h3>
            <p className="text-sm text-[#6b6b6b]">{t('key58', '신선도 유지를 위한 당일/익일 배송 시스템을 운영합니다')}</p>
          </Card>

          <Card className="p-6 text-center bg-white hover:shadow-lg transition-shadow h-[205px] gap-y-1 shadow-lg">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#f3e8ff] flex items-center justify-center">
              <Shield className="w-8 h-8 text-[#a855f7]" />
            </div>
            <h3 className="font-semibold text-lg mb-2 text-[#2d2d2d]">{t('key59', '품질 보증')}</h3>
            <p className="text-sm text-[#6b6b6b]">{t('key60', '모든 상품을 엄격한 품질 검수를 거쳐 안전하게 배송됩니다')}</p>
          </Card>

          <Card className="p-6 text-center bg-white hover:shadow-lg transition-shadow h-[205px] gap-y-1 shadow-lg">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#ffe4e6] flex items-center justify-center">
              <Heart className="w-8 h-8 text-[#ef4444]" />
            </div>
            <h3 className="font-semibold text-lg mb-2 text-[#2d2d2d]">{t('key61', '고객 중심')}</h3>
            <p className="text-sm text-[#6b6b6b]">{t('key62', '고객의 만족을 최우선으로 생각하는 서비스를 제공합니다')}</p>
          </Card>
        </div>
      </section>

      {/* Usage Methods Section */}
      <section className="container mx-auto px-4 py-16 bg-gray-100">
        <h2 className="text-3xl font-bold text-center text-[#2d2d2d] mb-4">{t('key63', '이용방법')}</h2>
        <p className="text-center text-[#6b6b6b] mb-12">{t('key64', '간편하게 시작하는 쭈왕몰 쇼핑')}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          <Card className="h-[280px] gap-y-1 p-8 bg-white hover:shadow-lg transition-shadow relative text-center after:content-[''] after:absolute after:top-1/2 after:right-0 after:transform after:translate-x-1/2 after:-translate-y-1/2 after:w-12 after:h-[2px] after:bg-gray-300 lg:after:block after:hidden last:after:hidden">
            <div className="text-7xl font-bold text-[#f5f0eb] mb-6">01</div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 mb-4 rounded-full bg-[#ff5833] flex items-center justify-center">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-[#2d2d2d]">{t('key65', '회원가입')}</h3>
              <p className="text-sm text-[#6b6b6b]">{t('30', '간단한 정보 입력으로 30초만에 가입 완료')}</p>
            </div>
          </Card>

          <Card className="h-[280px] gap-y-1 p-8 bg-white hover:shadow-lg transition-shadow relative text-center after:content-[''] after:absolute after:top-1/2 after:right-0 after:transform after:translate-x-1/2 after:-translate-y-1/2 after:w-12 after:h-[2px] after:bg-gray-300 lg:after:block after:hidden last:after:hidden">
            <div className="text-7xl font-bold text-[#f5f0eb] mb-6">02</div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 mb-4 rounded-full bg-[#ff5833] flex items-center justify-center">
                <Package className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-[#2d2d2d]">{t('key66', '상품 선택')}</h3>
              <p className="text-sm text-[#6b6b6b]">{t('key67', '원하는 상품을 장바구니에 담아보세요')}</p>
            </div>
          </Card>

          <Card className="h-[280px] gap-y-1 p-8 bg-white hover:shadow-lg transition-shadow relative text-center after:content-[''] after:absolute after:top-1/2 after:right-0 after:transform after:translate-x-1/2 after:-translate-y-1/2 after:w-12 after:h-[2px] after:bg-gray-300 lg:after:block after:hidden last:after:hidden">
            <div className="text-7xl font-bold text-[#f5f0eb] mb-6">03</div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 mb-4 rounded-full bg-[#ff5833] flex items-center justify-center">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-[#2d2d2d]">{t('key68', '결제하기')}</h3>
              <p className="text-sm text-[#6b6b6b]">{t('key69', '다양한 결제 수단으로 안전하게 결제')}</p>
            </div>
          </Card>

          <Card className="h-[280px] gap-y-1 p-8 bg-white hover:shadow-lg transition-shadow relative text-center">
            <div className="text-7xl font-bold text-[#f5f0eb] mb-6">04</div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 mb-4 rounded-full bg-[#ff5833] flex items-center justify-center">
                <Truck className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-[#2d2d2d]">{t('key70', '배송 받기')}</h3>
              <p className="text-sm text-[#6b6b6b]">{t('key71', '신선한 상품을 빠르게 받아보세요')}</p>
            </div>
          </Card>
        </div>
      </section>

      {/* Useful Tips Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-[#2d2d2d] mb-4">{t('key72', '고객 혜택')}</h2>
        <p className="text-center text-[#6b6b6b] mb-12">{t('key73', '쭈왕몰 회원만의 특별한 혜택을 누리세요')}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="h-[168px] gap-y-1 p-6 bg-white hover:shadow-lg transition-shadow">
            <div className="w-10 h-10 mb-4 rounded-lg bg-[#ff5833] flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-lg mb-2 text-[#2d2d2d]">{t('key74', '오늘 주문, 내일 도착')}</h3>
            <p className="text-sm text-[#6b6b6b]">{t('2', '평일 오후 2시 이전 주문 시 익일 배송')}</p>
          </Card>

          <Card className="h-[168px] gap-y-1 p-6 bg-white hover:shadow-lg transition-shadow">
            <div className="w-10 h-10 mb-4 rounded-lg bg-[#ff5833] flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-lg mb-2 text-[#2d2d2d]">{t('key75', '포인트 적립')}</h3>
            <p className="text-sm text-[#6b6b6b]">{t('5', '구매금액의 최대 5% 포인트 적립')}</p>
          </Card>

          <Card className="h-[168px] gap-y-1 p-6 bg-white hover:shadow-lg transition-shadow">
            <div className="w-10 h-10 mb-4 rounded-lg bg-[#ff5833] flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-lg mb-2 text-[#2d2d2d]">{t('key76', '신규 회원 혜택')}</h3>
            <p className="text-sm text-[#6b6b6b]">{t('3000', '가입 시 즉시 사용 가능한 3,000원 쿠폰')}</p>
          </Card>

          <Card className="h-[168px] gap-y-1 p-6 bg-white hover:shadow-lg transition-shadow">
            <div className="w-10 h-10 mb-4 rounded-lg bg-[#ff5833] flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-lg mb-2 text-[#2d2d2d]">{t('key77', '친환경 포장')}</h3>
            <p className="text-sm text-[#6b6b6b]">{t('key78', '환경을 생각하는 재활용 가능한 포장재 사용')}</p>
          </Card>
        </div>
      </section>

      {/* Fresh & Safe Section */}
      <section className="container mx-auto px-4 py-16 bg-gray-100">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="relative h-[500px] rounded-2xl overflow-hidden">
            <Image src="/fresh-vegetables-and-produce-in-baskets.png" alt={t('freshProduce', 'Fresh produce')} fill className="object-cover" />
          </div>
          <div>
            <div className="inline-block bg-transparent border border-[#2d2d2d] px-4 py-1 rounded text-sm mb-4">
              {t('freshSafe', 'FRESH & SAFE')}
            </div>
            <h2 className="text-3xl font-bold text-[#2d2d2d] mb-4">{t('key79', '신선함과 안전함을')}</h2>
            <p className="text-[#ff5833] text-xl font-semibold mb-8">{t('key80', '동시에')}</p>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-[#22c55e] shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-[#2d2d2d] mb-1">{t('key81', '산지 직송 시스템')}</h3>
                  <p className="text-sm text-[#6b6b6b]">{t('key82', '농장에서 식탁까지 최단 거리 배송으로 신선도 유지')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-[#22c55e] shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-[#2d2d2d] mb-1">{t('key83', '철저한 품질 관리')}</h3>
                  <p className="text-sm text-[#6b6b6b]">{t('key84', '전문가의 꼼꼼한 검수를 거친 상품만 판매')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-[#22c55e] shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-[#2d2d2d] mb-1">{t('key85', '콜드체인 배송')}</h3>
                  <p className="text-sm text-[#6b6b6b]">{t('key86', '온도 관리 시스템으로 신선함을 그대로 전달')}</p>
                </div>
              </div>
            </div>
            <Button onClick={handleClickProduct} className="bg-[#ff5833] hover:bg-[#e04422] text-white px-8 py-6 text-lg rounded-sm mt-8">
              {t('key87', '지금 쇼핑하기')}
            </Button>
          </div>
        </div>
      </section>

      {/* Customer Support Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-block bg-transparent border border-[#2d2d2d] px-4 py-1 rounded text-sm mb-4">{t('customerSupport', 'CUSTOMER SUPPORT')}</div>
            <h2 className="text-3xl font-bold text-[#2d2d2d] mb-4">{t('key88', '언제나 함께하는')}</h2>
            <p className="text-[#ff5833] text-xl font-semibold mb-8">{t('key89', '고객 지원')}</p>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0">
                  <Image src="/service/1.png" alt={t('customerSupport2', 'Customer support')} width={30} height={30} />
                </div>
                <div>
                  <h3 className="font-semibold text-[#2d2d2d] mb-1">{t('11', '1:1 고객 상담')}</h3>
                  <p className="text-sm text-[#6b6b6b]">{t('09001800', '평일 09:00 - 18:00 전문 상담사 연결')}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0">
                  <Image src="/service/2.png" alt={t('customerSupport2', 'Customer support')} width={30} height={30} />
                </div>
                <div>
                  <h3 className="font-semibold text-[#2d2d2d] mb-1">{t('key90', '교환/반품 간편 처리')}</h3>
                  <p className="text-sm text-[#6b6b6b]">{t('7', '상품 수령 후 7일 이내 교환 및 반품 가능')}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0">
                  <Image src="/service/3.png" alt={t('customerSupport2', 'Customer support')} width={30} height={30} />
                </div>
                <div>
                  <h3 className="font-semibold text-[#2d2d2d] mb-1">{t('key91', '안전한 결제')}</h3>
                  <p className="text-sm text-[#6b6b6b]">{t('pgSsl', 'PG사 인증 및 SSL 보안 시스템 적용')}</p>
                </div>
              </div>
            </div>
            <Button onClick={handleClickProduct} className="bg-white hover:bg-gray-100 border border-[#2d2d2d] text-[#2d2d2d] px-8 py-6 text-lg rounded-sm mt-8">
              {t('key87', '지금 쇼핑하기')}
            </Button>
          </div>
          <div className="relative h-[500px] rounded-2xl overflow-hidden">
            <Image src="/customer-support-team-meeting.png" alt={t('customerSupport2', 'Customer support')} fill className="object-cover" />
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="bg-[#ff5833] py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-white text-xl font-bold mb-4">{t('key92', '지금 바로 시작하세요')}</h2>
          <p className="text-white text-lg mb-2">{t('key93', '신선하고 안전한 쭈왕몰의 상품을 만나보세요')}</p>
          <p className="text-white text-sm mb-8">{t('30002', '신규 가입 시 3,000원 쿠폰을 드립니다')}</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={handleClickSignIn} disabled={isLoggedIn} className="bg-white text-[#2d2d2d] hover:bg-gray-100 px-8 py-6 text-lg rounded-sm font-semibold">
              {t('key94', '무료 회원가입')}
            </Button>
            <Button
              onClick={handleClickProduct}
              className="bg-white text-[#2d2d2d] hover:bg-gray-100 px-8 py-6 text-lg rounded-sm font-semibold"
            >
              {t('key95', '상품 보러가기')}
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
