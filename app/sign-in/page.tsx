"use client"

import { ArrowLeft, Home, ShoppingBag } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useAuthHook } from "@/hooks/use-auth/auth.hook"
import { useSignIn } from "./use.sign-in.hook"
import { useRouter } from "next/navigation"
import Image from "next/image"

export default function LoginPage() {
  const [id, setId] = useState("")
  const [password, setPassword] = useState("")
  const [keepLoggedIn, setKeepLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessingCallback, setIsProcessingCallback] = useState(false)
  
  const { handleLogin, handleNaverCallback } = useAuthHook()
  const { handleNaverLogin, handleKakaoLogin, handleKaKaoCallback } = useSignIn()
  const router = useRouter()

  // Xử lý Naver callback từ URL
  useEffect(() => {
    // Lấy result từ URL
    const urlParams = new URLSearchParams(window.location.search)
    const encodedResult = urlParams.get('result')
    console.log('encodedResult', encodedResult)
    // return;
    if (encodedResult && !isProcessingCallback) {
      setIsProcessingCallback(true)
      setIsLoading(true)
      
      handleNaverCallback(encodedResult).finally(() => {
        setIsLoading(false)
        setIsProcessingCallback(false)
        // Clean up URL by removing the result parameter
        const newUrl = window.location.pathname
        window.history.replaceState({}, '', newUrl)
      })
    }
  }, [handleNaverCallback, isProcessingCallback])

  // Xử lý Kakao callback từ URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    
    if (code && !isProcessingCallback) {
      setIsProcessingCallback(true)
      setIsLoading(true)
      
      handleKaKaoCallback(code).finally(() => {
        setIsLoading(false)
        setIsProcessingCallback(false)
        // Clean up URL by removing the code parameter
        const newUrl = window.location.pathname
        window.history.replaceState({}, '', newUrl)
      })
    }
  }, [handleKaKaoCallback, isProcessingCallback])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!id || !password) {
      return
    }

    setIsLoading(true)
    try {
      const result = await handleLogin(id, password)
      
      if (result) {
        // Login successful, redirect to home or dashboard
        router.push("/")
      }
    } catch (error) {
      console.error("Login error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-white flex flex-col justify-center items-center relative py-6 px-4 sm:px-6">
      {/* Loading overlay */}
      {isProcessingCallback && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff5833] mx-auto mb-4" />
            <p className="text-lg font-semibold text-gray-700">로그인 처리 중...</p>
          </div>
        </div>
      )}

      {/* Main Content — equal horizontal padding, centered */}
      <div className="w-full max-w-[min(100%,28rem)] sm:max-w-lg mx-auto py-4 sm:py-5 bg-[#f5f5f5] rounded-2xl px-4 sm:px-6">
        <div className="flex justify-center items-center gap-3 mb-2">
          <Image src="/Icon-orange.png" alt="icon" width={40} height={40} className="shrink-0" />
          <h1 className="text-xl sm:text-2xl font-bold">쭈왕몰</h1>
        </div>
        <header className="flex justify-between items-center">
          <Link href="/" className="p-2 -m-2 touch-manipulation" aria-label="뒤로">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <Link href="/" className="p-2 -m-2 touch-manipulation" aria-label="홈">
            <Home className="w-6 h-6" />
          </Link>
        </header>
        <h1 className="text-xl sm:text-2xl font-bold text-center mb-4 sm:mb-6">로그인</h1>

        <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 md:p-8">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Email Field */} 
            <div>
              <label htmlFor="id" className="block text-base font-semibold mb-2">
                {/* id in Korean */}
                아이디
              </label>
              <input
                type="text"
                id="id"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="이메일을 입력하세요"
                className="w-full px-4 py-3 bg-[#f3f3f5] rounded-lg text-base placeholder:text-[#717182] focus:outline-none focus:ring-2 focus:ring-[#ff5833]/20"
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-base font-semibold mb-2">
                비밀번호
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="w-full px-4 py-3 bg-[#f3f3f5] rounded-lg text-base placeholder:text-[#717182] focus:outline-none focus:ring-2 focus:ring-[#ff5833]/20"
                required
              />
            </div>

            {/* Keep Logged In */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="keepLoggedIn"
                checked={keepLoggedIn}
                onChange={(e) => setKeepLoggedIn(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-[#ff5833] focus:ring-[#ff5833]"
              />
              <label htmlFor="keepLoggedIn" className="text-base text-gray-700">
                로그인 유지
              </label>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#ff5833] hover:bg-[#e54d2c] text-white font-semibold py-3 rounded-lg transition-colors text-lg disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[48px]"
            >
              {isLoading ? "로그인 중..." : "로그인"}
            </button>

            {/* Find Links */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-sm text-gray-600">
              <Link href="/find-id" className="hover:text-gray-900 touch-manipulation">
                아이디 찾기
              </Link>
              <span className="text-gray-400">|</span>
              <Link href="/find-password" className="hover:text-gray-900 touch-manipulation">
                비밀번호 찾기
              </Link>
            </div>

            {/* Divider */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-white text-gray-500 text-sm">또는</span>
              </div>
            </div>

            {/* Social Login Buttons */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleNaverLogin}
                className="w-full bg-[#03c75a] hover:bg-[#02b350] text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 touch-manipulation min-h-[48px]"
              >
                <div className="w-6 h-6 bg-white rounded flex items-center justify-center shrink-0">
                  <span className="text-[#03c75a] font-bold text-lg">N</span>
                </div>
                <span className="truncate">네이버 1초 로그인/회원가입</span>
              </button>

              <button
                type="button"
                onClick={handleKakaoLogin}
                className="w-full bg-[#fee500] hover:bg-[#f5dc00] text-[#000000] font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 touch-manipulation min-h-[48px]"
              >
                <Image src="/kakao.png" alt="Kakao" width={24} height={24} className="w-5 h-5 object-contain shrink-0" />
                <span className="truncate">카카오 1초 로그인/회원가입</span>
              </button>
            </div>

            {/* Sign Up Link */}
            <div className="text-center pt-2 text-sm sm:text-base">
              <span className="text-gray-600">계정이 없으신가요? </span>
              <Link href="/sign-up" className="text-[#ff5833] font-semibold hover:underline touch-manipulation">
                회원가입
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
