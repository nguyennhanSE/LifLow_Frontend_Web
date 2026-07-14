"use client"

import { Calendar, Camera, Edit, Mail, Phone, Shield, User, Save, X } from "lucide-react"
import { useEffect, useState, useRef, type ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useUser } from "@/hooks/use-user/user.hook"
import { useAuthHook } from "@/hooks/use-auth/auth.hook"
import { User as UserEntity } from "@/entities/user.entity"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { emitUserProfileUpdated } from "@/lib/user-profile-sync"
import { useTranslation } from 'react-i18next'

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null
  return null
}

export default function MyPageInformation() {
  const { t } = useTranslation()
  const router = useRouter()
  const { getMyInformation, updateMyInformation, updatePassword, cancelMembership, updateMyAvatar } = useUser()
  const { handleLogout } = useAuthHook()
  
  const [userData, setUserData] = useState<UserEntity | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: ""
  })
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [isCancellingMembership, setIsCancellingMembership] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // Fetch user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true)
        const data = await getMyInformation()
        setUserData(data)
        setFormData({
          name: data.name ?? "",
          email: data.email ?? "",
          phoneNumber: data.phoneNumber ?? ""
        })
      } catch (error) {
        console.error("Failed to fetch user information:", error)
        toast.error("회원 정보를 불러오는데 실패했습니다")
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [getMyInformation, toast])

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    if (userData) {
      setFormData({
        name: userData.name ?? "",
        email: userData.email ?? "",
        phoneNumber: userData.phoneNumber ?? ""
      })
    }
  }

  const handleSave = async () => {
    try {
      const updatedUser = await updateMyInformation(formData)
      setUserData(updatedUser)
      emitUserProfileUpdated(updatedUser)
      setIsEditing(false)
      toast.success("회원 정보가 성공적으로 업데이트되었습니다")
    } catch (error) {
      console.error("Failed to update user information:", error)
      toast.error("회원 정보 업데이트에 실패했습니다")
    }
  }

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleOpenPasswordDialog = () => {
    setOldPassword("")
    setNewPassword("")
    setIsPasswordDialogOpen(true)
  }

  const handleSubmitPasswordChange = async () => {
    if (!oldPassword.trim() || !newPassword.trim()) {
      toast.error("현재 비밀번호와 새 비밀번호를 모두 입력해주세요.")
      return
    }

    setIsUpdatingPassword(true)
    try {
      await updatePassword(oldPassword.trim(), newPassword.trim())
      toast.success("비밀번호가 변경되었습니다.")
      setIsPasswordDialogOpen(false)
      setOldPassword("")
      setNewPassword("")
    } catch (error: any) {
      const message =
        typeof error?.message === "string" && error.message.trim()
          ? error.message
          : t('key281', '비밀번호 변경에 실패했습니다.')
      toast.error(t('key282', '비밀번호 변경 실패'), { description: message })
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const handleAvatarButtonClick = () => {
    avatarInputRef.current?.click()
  }

  const handleAvatarFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file || !file.type.startsWith("image/")) {
      if (file) toast.error("이미지 파일만 업로드할 수 있습니다.")
      return
    }
    setIsUploadingAvatar(true)
    try {
      const updated = await updateMyAvatar(file)
      setUserData(updated)
      emitUserProfileUpdated(updated)
      toast.success("프로필 사진이 업데이트되었습니다")
    } catch (error) {
      console.error("Avatar update failed:", error)
      toast.error("프로필 사진 업데이트에 실패했습니다")
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleCancelMembership = async () => {
    if (!confirm("회원 탈퇴 시 모든 정보가 삭제되며 복구할 수 없습니다. 정말 탈퇴하시겠습니까?")) {
      return
    }
    setIsCancellingMembership(true)
    try {
      await cancelMembership()
      toast.success("회원 탈퇴가 완료되었습니다.")
      const refreshToken = getCookie("refresh_token")
      if (refreshToken) {
        await handleLogout(refreshToken)
      }
      router.push("/sign-in")
      router.refresh()
    } catch (error: any) {
      const message =
        typeof error?.message === "string" && error.message.trim()
          ? error.message
          : t('key283', '회원 탈퇴에 실패했습니다.')
      toast.error(t('key284', '회원 탈퇴 실패'), { description: message })
    } finally {
      setIsCancellingMembership(false)
    }
  }

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA')
  }

  // Format number with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">{t('key74', '로딩 중...')}</div>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-red-500">{t('key285', '회원 정보를 불러오는데 실패했습니다')}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full max-w-none">
      {/* Header with Avatar and User Info */}
      <div className="bg-white rounded-lg p-8 border border-gray-200">
        <div className="flex items-start gap-6">
          <div className="relative">
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              title={t('key286', '프로필 사진 파일 선택')}
              className="hidden"
              onChange={handleAvatarFileChange}
              aria-hidden
            />
            <Avatar className="size-24">
                {(() => {
                  const u = userData as UserEntity & { avatarURL?: string }
                  const avatarSrc = u.avatarUrl ?? u.avatarURL
                  return avatarSrc ? (
                    <AvatarImage src={avatarSrc} alt={userData.name} />
                  ) : null
                })()}
                <AvatarFallback className="text-2xl bg-muted">
                  {getInitials(userData.name)}
                </AvatarFallback>
              </Avatar>
            <button
              type="button"
              aria-label={t('changeProfilePhoto', 'Change profile photo')}
              disabled={isUploadingAvatar}
              onClick={handleAvatarButtonClick}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold mb-2">{userData.name}</h1>
            <div className="flex items-center gap-4 text-sm text-[#717182]">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span className="text-[#ff5833] font-semibold">
                  {userData.membership?.name || "GENERAL"}
                </span>
                <span> {t('key230', '등급')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{t('key287', '가입일:')}</span>
                <span>{formatDate(userData.registrationDate)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <div className="bg-white rounded-lg p-8 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">{t('key7', '기본 정보')}</h2>
          {!isEditing ? (
            <button 
              type="button" 
              onClick={handleEdit}
              className="flex items-center gap-2 text-sm hover:text-[#ff5833] transition-colors"
            >
              <Edit className="w-4 h-4" />
              {t('key288', '수정')}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                {t('key289', '저장')}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-700 transition-colors"
              >
                <X className="w-4 h-4" />
                {t('key212', '취소')}
              </button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Name */}
          <div>
            <label className="flex items-center gap-2 text-sm text-[#717182] mb-2">
              <User className="w-4 h-4" />
              {t('key79', '이름')}
            </label>
            {isEditing ? (
              <Input
                value={formData.name ?? ""}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="w-full"
              />
            ) : (
              <div className="w-full px-4 py-3 bg-[#f5f5f5] rounded-md">{userData.name}</div>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label className="flex items-center gap-2 text-sm text-[#717182] mb-2">
              <Phone className="w-4 h-4" />
              {t('key185', '전화번호')}
            </label>
            {isEditing ? (
              <Input
                type="tel"
                inputMode="numeric"
                value={formData.phoneNumber ?? ""}
                onChange={(e) => handleInputChange("phoneNumber", e.target.value.replace(/\D/g, ""))}
                className="w-full"
              />
            ) : (
              <div className="w-full px-4 py-3 bg-[#f5f5f5] rounded-md">{userData.phoneNumber}</div>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="flex items-center gap-2 text-sm text-[#717182] mb-2">
              <Mail className="w-4 h-4" />
              {t('key80', '이메일')}
            </label>
            {isEditing ? (
              <Input
                type="email"
                value={formData.email ?? ""}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="w-full"
              />
            ) : (
              <div className="w-full px-4 py-3 bg-[#f5f5f5] rounded-md">{userData.email}</div>
            )}
          </div>

          {/* Membership Level - Always disabled */}
          <div>
            <label className="flex items-center gap-2 text-sm text-[#717182] mb-2">
              <Shield className="w-4 h-4" />
              {t('key290', '회원 등급')}
            </label>
            <div className="w-full px-4 py-3 bg-[#f5f5f5] rounded-md text-[#ff5833] font-semibold">
              {userData.membership?.name || "GENERAL"}
            </div>
            <p className="text-sm text-[#717182] mt-2">
              {t('key291', '* 회원 등급은 구매 이력에 따라 자동으로 조정됩니다')}
            </p>
          </div>

          {/* Join Date - Always disabled */}
          <div>
            <label className="flex items-center gap-2 text-sm text-[#717182] mb-2">
              <Calendar className="w-4 h-4" />
              {t('key292', '가입일')}
            </label>
            <div className="w-full px-4 py-3 bg-[#f5f5f5] rounded-md">
              {formatDate(userData.registrationDate)}
            </div>
          </div>
        </div>
      </div>

      {/* My Activities */}
      <div className="bg-white rounded-lg p-8 border border-gray-200">
        <h2 className="text-lg font-semibold mb-6">{t('key293', '나의 활동')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#f5f5f5] rounded-lg p-6 text-center">
            <p className="text-sm text-[#717182] mb-2">{t('key294', '총 구매 금액')}</p>
            <p className="text-3xl font-bold text-[#ff5833]">
              ₩{formatNumber(userData.totalPurchaseAmount || 0)}
            </p>
          </div>
          <div className="bg-[#f5f5f5] rounded-lg p-6 text-center">
            <p className="text-sm text-[#717182] mb-2">{t('key231', '보유 포인트')}</p>
            <p className="text-3xl font-bold text-[#ff5833]">
              {formatNumber(userData.availablePoints)}P
            </p>
          </div>
          <div className="bg-[#f5f5f5] rounded-lg p-6 text-center">
            <p className="text-sm text-[#717182] mb-2">{t('key290', '회원 등급')}</p>
            <p className="text-3xl font-bold text-[#ff5833]">
              {userData.membership?.name || "GENERAL"}
            </p>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-lg p-8 border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">{t('key295', '비밀번호 변경')}</h2>
        <p className="text-sm text-[#717182] mb-4">{t('key296', '보안을 위해 주기적으로 비밀번호를 변경해 주세요.')}</p>
        <button
          type="button"
          onClick={handleOpenPasswordDialog}
          className="text-sm font-medium hover:text-[#ff5833] transition-colors underline"
        >
          {t('key297', '비밀번호 변경하기')}
        </button>
      </div>

      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('key295', '비밀번호 변경')}</DialogTitle>
            <DialogDescription>{t('key298', '현재 비밀번호와 새 비밀번호를 입력해주세요.')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="oldPassword">{t('key299', '현재 비밀번호')}</Label>
              <Input
                id="oldPassword"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder={t('key299', '현재 비밀번호')}
                autoComplete="current-password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">{t('key300', '새 비밀번호')}</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('key300', '새 비밀번호')}
                autoComplete="new-password"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPasswordDialogOpen(false)}
              disabled={isUpdatingPassword}
            >
              {t('key212', '취소')}
            </Button>
            <Button
              type="button"
              className="bg-black text-white hover:bg-black/90"
              onClick={handleSubmitPasswordChange}
              disabled={isUpdatingPassword}
            >
              {isUpdatingPassword ? t('key301', '변경 중...') : "변경"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Account Deletion */}
      <div className="bg-white rounded-lg p-8 border border-gray-200">
        <h2 className="text-lg font-semibold text-[#ff5c5c] mb-4">{t('key302', '회원 탈퇴')}</h2>
        <p className="text-sm text-[#717182] mb-6">
          {t('key303', '회원 탈퇴 시 모든 정보가 삭제되며 복구할 수 없습니다.')}
        </p>
        <Button
          className="bg-[#ff5c5c] hover:bg-[#ff5c5c]/90 text-white"
          onClick={handleCancelMembership}
          disabled={isCancellingMembership}
        >
          {isCancellingMembership ? t('key197', '처리 중...') : "회원 탈퇴"}
        </Button>
      </div>
    </div>
  )
}
