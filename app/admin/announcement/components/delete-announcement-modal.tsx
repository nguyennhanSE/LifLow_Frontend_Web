'use client'

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

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
  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>공지사항 삭제</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-foreground">
            정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </p>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            취소
          </Button>
          <Button
            type="button"
            className="bg-orange-500 hover:bg-orange-600"
            onClick={handleConfirm}
          >
            삭제
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

