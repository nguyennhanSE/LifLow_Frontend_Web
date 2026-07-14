"use client"

import { ArrowLeft, Home } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { toast } from "sonner"
import { useUser } from "@/hooks/use-user/user.hook"
import { useTranslation } from 'react-i18next'

export default function FindPasswordPage() {
  const { t } = useTranslation()
  const { findPassword } = useUser()
  const [id, setId] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!id || !name || !email) {
      toast.error("모든 항목을 입력해주세요")
      return
    }

    setIsLoading(true)
    try {
      await findPassword(id, name, email)
      toast.success("이메일로 비밀번호 재설정 링크를 발송했습니다")
    } catch (error: any) {
      console.error("Find password error:", error)
      toast.error(error?.response?.data?.message || "비밀번호 찾기에 실패했습니다")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex justify-center items-center">
      {/* Main Content */}
      <div className="w-xl max-w-4xl mx-auto px-4 py-8 bg-[#f5f5f5] rounded-2xl">
        {/* Logo and Header */}
        <div className="flex justify-center items-center gap-5 mb-4">
          <Image src="/Icon-orange.png" alt="icon" width={50} height={50} />
          <h1 className="text-3xl font-bold">{t('key4', '쭈왕몰')}</h1>
        </div>
        <header className="flex justify-between items-center mb-6">
          <Link href="/sign-in">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <Link href="/">
            <Home className="w-6 h-6" />
          </Link>
        </header>

        <h1 className="text-3xl font-bold text-center mb-4">{t('key49', '비밀번호 찾기')}</h1>


        <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
        <p className="text-center text-gray-600 mb-8 text-sm">
          {t('key83', '회원가입 시 입력하신 정보를 입력해주세요.')}
        </p>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* ID Field */}
            <div>
              <label htmlFor="id" className="block text-sm font-medium mb-2 text-gray-700">
                {t('key44', '아이디')}
              </label>
              <input
                type="text"
                id="id"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder={t('key84', '아이디를 입력하세요')}
                className="w-full px-4 py-3 bg-[#f3f3f5] rounded-lg text-base placeholder:text-[#717182] focus:outline-none focus:ring-2 focus:ring-[#ff5833]/20"
                required
              />
            </div>

            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2 text-gray-700">
                {t('key79', '이름')}
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('key13', '이름을 입력하세요')}
                className="w-full px-4 py-3 bg-[#f3f3f5] rounded-lg text-base placeholder:text-[#717182] focus:outline-none focus:ring-2 focus:ring-[#ff5833]/20"
                required
              />
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2 text-gray-700">
                {t('key80', '이메일')}
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('key17', '이메일을 입력하세요')}
                className="w-full px-4 py-3 bg-[#f3f3f5] rounded-lg text-base placeholder:text-[#717182] focus:outline-none focus:ring-2 focus:ring-[#ff5833]/20"
                required
              />
            </div>

            {/* Verify Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#ff5833] hover:bg-[#e54d2c] text-white font-semibold py-4 rounded-lg transition-colors text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? t('key8', '확인 중...') : "본인 인증"}
            </button>

            {/* Links */}
            <div className="flex flex-col items-center gap-2 pt-4">
              <Link href="/find-id" className="text-[#ff5833] font-semibold hover:underline text-sm">
                {t('key48', '아이디 찾기')}
              </Link>
              <Link href="/sign-up" className="text-gray-600 hover:text-gray-900 text-sm">
                {t('key6', '회원가입')}
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
