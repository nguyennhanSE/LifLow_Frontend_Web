/* eslint-disable @next/next/no-img-element */
'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/hooks/use-toast'
import { usePolicy } from '@/hooks/use-policy/policy.hook'
import type { PolicyEntity } from '@/entities/policy/policy.entity'
import { useTranslation } from 'react-i18next'

export default function PoliciesPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { getActivePolicy, createPolicy } = usePolicy()

  const [paymentInformation, setPaymentInformation] = useState('')
  const [deliveryInformation, setDeliveryInformation] = useState('')
  const [exchangeInformation, setExchangeInformation] = useState('')

  const activePolicyQuery = useQuery({
    queryKey: ['policy-active'],
    queryFn: async () => await getActivePolicy(),
    refetchOnWindowFocus: false,
    retry: 1,
  })

  useEffect(() => {
    const p = activePolicyQuery.data
    if (!p) return
    setPaymentInformation(p.paymentInformation ?? '')
    setDeliveryInformation(p.deliveryInformation ?? '')
    setExchangeInformation(p.exchangeInformation ?? '')
  }, [activePolicyQuery.data])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        id: activePolicyQuery.data?.id ?? 'temp',
        status: 'active',
        paymentInformation,
        deliveryInformation,
        exchangeInformation,
      } satisfies PolicyEntity
      return await createPolicy(payload)
    },
    onSuccess: async () => {
      toast({ title: '저장 완료', description: t('key570', '정책 정보가 저장되었습니다.') })
      await queryClient.invalidateQueries({ queryKey: ['policy-active'] })
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: t('key571', '저장 실패'),
        description: t('key354', '잠시 후 다시 시도해주세요.'),
      })
    },
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <section>
        <h1 className="text-xl font-semibold text-foreground">{t('key572', '정책 관리')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('key573', '상품 상세 페이지에 표시되는 정책 정보를 관리합니다')}
        </p>
      </section>

      {/* Policy Cards */}
      <section className="space-y-4">
        <Card>
          <CardHeader className="">
            <CardTitle className="text-sm font-semibold">{t('key574', '상품 결제 정보')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="policy-payment">{t('key575', '결제 정보')}</Label>
            <Textarea
              id="policy-payment"
              placeholder={t('key576', '상품 결제 정보를 입력하세요')}
              className="min-h-32"
              value={paymentInformation}
              onChange={(e) => setPaymentInformation(e.target.value)}
            />
            <CardDescription>{t('key577', '이 내용은 모든 상품 상세 페이지에 표시됩니다')}</CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="">
            <CardTitle className="text-sm font-semibold">{t('key98', '배송 안내')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="policy-shipping">{t('key98', '배송 안내')}</Label>
            <Textarea
              id="policy-shipping"
              placeholder={t('key578', '배송 안내를 입력하세요')}
              className="min-h-48"
              value={deliveryInformation}
              onChange={(e) => setDeliveryInformation(e.target.value)}
            />
            <CardDescription>
              {t('key579', '배송 방법, 비용, 기간 등을 상세히 작성해주세요')}
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="">
            <CardTitle className="text-sm font-semibold">{t('key102', '교환/반품 안내')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="policy-return">{t('key102', '교환/반품 안내')}</Label>
            <Textarea
              id="policy-return"
              placeholder={t('key580', '교환/반품 안내를 입력하세요')}
              className="min-h-80"
              value={exchangeInformation}
              onChange={(e) => setExchangeInformation(e.target.value)}
            />
            <CardDescription>
              {t('key581', '교환/반품이 가능한 경우와 불가능한 경우를 명확히 작성해주세요')}
            </CardDescription>
          </CardContent>
        </Card>
      </section>

      {/* Actions */}
      <section className="flex justify-end">
        <Button
          size="lg"
          className="bg-black text-white hover:bg-black/90"
          disabled={saveMutation.isPending || activePolicyQuery.isLoading}
          onClick={() => saveMutation.mutate()}
        >
          {saveMutation.isPending ? (
            <span className="flex items-center gap-2">
              <Spinner className="h-4 w-4" />
              {t('key582', '저장 중...')}
            </span>
          ) : activePolicyQuery.isLoading ? (
            <span className="flex items-center gap-2">
              <Spinner className="h-4 w-4" />
              {t('key583', '불러오는 중...')}
            </span>
          ) : (
            '저장하기'
          )}
        </Button>
      </section>
    </div>
  )
}