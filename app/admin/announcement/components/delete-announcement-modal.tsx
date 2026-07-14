'use client'

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'

interface DeleteAnnouncementModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function DeleteAnnouncementModal({
  open,
  onOpenChange,
  onConfirm,
}: DeleteAnnouncementModalProps) {
  const { t } = useTranslation()
  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('key786', '공지사항 삭제')}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-foreground">
            {t('key787', '정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')}
          </p>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t('key212', '취소')}
          </Button>
          <Button
            type="button"
            className="bg-orange-500 hover:bg-orange-600"
            onClick={handleConfirm}
          >
            {t('key741', '삭제')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

