"use client"

import { ArrowLeft, Home } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { toast } from "sonner"
import { useUser } from "@/hooks/use-user/user.hook"

export default function FindIdPage() {
  const { findId } = useUser()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [foundId, setFoundId] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name || !email) {
      toast.error("이름과 이메일을 입력해주세요")
      return
    }

    setIsLoading(true)
    try {
      const response = await findId(name, email)
      // Assuming API returns { id: string } or similar
      const userId = response?.id || response?.userId || response
      if (userId) {
        setFoundId(String(userId))
        toast.success("아이디를 찾았습니다")
      } else {
        toast.error("아이디를 찾을 수 없습니다")
      }
    } catch (error: any) {
      console.error("Find ID error:", error)
      toast.error(error?.response?.data?.message || "아이디 찾기에 실패했습니다")
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
          <h1 className="text-3xl font-bold">쭈왕몰</h1>
        </div>
        <header className="flex justify-between items-center mb-6">
          <Link href="/sign-in">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <Link href="/">
            <Home className="w-6 h-6" />
          </Link>
        </header>

        <h1 className="text-3xl font-bold text-center mb-4">아이디 찾기</h1>


        <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
        <p className="text-center text-gray-600 mb-8 text-sm">
          회원가입 시 입력하신 이름과 이메일을 입력해주세요.
        </p>
          {foundId ? (
            <div className="space-y-6 text-center">
              <div className="py-8">
                <p className="text-lg mb-4">회원님의 아이디는</p>
                <p className="text-2xl font-bold text-[#ff5833] mb-4">{foundId}</p>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/sign-in"
                  className="flex-1 bg-[#ff5833] hover:bg-[#e54d2c] text-white font-semibold py-3 rounded-lg transition-colors text-center"
                >
                  로그인
                </Link>
                <button
                  onClick={() => setFoundId(null)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-lg transition-colors"
                >
                  다시 찾기
                </button>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2 text-gray-700">
                  이름
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="이름을 입력하세요"
                  className="w-full px-4 py-3 bg-[#f3f3f5] rounded-lg text-base placeholder:text-[#717182] focus:outline-none focus:ring-2 focus:ring-[#ff5833]/20"
                  required
                />
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2 text-gray-700">
                  이메일
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="이메일을 입력하세요"
                  className="w-full px-4 py-3 bg-[#f3f3f5] rounded-lg text-base placeholder:text-[#717182] focus:outline-none focus:ring-2 focus:ring-[#ff5833]/20"
                  required
                />
              </div>

              {/* Find ID Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#ff5833] hover:bg-[#e54d2c] text-white font-semibold py-4 rounded-lg transition-colors text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "찾는 중..." : "아이디 찾기"}
              </button>

              {/* Links */}
              <div className="flex flex-col items-center gap-2 pt-4">
                <Link href="/find-password" className="text-[#ff5833] font-semibold hover:underline text-sm">
                  비밀번호 찾기
                </Link>
                <Link href="/sign-up" className="text-gray-600 hover:text-gray-900 text-sm">
                  회원가입
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
