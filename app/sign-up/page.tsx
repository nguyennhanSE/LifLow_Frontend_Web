"use client"

import { useState, useRef } from "react"
import { ArrowLeft, ChevronDown, Home, User } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useUser } from "@/hooks/use-user/user.hook"
import { CreateUserDto } from "@/hooks/use-user/user.dto"
import { toast } from "sonner"
import { PostalCodeButton } from "@/components/common/PostalCodeButton"
import { validateEmail } from "@/helper/function"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { POLICY_TERMS, POLICY_PRIVACY, POLICY_OPTIONAL } from "@/data/policy-content"
import { useTranslation, Trans } from 'react-i18next'
import i18next from 'i18next'

/** Password: 10–16 chars, at least 2 of: uppercase / lowercase / digit / special */
function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 10 || password.length > 16) {
    return { valid: false, message: i18next.t('1016', '비밀번호는 10자~16자로 입력해주세요.') }
  }
  const hasUpper = /[A-Z]/.test(password)
  const hasLower = /[a-z]/.test(password)
  const hasDigit = /\d/.test(password)
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(password)
  const count = [hasUpper, hasLower, hasDigit, hasSpecial].filter(Boolean).length
  if (count < 2) {
    return {
      valid: false,
      message: i18next.t('2', '영문 대소문자/숫자/특수문자 중 2가지 이상 조합해주세요.'),
    }
  }
  return { valid: true }
}

export default function SignupPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { registerUser, checkUserId } = useUser()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingId, setIsCheckingId] = useState(false)
  const [isIdAvailable, setIsIdAvailable] = useState<boolean | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    id: "",
    password: "",
    passwordConfirm: "",
    name: "",
    phoneAreaCode: "02", // Default value
    phoneMiddle: "",
    phoneLast: "",
    mobileCarrier: "010", // Default value
    mobileMiddle: "",
    mobileLast: "",
    email: "",
    zipCode: "",
    addressName: "",
    addressFull: "",
    addressDetail: "",
    birthYear: "",
    birthMonth: "",
    birthDay: "",
    gender: "male",
    dateOfBirth: "",
    nickName: "",
    statusMessage: "",
    referralId: "",
  })

  const [consents, setConsents] = useState({
    terms: false,
    privacy: false,
    sms: false,
    email: false,
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Reset ID availability check when user changes ID
    if (field === "id") {
      setIsIdAvailable(null)
    }
  }

  const handleCheckUserId = async () => {
    if (!formData.id) {
      toast.error("아이디를 입력해주세요")
      return
    }

    // Validate ID format (4-16 characters, lowercase letters and numbers only)
    const idRegex = /^[a-z0-9]{4,16}$/
    if (!idRegex.test(formData.id)) {
      toast.error("영문소문자/숫자, 4-16자로 입력해주세요")
      return
    }

    setIsCheckingId(true)
    try {
      const result = await checkUserId(formData.id)
      // API returns { exists: boolean, userId: string }
      const exists = result?.exists ?? false
      // If exists is false, ID is available (not taken)
      const available = !exists
      setIsIdAvailable(available)
      if (available) {
        toast.success("사용 가능한 아이디입니다")
      }
    } catch (error: any) {
      console.error("Check ID error:", error)
      toast.error(error?.response?.data?.message || "아이디 확인에 실패했습니다")
      setIsIdAvailable(false)
    } finally {
      setIsCheckingId(false)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.id || !formData.password || !formData.name || !formData.email) {
      toast.error("필수 항목을 모두 입력해주세요")
      return
    }

    if (!validateEmail(formData.email)) {
      toast.error("올바른 이메일 형식을 입력해주세요")
      return
    }

    // if (isIdAvailable !== true) {
    //   toast.error("아이디 중복 확인을 해주세요")
    //   return
    // }

    const passwordValidation = validatePassword(formData.password)
    if (!passwordValidation.valid) {
      toast.error(passwordValidation.message)
      return
    }
    if (formData.password !== formData.passwordConfirm) {
      toast.error("비밀번호가 일치하지 않습니다")
      return
    }

    // if (!formData.mobileCarrier || !formData.mobileMiddle || !formData.mobileLast) {
    //   toast.error("휴대전화 번호를 모두 입력해주세요")
    //   return
    // }

    if (!consents.terms || !consents.privacy) {
      toast.error("필수 약관에 동의해주세요")
      return
    }

    // if (!avatarFile) {
    //   toast.error("프로필 이미지를 선택해주세요")
    //   return
    // }

    // Combine phone number from mobileCarrier (휴대전화)
    const phoneNumber = formData.mobileCarrier && formData.mobileMiddle?.trim() && formData.mobileLast?.trim()
      ? t('mobilecarriermobilemiddlemobilelast', '{{mobileCarrier}}-{{mobileMiddle}}-{{mobileLast}}', { mobileCarrier: formData.mobileCarrier, mobileMiddle: formData.mobileMiddle, mobileLast: formData.mobileLast })
      : undefined

    // Combine mobile phone number from phoneAreaCode (일반전화)
    const mobilePhoneNumber = formData.phoneAreaCode && formData.phoneMiddle?.trim() && formData.phoneLast?.trim()
      ? t('phoneareacodephonemiddlephonelast', '{{phoneAreaCode}}-{{phoneMiddle}}-{{phoneLast}}', { phoneAreaCode: formData.phoneAreaCode, phoneMiddle: formData.phoneMiddle, phoneLast: formData.phoneLast })
      : undefined

    // Debug log
    console.log("Phone data:", {
      phoneAreaCode: formData.phoneAreaCode,
      phoneMiddle: formData.phoneMiddle,
      phoneLast: formData.phoneLast,
      phoneNumber,
      mobileCarrier: formData.mobileCarrier,
      mobileMiddle: formData.mobileMiddle,
      mobileLast: formData.mobileLast,
      mobilePhoneNumber,
      userDto: {
        phoneNumber,
        mobilePhoneNumber,
      }
    })

    // Combine birth date
    const dateOfBirth = formData.birthYear && formData.birthMonth && formData.birthDay
      ? t('birthyearvalval2', '{{birthYear}}-{{val}}-{{val2}}', { birthYear: formData.birthYear, val: formData.birthMonth.padStart(2, "0"), val2: formData.birthDay.padStart(2, "0") })
      : undefined

    // Combine address
    const addressFull = formData.addressName && formData.addressDetail
      ? t('addressnameAddressdetail', '{{addressName}} {{addressDetail}}', { addressName: formData.addressName, addressDetail: formData.addressDetail })
      : formData.addressName || formData.addressDetail

    const userDto: CreateUserDto = {
      id: formData.id,
      password: formData.password,
      name: formData.name,
      phoneNumber: phoneNumber || undefined,
      mobilePhoneNumber: mobilePhoneNumber || undefined,
      email: formData.email || undefined,
      zipCode: formData.zipCode ? parseInt(formData.zipCode) : undefined,
      addressName: formData.addressName || undefined,
      addressFull: addressFull || undefined,
      dateOfBirth: dateOfBirth || undefined,
      nickName: formData.nickName || undefined,
      statusMessage: formData.statusMessage || undefined,
    }

    setIsLoading(true)
    try {
      await registerUser(userDto, avatarFile || undefined)
      toast.success("회원가입이 완료되었습니다")
      router.push("/sign-in")
    } catch (error: any) {
      console.error("Registration error:", error)
      toast.error(error?.response?.data?.message || "회원가입에 실패했습니다")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#f5f5f5]">
      {/* Header Navigation */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4 min-w-0">
          <Link href="/sign-in" className="p-2 -m-2 text-gray-700 touch-manipulation shrink-0" aria-label="뒤로">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <Link href="/" className="flex items-center gap-2 text-gray-700 touch-manipulation shrink-0">
            <Home className="w-5 h-5" />
            <span className="text-sm">홈</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 min-w-0">
        {/* Logo and Title */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-[#ff5833] rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z" />
              </svg>
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold">{t('key4', '쭈왕몰')}</h1>
          <h2 className="text-lg sm:text-xl font-semibold mt-4">{t('key6', '회원가입')}</h2>
        </div>

        {/* Registration Form */}
        <form className="bg-white rounded-lg shadow-sm p-4 sm:p-6 space-y-6 min-w-0">
          {/* Basic Information */}
          <div>
            <h3 className="font-semibold mb-4">{t('key7', '기본 정보')}</h3>

            {/* ID Field */}
            <div className="mb-4">
              <label className="block mb-2"><Trans i18nKey="spanClassnametextred500span">아이디 <span className="text-red-500">*</span></Trans></label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={formData.id}
                  onChange={(e) => handleInputChange("id", e.target.value)}
                  placeholder={t('416', '영문소문자/숫자, 4-16자')}
                  className={`flex-1 min-w-0 px-4 py-3 bg-[#f3f3f5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#ff5833] ${
                    isIdAvailable === true ? "ring-2 ring-green-500" : ""
                  } ${isIdAvailable === false ? "ring-2 ring-red-500" : ""}`}
                  required
                />
                <button
                  type="button"
                  onClick={handleCheckUserId}
                  disabled={isCheckingId || !formData.id}
                  className="sm:shrink-0 px-4 py-3 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                >
                  {isCheckingId ? t('key8', '확인 중...') : "중복 확인"}
                </button>
              </div>
              <p className="text-sm text-[#717182] mt-1">{t('416', '영문소문자/숫자, 4-16자')}</p>
              {isIdAvailable === true && (
                <p className="text-sm text-green-600 mt-1">{t('key9', '✓ 사용 가능한 아이디입니다')}</p>
              )}
              {isIdAvailable === false && (
                <p className="text-sm text-red-600 mt-1">{t('key10', '✗ 이미 사용 중인 아이디입니다')}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="mb-4">
              <label className="block mb-2"><Trans i18nKey="spanClassnametextred500span2">비밀번호 <span className="text-red-500">*</span></Trans></label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                placeholder={t('key11', '비밀번호를 입력하세요')}
                className={`w-full px-4 py-3 bg-[#f3f3f5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#ff5833] ${
                  formData.password && !validatePassword(formData.password).valid ? "ring-2 ring-red-500" : ""
                }`}
                required
                minLength={10}
                maxLength={16}
              />
              <p className="text-sm text-[#717182] mt-1">{t('21016', '영문 대소문자/숫자/특수문자 중 2가지 이상 조합, 10자~16자')}</p>
              {formData.password && !validatePassword(formData.password).valid && (
                <p className="text-sm text-red-600 mt-1">{validatePassword(formData.password).message}</p>
              )}
            </div>

            {/* Password Confirmation */}
            <div className="mb-4">
              <label className="block mb-2"><Trans i18nKey="spanClassnametextred500span3">비밀번호 확인 <span className="text-red-500">*</span></Trans></label>
              <input
                type="password"
                value={formData.passwordConfirm}
                onChange={(e) => handleInputChange("passwordConfirm", e.target.value)}
                placeholder={t('key12', '비밀번호를 다시 입력하세요')}
                className="w-full px-4 py-3 bg-[#f3f3f5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#ff5833]"
                required
              />
            </div>

            {/* Name Field */}
            <div className="mb-4">
              <label className="block mb-2"><Trans i18nKey="spanClassnametextred500span4">이름 <span className="text-red-500">*</span></Trans></label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder={t('key13', '이름을 입력하세요')}
                className="w-full px-4 py-3 bg-[#f3f3f5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#ff5833]"
                required
              />
            </div>

            {/* General Phone */}
            <div className="mb-4">
              <label className="block mb-2">{t('key14', '일반전화')}</label>
              <div className="flex flex-wrap gap-2 min-w-0">
                <select
                  value={formData.phoneAreaCode}
                  onChange={(e) => handleInputChange("phoneAreaCode", e.target.value)}
                  className="shrink-0 px-3 sm:px-4 py-3 bg-[#f3f3f5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#ff5833] min-w-0"
                  aria-label={t('key15', '일반전화 지역번호')}
                >
                  <option value="02">02</option>
                  <option value="031">031</option>
                  <option value="032">032</option>
                  <option value="041">041</option>
                  <option value="042">042</option>
                  <option value="043">043</option>
                  <option value="044">044</option>
                  <option value="051">051</option>
                  <option value="052">052</option>
                  <option value="053">053</option>
                  <option value="054">054</option>
                  <option value="055">055</option>
                  <option value="061">061</option>
                  <option value="062">062</option>
                  <option value="063">063</option>
                  <option value="064">064</option>
                </select>
                <span className="hidden sm:flex items-center shrink-0">-</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formData.phoneMiddle}
                  onChange={(e) => handleInputChange("phoneMiddle", e.target.value.replace(/\D/g, ""))}
                  placeholder="1234"
                  className="flex-1 min-w-0 px-4 py-3 bg-[#f3f3f5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#ff5833]"
                  maxLength={4}
                />
                <span className="hidden sm:flex items-center shrink-0">-</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formData.phoneLast}
                  onChange={(e) => handleInputChange("phoneLast", e.target.value.replace(/\D/g, ""))}
                  placeholder="5678"
                  className="flex-1 min-w-0 px-4 py-3 bg-[#f3f3f5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#ff5833]"
                  maxLength={4}
                />
              </div>
            </div>

            {/* Mobile Phone */}
            <div className="mb-4">
              <label className="block mb-2"><Trans i18nKey="spanClassnametextred500span5">휴대전화 <span className="text-red-500">*</span></Trans></label>
              <div className="flex flex-wrap gap-2 mb-2 min-w-0">
                <select
                  value={formData.mobileCarrier}
                  onChange={(e) => handleInputChange("mobileCarrier", e.target.value)}
                  className="shrink-0 px-3 sm:px-4 py-3 bg-[#f3f3f5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#ff5833] min-w-0"
                  aria-label={t('key16', '휴대전화 통신사')}
                  required
                >
                  <option value="010">010</option>
                  <option value="011">011</option>
                  <option value="016">016</option>
                  <option value="017">017</option>
                  <option value="018">018</option>
                  <option value="019">019</option>
                </select>
                <span className="hidden sm:flex items-center shrink-0">-</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formData.mobileMiddle}
                  onChange={(e) => handleInputChange("mobileMiddle", e.target.value.replace(/\D/g, ""))}
                  placeholder="1234"
                  className="flex-1 min-w-0 px-4 py-3 bg-[#f3f3f5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#ff5833]"
                  maxLength={4}
                  required
                />
                <span className="hidden sm:flex items-center shrink-0">-</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formData.mobileLast}
                  onChange={(e) => handleInputChange("mobileLast", e.target.value.replace(/\D/g, ""))}
                  placeholder="5678"
                  className="flex-1 min-w-0 px-4 py-3 bg-[#f3f3f5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#ff5833]"
                  maxLength={4}
                  required
                />
              </div>
              {/* <button
                type="button"
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50"
              >
                인증번호받기
              </button> */}
            </div>

            {/* Email Field */}
            <div className="mb-4">
              <label className="block mb-2"><Trans i18nKey="spanClassnametextred500span6">이메일 <span className="text-red-500">*</span></Trans></label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder={t('key17', '이메일을 입력하세요')}
                className="w-full px-4 py-3 bg-[#f3f3f5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#ff5833]"
                required
              />
            </div>

            {/* Address Field */}
            <div className="mb-4">
              <label className="block mb-2"><Trans i18nKey="spanClassnametextred500span7">주소 <span className="text-red-500">*</span></Trans></label>
              <div className="flex flex-col sm:flex-row gap-2 mb-2 min-w-0">
                <input
                  type="text"
                  disabled
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange("zipCode", e.target.value)}
                  placeholder="우편번호"
                  className="flex-1 min-w-0 px-4 py-3 bg-[#f8f8fa] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#ff5833]"
                  required
                />
                <PostalCodeButton
                  onComplete={(data) => {
                    handleInputChange("zipCode", data.zipCode);
                    handleInputChange(t('addressname', 'addressName'), data.addressName);
                  }}
                />
              </div>
              <input
                type="text"
                disabled
                value={formData.addressName}
                onChange={(e) => handleInputChange("addressName", e.target.value)}
                placeholder="기본주소"
                className="w-full px-4 py-3 bg-[#f8f8fa] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#ff5833] mb-2"
                required
              />
              <input
                type="text"
                value={formData.addressDetail}
                onChange={(e) => handleInputChange("addressDetail", e.target.value)}
                placeholder={t('key18', '나머지 주소(선택 입력 가능)')}
                className="w-full px-4 py-3 bg-[#f3f3f5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#ff5833]"
              />
            </div>

            {/* Birth Date */}
            <div className="mb-4">
              <label className="block mb-2"><Trans i18nKey="spanClassnametextred500span8">생년월일 <span className="text-red-500">*</span></Trans></label>
              <div className="flex flex-wrap gap-2 mb-3 min-w-0">
                <input
                  type="text"
                  value={formData.birthYear}
                  onChange={(e) => handleInputChange("birthYear", e.target.value)}
                  placeholder={t('4', '년 (4자리)')}
                  className="flex-1 min-w-0 px-4 py-3 bg-[#f3f3f5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#ff5833]"
                  maxLength={4}
                  required
                />
                <input
                  type="text"
                  value={formData.birthMonth}
                  onChange={(e) => handleInputChange("birthMonth", e.target.value)}
                  placeholder="월"
                  className="flex-1 min-w-0 px-4 py-3 bg-[#f3f3f5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#ff5833]"
                  maxLength={2}
                  required
                />
                <input
                  type="text"
                  value={formData.birthDay}
                  onChange={(e) => handleInputChange("birthDay", e.target.value)}
                  placeholder="일"
                  className="flex-1 min-w-0 px-4 py-3 bg-[#f3f3f5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#ff5833]"
                  maxLength={2}
                  required
                />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={formData.gender === "male"}
                    onChange={(e) => handleInputChange("gender", e.target.value)}
                    className="w-4 h-4 text-[#ff5833]"
                  />
                  <span>{t('key19', '남성')}</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={formData.gender === "female"}
                    onChange={(e) => handleInputChange("gender", e.target.value)}
                    className="w-4 h-4 text-[#ff5833]"
                  />
                  <span>{t('key20', '여성')}</span>
                </label>
              </div>
            </div>

            {/* Additional ID */}
            <div>
              <label htmlFor="referralId" className="block mb-2">{t('key21', '추천인 아이디')}</label>
              <input
                id="referralId"
                type="text"
                value={formData.referralId}
                onChange={(e) => handleInputChange("referralId", e.target.value)}
                placeholder={t('key22', '추천인 아이디를 입력하세요')}
                className="w-full px-4 py-3 bg-[#f3f3f5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#ff5833]"
              />
            </div>
          </div>

          {/* Profile Information */}
          <div>
            <h3 className="font-semibold mb-2">{t('key23', '프로필 정보')}</h3>
            <p className="text-sm text-[#717182] mb-4">{t('key24', '나중에 마이페이지에서 수정 가능해요')}</p>

            {/* Profile Image */}
            <div className="mb-4">
              <label className="block mb-2">{t('key25', '프로필 이미지')}</label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-20 h-20 bg-[#f3f3f5] rounded-full flex items-center justify-center overflow-hidden">
                  {avatarPreview ? (
                    <Image src={avatarPreview} alt="프로필" width={80} height={80} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-[#717182]" />
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  aria-label={t('key26', '프로필 이미지 업로드')}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                  {t('key27', '이미지 선택')}
                </button>
              </div>
            </div>

            {/* Nickname */}
            <div className="mb-4">
              <label className="block mb-2">{t('key28', '닉네임')}</label>
              <input
                type="text"
                value={formData.nickName}
                onChange={(e) => handleInputChange("nickName", e.target.value.trim().slice(0, 10))}
                placeholder={t('key29', '닉네임을 입력하세요')}
                maxLength={10}
                className="w-full px-4 py-3 bg-[#f3f3f5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#ff5833]"
              />
              <p className="text-sm text-[#717182] mt-1">{t('10', '10자 이내(한글/영문/숫자 가능)')}</p>
            </div>

            {/* Simple Introduction */}
            <div>
              <label className="block mb-2">{t('key30', '간단한 소개')}</label>
              <textarea
                value={formData.statusMessage}
                onChange={(e) => handleInputChange("statusMessage", e.target.value)}
                placeholder={t('key31', '간단한 소개를 입력하세요')}
                rows={3}
                className="w-full px-4 py-3 bg-[#f3f3f5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#ff5833] resize-none"
                maxLength={65}
              />
              <p className="text-sm text-[#717182] mt-1">{t('65', '공백 포함 65자 이내')}</p>
            </div>
          </div>

          {/* Consent Section */}
          <div className="bg-[#f3f3f5] p-4 rounded">
            <div className="mb-3 flex items-start gap-2">
              <input
                type="checkbox"
                checked={consents.terms && consents.privacy && consents.sms && consents.email}
                onChange={(e) => {
                  const checked = e.target.checked
                  setConsents({
                    terms: checked,
                    privacy: checked,
                    sms: checked,
                    email: checked,
                  })
                }}
                className="mt-0.5 w-4 h-4 shrink-0"
                aria-label={t('key32', '전체 동의')}
              />
              <div>
                <p className="font-semibold mb-1">{t('key32', '전체 동의')}</p>
                <p className="text-sm text-[#717182]">
                  {t('key33', '이용약관 및 개인정보수집 및 이용, 소식받기 동의(선택)에 모두 동의합니다.')}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {/* [필수] 이용약관 동의 */}
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={consents.terms}
                  onChange={(e) => setConsents((prev) => ({ ...prev, terms: e.target.checked }))}
                  className="mt-1 w-4 h-4 shrink-0"
                  aria-label={t('key34', '이용약관 동의')}
                />
                <Collapsible className="flex-1 min-w-0 rounded-lg border border-[#e5e5e5] overflow-hidden bg-white">
                  <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 p-3 text-left hover:bg-[#ebebeb] transition-colors">
                    <span className="text-sm truncate">{t('key35', '[필수] 이용약관 동의')}</span>
                    <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 data-[state=open]:rotate-180" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="max-h-60 overflow-y-auto border-t border-[#e5e5e5] bg-white p-3 text-xs text-[#717182] whitespace-pre-line">
                      {POLICY_TERMS}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>

              {/* [필수] 개인정보처리방침 동의 */}
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={consents.privacy}
                  onChange={(e) => setConsents((prev) => ({ ...prev, privacy: e.target.checked }))}
                  className="mt-1 w-4 h-4 shrink-0"
                  aria-label={t('key36', '개인정보처리방침 동의')}
                />
                <Collapsible className="flex-1 min-w-0 rounded-lg border border-[#e5e5e5] overflow-hidden bg-white">
                  <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 p-3 text-left hover:bg-[#ebebeb] transition-colors">
                    <span className="text-sm truncate">{t('key37', '[필수] 개인정보처리방침 동의')}</span>
                    <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 data-[state=open]:rotate-180" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="max-h-60 overflow-y-auto border-t border-[#e5e5e5] bg-white p-3 text-xs text-[#717182] whitespace-pre-line">
                      {POLICY_PRIVACY}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>

              {/* [선택] SMS 수신 동의 */}
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={consents.sms}
                  onChange={(e) => setConsents((prev) => ({ ...prev, sms: e.target.checked }))}
                  className="mt-1 w-4 h-4 shrink-0"
                  aria-label={t('sms', 'SMS 수신 동의')}
                />
                <Collapsible className="flex-1 min-w-0 rounded-lg border border-[#e5e5e5] overflow-hidden bg-white">
                  <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 p-3 text-left hover:bg-[#ebebeb] transition-colors">
                    <span className="text-sm truncate">{t('sms2', '[선택] SMS 수신 동의')}</span>
                    <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 data-[state=open]:rotate-180" />
                  </CollapsibleTrigger>
                  {/* <CollapsibleContent>
                    <div className="max-h-60 overflow-y-auto border-t border-[#e5e5e5] bg-white p-3 text-xs text-[#717182] whitespace-pre-line">
                      {POLICY_OPTIONAL}
                    </div>
                  </CollapsibleContent> */}
                </Collapsible>
              </div>

              {/* [선택] 이메일 수신 동의 */}
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={consents.email}
                  onChange={(e) => setConsents((prev) => ({ ...prev, email: e.target.checked }))}
                  className="mt-1 w-4 h-4 shrink-0"
                  aria-label={t('key38', '이메일 수신 동의')}
                />
                <Collapsible className="flex-1 min-w-0 rounded-lg border border-[#e5e5e5] overflow-hidden bg-white">
                  <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 p-3 text-left hover:bg-[#ebebeb] transition-colors">
                    <span className="text-sm truncate">{t('key39', '[선택] 이메일 수신 동의')}</span>
                    <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 data-[state=open]:rotate-180" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="max-h-60 overflow-y-auto border-t border-[#e5e5e5] bg-white p-3 text-xs text-[#717182] whitespace-pre-line">
                      {POLICY_OPTIONAL}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            onClick={handleSubmit}
            className="w-full bg-[#ff5833] text-white py-4 rounded font-semibold hover:bg-[#e54d2c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[48px]"
          >
            {isLoading ? t('key40', '가입 중...') : "회원가입"}
          </button>

          {/* Login Link */}
          <p className="text-center text-sm text-[#717182]">
            {t('key41', '이미 계정이 있으신가요?')}{" "}
            <Link href="/sign-in" className="text-[#ff5833] font-semibold">
              {t('key42', '로그인')}
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
