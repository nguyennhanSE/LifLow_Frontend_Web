"use client"

import { config } from "@/app/libs/config"
import { serviceAxios } from "../../lib/axios/axios.client"
import { kakaoCallbackAction } from "@/hooks/use-auth/auth.action"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export const useSignIn = () => {
  const router = useRouter()

  const handleNaverLogin = async () => {
    const response = await serviceAxios.get('/auth/naver')
    const redirectUrl = response?.data?.url || response?.data?.redirectUrl || response?.data?.data?.url || response?.data?.data?.redirectUrl || response?.data

    if (typeof redirectUrl === 'string' && redirectUrl) {
      window.location.href = redirectUrl
    } else {
      console.error('Naver OAuth redirect URL not found in response:', response)
    }
  }

  const handleNaverCallback = (code: string) => {
    console.log('handleNaverCallback', code)
  }
  
  const handleKakaoLogin = async () => {
    try {
      const response = await serviceAxios.get('/auth/kakao')
      
      // API có thể trả về URL trong các format khác nhau
      const redirectUrl = response?.data?.url || 
                         response?.data?.redirectUrl || 
                         response?.data?.data?.url ||
                         response?.data?.data?.redirectUrl ||
                         response?.data
      
      if (typeof redirectUrl === 'string' && redirectUrl) {
        window.location.href = redirectUrl
      } else {
        console.error('Kakao OAuth redirect URL not found in response:', response)
      }
    } catch (error: any) {
      console.error('Kakao login error:', error)
      toast.error('카카오 로그인에 실패했습니다')
    }
  }

  const handleKaKaoCallback = async (code: string) => {
    try {
      const response = await serviceAxios.get('/auth/kakao/callback', {
        params: {
          code: code
        }
      })

      const data = response?.data?.data || response?.data
      
      if (!data?.accessToken || !data?.refreshToken || !data?.user) {
        toast.error('Invalid callback response')
        return false
      }

      const result = await kakaoCallbackAction(
        data.accessToken,
        data.refreshToken,
        data.user
      )

      if (!result.success) {
        toast.error(result.error || '카카오 로그인에 실패했습니다')
        return false
      }

      if (result.role === 'ADMIN') {
        window.location.href = '/admin/members'
      } else {
        window.location.href = '/'
      }

      return true
    } catch (error: any) {
      console.error('Kakao callback error:', error)
      toast.error('카카오 로그인에 실패했습니다')
      return false
    }
  }

  return { handleNaverLogin, handleNaverCallback, handleKakaoLogin, handleKaKaoCallback }
}