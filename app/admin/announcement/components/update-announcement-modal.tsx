'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Checkbox } from '@/components/ui/checkbox'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { useAnnouncement } from '@/hooks/use-announcement/announcement.hook'
import { EAnnouncementType } from '@/entities/announcements/announcements.entity'
import { UpdateAnnouncementDto } from '@/hooks/use-announcement/announcement.dto'
import { AnnouncementEntity } from '@/entities/announcements/announcements.entity'
import { useTranslation } from 'react-i18next'

interface UpdateAnnouncementModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  announcement: AnnouncementEntity | null
  onSuccess?: () => void
}

const getTypeLabel = (type: EAnnouncementType): string => {
  switch (type) {
    case EAnnouncementType.GENERAL:
      return '일반 공지사항'
    case EAnnouncementType.RECIPE:
      return '레시피 공지사항'
    case EAnnouncementType.USER:
      return '이용가이드'
    default:
      return '공지사항'
  }
}

export function UpdateAnnouncementModal({
  open,
  onOpenChange,
  announcement,
  onSuccess,
}: UpdateAnnouncementModalProps) {
  const { t } = useTranslation()
  const { updateAnnouncementById } = useAnnouncement()

  const form = useForm<UpdateAnnouncementDto>({
    defaultValues: {
      title: '',
      authorName: '',
      content: '',
      type: EAnnouncementType.GENERAL,
      isFixed: false,
      status: 'active',
    },
    mode: 'onChange',
  })

  useEffect(() => {
    if (announcement && open) {
      form.reset({
        title: announcement.title || '',
        authorName: announcement.author?.name || '',
        content: announcement.content || '',
        type: announcement.type,
        isFixed: announcement.isFixed || false,
        status: announcement.status || 'active',
      })
    }
  }, [announcement, open, form])

  const onSubmit = async (data: UpdateAnnouncementDto) => {
    if (!announcement) return

    try {
      await updateAnnouncementById(
        announcement.id,
        {
          title: data.title,
          authorName: data.authorName,
          type: data.type || announcement.type,
          content: data.content, // Now contains HTML with embedded images
          isFixed: Boolean(data.isFixed),
          status: data.status,
        }
        // No separate image file - images are embedded in HTML content
      )

      // Reset form
      form.reset()
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('Failed to update announcement:', error)
    }
  }

  if (!announcement) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t('key779', '공지사항 수정 -')} {getTypeLabel(announcement.type)}
          </DialogTitle>
          <DialogDescription>{t('key780', '공지사항을 수정하세요.')}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              rules={{ required: '제목을 입력해주세요' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('key726', '제목 *')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('key781', '공지사항 제목을 입력하세요')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="authorName"
              rules={{ required: '작성자를 입력해주세요' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('key782', '작성자 *')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              rules={{ required: '내용을 입력해주세요' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('key783', '내용 *')}</FormLabel>
                  <FormControl>
                    <RichTextEditor
                      content={field.value || ''}
                      onChange={field.onChange}
                      placeholder={t('key784', '공지사항 내용을 입력하세요 (텍스트와 이미지 모두 추가 가능합니다)')}
                      className="min-h-[300px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isFixed"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value || false}
                      onCheckedChange={(checked) => {
                        field.onChange(checked === true)
                      }}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>{t('key785', '상단 고정')}</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t('key212', '취소')}
              </Button>
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                {t('key288', '수정')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

