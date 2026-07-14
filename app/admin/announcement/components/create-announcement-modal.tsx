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
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { useAnnouncement } from '@/hooks/use-announcement/announcement.hook'
import { EAnnouncementType } from '@/entities/announcements/announcements.entity'
import { CreateAnnouncementDto } from '@/hooks/use-announcement/announcement.dto'

interface CreateAnnouncementModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: EAnnouncementType
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

export function CreateAnnouncementModal({
  open,
  onOpenChange,
  type,
  onSuccess,
}: CreateAnnouncementModalProps) {
  const { createAnnouncement } = useAnnouncement()

  const form = useForm<CreateAnnouncementDto>({
    defaultValues: {
      title: '',
      authorName: '',
      content: '',
      type: type,
      isFixed: false,
      status: 'active',
    },
    mode: 'onChange',
  })

  // Reset form when type prop changes or modal opens
  useEffect(() => {
    if (open) {
      form.reset({
        title: '',
        authorName: '',
        content: '',
        type: type, // Always use the current type prop
        isFixed: false,
        status: 'active',
      })
    }
  }, [type, open, form])

  const onSubmit = async (data: CreateAnnouncementDto) => {
    console.log('data', data)
    try {
      await createAnnouncement(
        {
          title: data.title,
          authorName: data.authorName,
          type: type, // Always use the type prop, not data.type
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
      console.error('Failed to create announcement:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>공지사항 작성 - {getTypeLabel(type)}</DialogTitle>
          <DialogDescription>새로운 공지사항을 작성하세요.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              rules={{ required: '제목을 입력해주세요' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>제목 *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="공지사항 제목을 입력하세요"
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
                  <FormLabel>작성자 *</FormLabel>
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
                  <FormLabel>내용 *</FormLabel>
                  <FormControl>
                    <RichTextEditor
                      content={field.value || ''}
                      onChange={field.onChange}
                      placeholder="공지사항 내용을 입력하세요 (텍스트와 이미지 모두 추가 가능합니다)"
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
                    <FormLabel>상단 고정</FormLabel>
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
                취소
              </Button>
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                작성
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

