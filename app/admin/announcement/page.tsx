'use client'

import { useEffect, useMemo, useState } from 'react'
import { Eye, Pencil, Pin, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PaginationButton } from '@/components/common/PaginationButton'
import { useAnnouncement } from '@/hooks/use-announcement/announcement.hook'
import { AnnouncementPagination } from '@/hooks/use-announcement/announcement.dto'
import { EAnnouncementType } from '@/entities/announcements/announcements.entity'
import { AnnouncementEntity } from '@/entities/announcements/announcements.entity'
import { CreateAnnouncementModal } from './components/create-announcement-modal'
import { UpdateAnnouncementModal } from './components/update-announcement-modal'
import { DeleteAnnouncementModal } from './components/delete-announcement-modal'

export default function AnnouncementManagementPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'recipe' | 'guide'>('general')
  const [currentPage, setCurrentPage] = useState(1)
  const limit = 10
  const [announcements, setAnnouncements] = useState<AnnouncementEntity[]>([])
  const [pagination, setPagination] = useState<AnnouncementPagination | null>(null)
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementEntity | null>(null)
  const { getAnnouncements, deleteAnnouncementById } = useAnnouncement()

  const getTypeFromTab = (tab: 'general' | 'recipe' | 'guide'): EAnnouncementType => {
    switch (tab) {
      case 'general':
        return EAnnouncementType.GENERAL
      case 'recipe':
        return EAnnouncementType.RECIPE
      case 'guide':
        return EAnnouncementType.USER
      default:
        return EAnnouncementType.GENERAL
    }
  }

  const fetchAnnouncements = async () => {
    setLoading(true)
    try {
      const type = getTypeFromTab(activeTab)
      const result = await getAnnouncements({ type, page: currentPage, limit })
      setAnnouncements((result.data ?? []) as AnnouncementEntity[])
      setPagination(result.pagination)
    } catch (error) {
      console.error('Failed to fetch announcements:', error)
      setAnnouncements([])
      setPagination(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnnouncements()
  }, [activeTab, currentPage])

  const activeTabLabel = useMemo(() => {
    switch (activeTab) {
      case 'general':
        return '일반 공지사항'
      case 'recipe':
        return '레시피 공지사항'
      case 'guide':
        return '이용가이드'
      default:
        return '공지사항'
    }
  }, [activeTab])

  const handleEdit = (announcement: AnnouncementEntity) => {
    setSelectedAnnouncement(announcement)
    setIsUpdateModalOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedAnnouncement) return
    
    try {
      await deleteAnnouncementById(selectedAnnouncement.id)
      setSelectedAnnouncement(null)
      fetchAnnouncements()
    } catch (error) {
      console.error('Failed to delete announcement:', error)
    }
  }

  const handleDeleteClick = (announcement: AnnouncementEntity) => {
    setSelectedAnnouncement(announcement)
    setIsDeleteModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <section>
        <h1 className="text-xl font-semibold text-foreground">공지사항 관리</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          공지사항을 탭별로 작성하고 관리할 수 있습니다.
        </p>
      </section>

      {/* Tabs + Action */}
      <section className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={activeTab === 'general' ? 'secondary' : 'outline'}
            onClick={() => { setActiveTab('general'); setCurrentPage(1) }}
          >
            일반 공지사항
          </Button>
          <Button
            type="button"
            variant={activeTab === 'recipe' ? 'secondary' : 'outline'}
            onClick={() => { setActiveTab('recipe'); setCurrentPage(1) }}
          >
            레시피 공지사항
          </Button>
          <Button
            type="button"
            variant={activeTab === 'guide' ? 'secondary' : 'outline'}
            onClick={() => { setActiveTab('guide'); setCurrentPage(1) }}
          >
            이용가이드
          </Button>
        </div>

        <Button
          type="button"
          className="w-full md:w-auto"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="h-4 w-4" />
          공지사항 작성
        </Button>
      </section>

      {/* Table */}
      <section className="bg-card border-border rounded-lg border">
        <div className="border-border flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-base font-semibold text-foreground">{activeTabLabel}</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr className="text-xs font-medium text-muted-foreground">
                <th className="p-4 text-left">ID</th>
                <th className="p-4 text-left">고정</th>
                <th className="p-4 text-left">제목</th>
                <th className="p-4 text-left">작성자</th>
                <th className="p-4 text-left">작성일</th>
                <th className="p-4 text-left">조회수</th>
                <th className="p-4 text-center">관리</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-muted-foreground">
                    로딩 중...
                  </td>
                </tr>
              ) : announcements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-muted-foreground">
                    공지사항이 없습니다.
                  </td>
                </tr>
              ) : (
                announcements.map((announcement, index) => {
                  const formattedDate = announcement.createdAt
                    ? new Date(announcement.createdAt).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                      })
                    : '-'
                  const authorName = announcement.author?.name || '알 수 없음'
                  
                  return (
                    <tr
                      key={announcement.id}
                      className="border-border border-t transition-colors hover:bg-muted/20"
                    >
                      <td className="p-4 text-foreground">{index + 1}</td>
                      <td className="p-4">
                        {announcement.isFixed ? (
                            <div className="flex items-center justify-center p-2 bg-orange-500 rounded-md w-fit">
                                <Pin className="h-3 w-3 text-white" />
                            </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-4 font-medium text-foreground">{announcement.title}</td>
                      <td className="p-4 text-muted-foreground">{authorName}</td>
                      <td className="p-4 text-foreground">{formattedDate}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Eye className="h-4 w-4" />
                          {announcement.views}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-9 w-9"
                            onClick={() => handleEdit(announcement)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-9 w-9 text-destructive"
                            onClick={() => handleDeleteClick(announcement)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="border-border flex items-center justify-between border-t px-6 py-4">
          <p className="text-sm text-muted-foreground">
            전체 {pagination?.total ?? announcements.length}개의 공지
          </p>
          {pagination && (
            <PaginationButton
              page={pagination.page}
              limit={pagination.limit}
              total={pagination.total}
              totalPages={pagination.totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      </section>

      <CreateAnnouncementModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        type={getTypeFromTab(activeTab)}
        onSuccess={fetchAnnouncements}
      />

      <UpdateAnnouncementModal
        open={isUpdateModalOpen}
        onOpenChange={setIsUpdateModalOpen}
        announcement={selectedAnnouncement}
        onSuccess={fetchAnnouncements}
      />

      <DeleteAnnouncementModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={handleDelete}
      />
    </div>
  )
}
