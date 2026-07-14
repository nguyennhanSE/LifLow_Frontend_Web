/* eslint-disable @next/next/no-img-element */
'use client'

import { useMemo, useState, use, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'

import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useProductInquiry } from '@/hooks/use-product-inquiry/product-inquiry.hook'
import type {
  ProductInquiryAnswerEntity,
  ProductInquiryEntity,
} from '@/entities/product-inquiry/product-inquiry.entity'
import { useTranslation, Trans } from 'react-i18next'

type ProductInquiryByIdResponse = ProductInquiryEntity & {
  status?: 'pending' | 'completed'
  productInquiryAnswers?: ProductInquiryAnswerEntity[]
}

function getInquiryStatus(inquiry: ProductInquiryByIdResponse | undefined) {
  if (!inquiry) return 'pending' as const
  if (inquiry.status) return inquiry.status
  const hasAnswers = (inquiry.productInquiryAnswers?.length ?? 0) > 0
  return inquiry.hasAnswer || inquiry.answer || hasAnswers ? ('completed' as const) : ('pending' as const)
}

function AnswerItem({
  answer,
  answeredAt,
  isEditing,
  editValue,
  onStartEdit,
  onChangeEditValue,
  onCancelEdit,
  onSaveEdit,
  isSaving,
}: {
  answer: ProductInquiryAnswerEntity
  answeredAt: Date | null
  isEditing: boolean
  editValue: string
  onStartEdit: () => void
  onChangeEditValue: (v: string) => void
  onCancelEdit: () => void
  onSaveEdit: () => void
  isSaving: boolean
}) {
  const { t } = useTranslation()
  const [answerAvatarLoading, setAnswerAvatarLoading] = useState(false)
  const [answerAvatarLoaded, setAnswerAvatarLoaded] = useState(false)

  return (
    <div className="rounded-lg border border-border bg-blue-50/40 p-4">
      <div className="flex items-start gap-3">
        {answer.user?.avatarUrl ? (
          <div className="relative h-8 w-8 rounded-full border border-border overflow-hidden bg-muted shrink-0">
            {answerAvatarLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
                <Spinner className="h-3 w-3 text-[#FF5833]" />
              </div>
            )}
            <img
              src={answer.user.avatarUrl}
              alt={answer.user.name ?? 'User'}
              className={`h-full w-full object-cover transition-opacity duration-300 ${
                answerAvatarLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => {
                setAnswerAvatarLoading(false)
                setAnswerAvatarLoaded(true)
              }}
              onError={() => {
                setAnswerAvatarLoading(false)
                setAnswerAvatarLoaded(true)
              }}
            />
          </div>
        ) : (
          <div className="h-8 w-8 rounded-full bg-muted border border-border flex items-center justify-center text-xs text-muted-foreground shrink-0">
            {(answer.user?.name ?? 'A')?.charAt(0).toUpperCase() || 'A'}
          </div>
        )}
        <div className="flex-1">
          <div className="mb-2 flex items-start justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {answer.user?.name ?? '관리자'}
              {answeredAt ? t('val3', '· {{val}}', { val: format(answeredAt, 'yyyy-MM-dd HH:mm') }) : ''}
            </p>
            {!isEditing ? (
              <Button variant="ghost" size="sm" onClick={onStartEdit} className="h-7 px-2 text-xs">
                {t('key288', '수정')}
              </Button>
            ) : null}
          </div>

          {!isEditing ? (
            <p className="text-sm text-foreground whitespace-pre-wrap">{answer.answer}</p>
          ) : (
            <div className="space-y-2">
              <Textarea
                value={editValue}
                onChange={(e) => onChangeEditValue(e.target.value)}
                className="min-h-24 bg-white"
                placeholder={t('key673', '답변 내용을 입력하세요')}
              />
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" size="sm" onClick={onCancelEdit} disabled={isSaving}>
                  {t('key212', '취소')}
                </Button>
                <Button size="sm" onClick={onSaveEdit} disabled={isSaving}>
                  {isSaving ? (
                    <span className="flex items-center gap-2">
                      <Spinner className="h-4 w-4" />
                      {t('key582', '저장 중...')}
                    </span>
                  ) : (
                    '저장'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminProductInquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { t } = useTranslation()
  const resolvedParams = use(params)
  const inquiryId = resolvedParams.id

  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { getProductInquiryById, createProductInquiryAnswer, updateProductInquiryAnswer } = useProductInquiry()

  const inquiryQuery = useQuery({
    queryKey: ['product-inquiry', inquiryId],
    queryFn: async () => {
      const res = await getProductInquiryById(inquiryId)
      return (res?.data ?? res) as ProductInquiryByIdResponse
    },
    enabled: Boolean(inquiryId),
    refetchOnWindowFocus: false,
  })

  const inquiry = inquiryQuery.data
  const status = getInquiryStatus(inquiry)

  const answers = useMemo(
    () => (inquiry?.productInquiryAnswers ?? []).slice().sort((a, b) => {
      const at = new Date(a.createdAt as any).getTime()
      const bt = new Date(b.createdAt as any).getTime()
      return bt - at
    }),
    [inquiry?.productInquiryAnswers],
  )

  const [answerText, setAnswerText] = useState('')
  const [editingAnswerId, setEditingAnswerId] = useState<string | null>(null)
  const [editingAnswerText, setEditingAnswerText] = useState('')
  const [imageLoading, setImageLoading] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [avatarLoaded, setAvatarLoaded] = useState(false)

  // Reset image loading state when product image changes
  useEffect(() => {
    if (inquiry?.product?.imageRegistrationThumbnail) {
      setImageLoading(true)
      setImageLoaded(false)
    }
  }, [inquiry?.product?.imageRegistrationThumbnail])

  // Reset avatar loading state when user avatar changes
  useEffect(() => {
    if (inquiry?.user?.avatarUrl) {
      setAvatarLoading(true)
      setAvatarLoaded(false)
    }
  }, [inquiry?.user?.avatarUrl])

  const handleImageLoad = () => {
    setImageLoading(false)
    setImageLoaded(true)
  }

  const handleImageError = () => {
    setImageLoading(false)
    setImageLoaded(true)
  }

  const handleAvatarLoad = () => {
    setAvatarLoading(false)
    setAvatarLoaded(true)
  }

  const handleAvatarError = () => {
    setAvatarLoading(false)
    setAvatarLoaded(true)
  }

  const createAnswerMutation = useMutation({
    mutationFn: async () => {
      if (!answerText.trim()) throw new Error('EMPTY_ANSWER')
      return await createProductInquiryAnswer(inquiryId, { answer: answerText.trim() })
    },
    onSuccess: async () => {
      toast({
        title: '저장 완료',
        description: t('key674', '답변이 등록되었습니다.'),
      })
      setAnswerText('')
      await queryClient.invalidateQueries({ queryKey: ['product-inquiry', inquiryId] })
      await queryClient.invalidateQueries({ queryKey: ['product-inquiries'] })
      await queryClient.invalidateQueries({ queryKey: ['product-inquiries-dashboard'] })
    },
    onError: (err) => {
      if (err instanceof Error && err.message === 'EMPTY_ANSWER') {
        toast({
          variant: 'destructive',
          title: t('key675', '답변 내용을 입력해주세요.'),
        })
        return
      }
      toast({
        variant: 'destructive',
        title: t('key571', '저장 실패'),
        description: t('key354', '잠시 후 다시 시도해주세요.'),
      })
    },
  })

  const updateAnswerMutation = useMutation({
    mutationFn: async (vars: { answerId: string; answer: string }) => {
      if (!vars.answer.trim()) throw new Error('EMPTY_ANSWER')
      return await updateProductInquiryAnswer(inquiryId, vars.answerId, vars.answer.trim())
    },
    onSuccess: async () => {
      toast({
        title: '저장 완료',
        description: t('key676', '답변이 수정되었습니다.'),
      })
      setEditingAnswerId(null)
      setEditingAnswerText('')
      await queryClient.invalidateQueries({ queryKey: ['product-inquiry', inquiryId] })
      await queryClient.invalidateQueries({ queryKey: ['product-inquiries'] })
      await queryClient.invalidateQueries({ queryKey: ['product-inquiries-dashboard'] })
    },
    onError: (err) => {
      if (err instanceof Error && err.message === 'EMPTY_ANSWER') {
        toast({
          variant: 'destructive',
          title: t('key675', '답변 내용을 입력해주세요.'),
        })
        return
      }
      toast({
        variant: 'destructive',
        title: t('key571', '저장 실패'),
        description: t('key354', '잠시 후 다시 시도해주세요.'),
      })
    },
  })

  const createdAt = inquiry?.createdAt ? new Date(inquiry.createdAt as any) : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/product-inquiries"
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm"
            ><Trans i18nKey="spanAriahiddenspan"><span aria-hidden>←</span>
              목록으로</Trans></Link>
          </div>
          <h1 className="mt-2 text-xl font-semibold text-foreground">{t('key677', '상품문의 상세')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('key678', '고객 문의와 답변을 확인/등록합니다.')}</p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
              status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-primary text-primary-foreground'
            }`}
          >
            {status === 'completed' ? '답변완료' : '답변대기'}
          </span>
        </div>
      </section>

      {/* Loading / Error */}
      {inquiryQuery.isLoading ? (
        <section className="bg-card border-border rounded-lg border p-8">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Spinner className="h-4 w-4" />
            <span>{t('key74', '로딩 중...')}</span>
          </div>
        </section>
      ) : inquiryQuery.isError || !inquiry ? (
        <section className="bg-card border-border rounded-lg border p-8">
          <p className="text-center text-sm text-red-500">{t('key679', '상품문의를 불러오지 못했습니다.')}</p>
          <div className="mt-4 flex justify-center">
            <Button variant="outline" onClick={() => router.back()}>
              {t('key680', '돌아가기')}
            </Button>
          </div>
        </section>
      ) : (
        <>
          {/* Inquiry Card */}
          <section className="bg-card border-border rounded-lg border p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-4">
                {inquiry.product?.imageRegistrationThumbnail ? (
                  <div className="relative h-14 w-14 rounded-md border border-border overflow-hidden bg-muted">
                    {imageLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
                        <Spinner className="h-4 w-4 text-[#FF5833]" />
                      </div>
                    )}
                    <img
                      src={inquiry.product.imageRegistrationThumbnail}
                      alt={inquiry.product.productName ?? 'Product'}
                      className={`h-full w-full object-cover transition-opacity duration-300 ${
                        imageLoaded ? 'opacity-100' : 'opacity-0'
                      }`}
                      onLoad={handleImageLoad}
                      onError={handleImageError}
                    />
                  </div>
                ) : (
                  <div className="bg-muted flex h-14 w-14 items-center justify-center rounded-md border border-border text-xs text-muted-foreground">
                    {t('noImage', 'No Image')}
                  </div>
                )}

                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-foreground">
                      {inquiry.product?.productName ?? inquiry.productId}
                    </p>
                    {inquiry.product?.salePrice != null && (
                      <span className="text-muted-foreground text-sm">
                        {(Number(inquiry.product.salePrice) || 0).toLocaleString('en-US')}원
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {inquiry.user?.avatarUrl ? (
                      <div className="relative h-8 w-8 rounded-full border border-border overflow-hidden bg-muted shrink-0">
                        {avatarLoading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
                            <Spinner className="h-3 w-3 text-[#FF5833]" />
                          </div>
                        )}
                        <img
                          src={inquiry.user.avatarUrl}
                          alt={inquiry.user.name ?? 'User'}
                          className={`h-full w-full object-cover transition-opacity duration-300 ${
                            avatarLoaded ? 'opacity-100' : 'opacity-0'
                          }`}
                          onLoad={handleAvatarLoad}
                          onError={handleAvatarError}
                        />
                      </div>
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-muted border border-border flex items-center justify-center text-xs text-muted-foreground shrink-0">
                        {(inquiry.user?.name ?? inquiry.authorId)?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                    <p className="text-muted-foreground text-sm">
                      {inquiry.user?.name ?? inquiry.authorId}
                      {inquiry.user?.email ? t('email', '· {{email}}', { email: inquiry.user.email }) : ''}
                      {createdAt ? t('val3', '· {{val}}', { val: format(createdAt, 'yyyy-MM-dd HH:mm') }) : ''}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <p className="text-foreground font-semibold">{t('qTitle', 'Q. {{title}}', { title: inquiry.title })}</p>
                <p className="mt-2 text-sm text-foreground">{inquiry.content}</p>
              </div>

              {answers.length > 0 ? (
                answers.map((a) => {
                  const answeredAt = a.createdAt ? new Date(a.createdAt as any) : null
                  const isEditing = editingAnswerId === a.id
                  return (
                    <AnswerItem
                      key={a.id}
                      answer={a}
                      answeredAt={answeredAt}
                      isEditing={isEditing}
                      editValue={isEditing ? editingAnswerText : ''}
                      isSaving={updateAnswerMutation.isPending && isEditing}
                      onStartEdit={() => {
                        setEditingAnswerId(a.id)
                        setEditingAnswerText(a.answer ?? '')
                      }}
                      onChangeEditValue={setEditingAnswerText}
                      onCancelEdit={() => {
                        setEditingAnswerId(null)
                        setEditingAnswerText('')
                      }}
                      onSaveEdit={() => {
                        updateAnswerMutation.mutate({ answerId: a.id, answer: editingAnswerText })
                      }}
                    />
                  )
                })
              ) : (
                <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                  {t('key681', '등록된 답변이 없습니다.')}
                </div>
              )}
            </div>
          </section>

          {/* Answer Form */}
          <section className="bg-card border-border rounded-lg border p-6">
            <h2 className="text-base font-semibold text-foreground">{t('key682', '답변 내용')}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('key683', '답변을 작성한 뒤 저장을 눌러주세요.')}</p>

            <div className="mt-4 space-y-4">
              <Textarea
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder={t('key673', '답변 내용을 입력하세요')}
                className="min-h-28"
              />

              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" onClick={() => router.back()}>
                  {t('key212', '취소')}
                </Button>
                <Button
                  onClick={() => createAnswerMutation.mutate()}
                  disabled={createAnswerMutation.isPending}
                >
                  {createAnswerMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <Spinner className="h-4 w-4" />
                      {t('key582', '저장 중...')}
                    </span>
                  ) : (
                    '저장'
                  )}
                </Button>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  )
}


