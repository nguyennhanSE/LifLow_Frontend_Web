"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Facebook, Instagram, Youtube } from "lucide-react"

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null
  return null
}

export function Footer() {
  const [adminHref, setAdminHref] = useState("/admin/sign-in")
  useEffect(() => {
    const token = getCookie("access_token")
    const role = getCookie("role")
    const isAdmin = role && ["ADMIN", "GENERAL_MANAGER", "MANAGER", "CS", "MD"].includes(role)
    setAdminHref(token && isAdmin ? "/admin/members" : "/admin/sign-in")
  }, [])
  return (
    <footer className="bg-[#f5f5f5] border-t border-[#e0e0e0]">
      <div className="container py-12 px-4">
        {/* Top Section - Contact Info & Social Icons */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-[#2d2d2d]">1660-2890</h3>
            <p className="text-sm text-[#6b6b6b]">09:30 AM - 6:30 PM</p>
            <p className="text-sm text-[#6b6b6b]">e-mail: liflow01@naver.com</p>
          </div>
          
          <div className="flex gap-4">
            <Link href="https://www.facebook.com/profile.php?id=61552112873710" target="_blank" className="text-[#6b6b6b] hover:text-[#2d2d2d] transition-colors">
              <Facebook className="w-6 h-6" />
            </Link>
            <Link href="https://www.instagram.com/juwangsangarden_since1988/" target="_blank" className="text-[#6b6b6b] hover:text-[#2d2d2d] transition-colors">
              <Instagram className="w-6 h-6" />
            </Link>
            <Link href="https://www.youtube.com/@%EC%A3%BC%EC%99%95%EC%82%B0%EA%B0%80%EB%93%A0-r5z" target="_blank" className="text-[#6b6b6b] hover:text-[#2d2d2d] transition-colors">
              <Youtube className="w-6 h-6" />
            </Link>
          </div>
        </div>

        {/* Menu Links */}
        <div className="flex flex-wrap gap-4 md:gap-8 mb-8 text-sm text-[#6b6b6b]">
          <Link href="/notice" className="hover:text-[#2d2d2d] transition-colors">
            공지사항
          </Link>
          {/* <span className="text-[#d0d0d0]">|</span> */}
          {/* <Link href="/guide" className="hover:text-[#2d2d2d] transition-colors">
            주왕산 이용 가이드
          </Link> */}
          <span className="hidden md:inline text-[#d0d0d0]">|</span>
          <Link href={adminHref} className="hidden md:inline hover:text-[#2d2d2d] transition-colors">
            관리자
          </Link>
          <span className="text-[#d0d0d0]">|</span>
          <Link href="/userflow" className="hover:text-[#2d2d2d] transition-colors">
            유저 가이드
          </Link>
        </div>

        {/* Company Information */}
        <div className="space-y-2 text-xs text-[#6b6b6b] mb-6">
          <p>
            상호명: 농업회사법인 라이플로우 주식회사 | 대표: 윤동윤 | 사업자등록번호: 715-87-02493
          </p>
          <p>
            경북 청송군 주왕산면 주왕산로 508-9 2층 (우: 37437) | 통신판매신고번호 : 제2022-경북청송-00036호
          </p>
          <div className="flex gap-4">
            <Link href="/policy/privacy-policy" className="hover:text-[#2d2d2d] transition-colors">
              개인정보처리방침
            </Link>
            <span>|</span>
            <Link href="/policy/terms-of-service" className="hover:text-[#2d2d2d] transition-colors">
              이용약관
            </Link>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-xs text-[#999999]">
          <p>Copyright 2023 주왕산가든. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  )
}
