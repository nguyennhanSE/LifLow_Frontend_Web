"use client"

import { useState } from "react"
import Image from "next/image"
import { useAuthHook } from "@/hooks/use-auth/auth.hook"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function AdminSignInPage() {
  const [id, setId] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const { handleLogin } = useAuthHook()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id.trim() || !password.trim()) return

    setIsLoading(true)
    try {
      await handleLogin(id, password)
      // handleLogin redirects: ADMIN -> /admin/members, else -> /
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center items-center py-12 px-4">
      {/* Form card */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg  rounded-xl bg-gray-100/80 shadow-sm border border-gray-200/80 p-6 py-12 space-y-5"
      >
        {/* Logo & Title */}
      <div className="flex flex-col items-center mb-6">
        <div className="flex items-center gap-3">
          <Image
            src="/Icon-orange.png"
            alt="쭈왕몰"
            width={36}
            height={36}
          />
          <h1 className="text-xl font-semibold text-black">쭈왕몰 관리자</h1>
        </div>
        <p className="text-base text-black/80 mt-2">관리자 로그인</p>
      </div>

      {/* Form fields card */}
      <div className="bg-white rounded-lg border border-gray-200/80 shadow-sm p-6 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="admin-id" className="text-sm font-medium text-black">
            관리자 ID
          </Label>
          <Input
            id="admin-id"
            type="text"
            placeholder="관리자 ID를 입력하세요"
            className="h-10 bg-gray-50/80 border-gray-200 rounded-md"
            value={id}
            onChange={(e) => setId(e.target.value)}
            autoComplete="username"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="admin-password" className="text-sm font-medium text-black">
            비밀번호
          </Label>
          <Input
            id="admin-password"
            type="password"
            placeholder="비밀번호를 입력하세요"
            className="h-10 bg-gray-50/80 border-gray-200 rounded-md"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        <Button
          type="submit"
          className="w-full h-11 rounded-md bg-[#ff5833] hover:bg-[#e64d2e] text-white font-medium mt-2"
          disabled={isLoading || !id.trim() || !password.trim()}
        >
          {isLoading ? "로그인 중..." : "로그인"}
        </Button>
      </div>
      </form>
    </div>
  )
}
