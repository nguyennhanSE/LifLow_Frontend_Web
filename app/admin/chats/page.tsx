'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, RefreshCcw } from 'lucide-react'

import { PaginationButton } from '@/components/common/PaginationButton'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { User } from '@/entities/user.entity'
import { ERoleName } from '@/entities/roles/role.enum'
import type { RoomEntity } from '@/hooks/use-chat/chat.dto'
import { useChat } from '@/hooks/use-chat/chat.hook'
import type { GetUsersQueryDto } from '@/hooks/use-user/user.dto'
import { useUser } from '@/hooks/use-user/user.hook'
import { toast } from '@/hooks/use-toast'

function normalizeRooms(input: any): RoomEntity[] {
  if (Array.isArray(input)) return input as RoomEntity[]
  if (input && typeof input === 'object') {
    if (Array.isArray(input.docs)) return input.docs as RoomEntity[]
    if (Array.isArray(input.items)) return input.items as RoomEntity[]
    if (Array.isArray(input.data)) return input.data as RoomEntity[]
  }
  return []
}

export default function AdminChatsPage() {
  const { getUsers } = useUser()
  const { getRooms, createRoom } = useChat()
  const queryClient = useQueryClient()

  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [keyword, setKeyword] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(keyword.trim()), 400)
    return () => clearTimeout(timer)
  }, [keyword])

  useEffect(() => {
    setPage(1)
  }, [debouncedQuery])

  const usersQuery = useQuery({
    queryKey: ['admin-chats-users', page, limit, debouncedQuery],
    queryFn: async () => {
      const params: GetUsersQueryDto = {
        page,
        limit,
        role: ERoleName.USER,
      }
      if (debouncedQuery) params.q = debouncedQuery
      return getUsers(params)
    },
    retry: 1,
    refetchOnWindowFocus: false,
  })

  const users = usersQuery.data?.data ?? []
  const total = usersQuery.data?.total ?? 0
  const totalPages = usersQuery.data?.pagination?.totalPages ?? 1

  const roomQueries = useQueries({
    queries: users.map((user: User) => ({
      queryKey: ['admin-chats-user-rooms', user.id],
      queryFn: async () =>
        normalizeRooms(
          await getRooms(
            {
              limit: 100,
              sortBy: 'lastMessageAt',
              sortOrder: 'desc',
            },
            user.id,
          ),
        ),
      enabled: Boolean(user.id),
      retry: 1,
      refetchOnWindowFocus: false,
    })),
  })

  const createRoomMutation = useMutation({
    mutationFn: async (_userId: string) => createRoom(),
    onSuccess: async (_room, userId) => {
      const queryKey = ['admin-chats-user-rooms', userId]

      await queryClient.invalidateQueries({ queryKey })
      await queryClient.refetchQueries({ queryKey, type: 'active' })

      toast({
        title: '채팅방 생성 완료',
        description: `${userId} 회원의 채팅방을 생성했습니다.`,
      })
    },
    onError: (error) => {
      toast({
        title: '채팅방 생성 실패',
        description: error instanceof Error ? error.message : '잠시 후 다시 시도해주세요.',
        variant: 'destructive',
      })
    },
  })

  const totalRoomsOnPage = useMemo(
    () =>
      roomQueries.reduce((sum, roomQuery) => {
        return sum + (roomQuery.data?.length ?? 0)
      }, 0),
    [roomQueries],
  )

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">앱 채팅 관리</h2>
          <p className="text-sm text-muted-foreground">
            USER 권한 회원 {total.toLocaleString()}명 · 현재 페이지 채팅방 {totalRoomsOnPage.toLocaleString()}개
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            usersQuery.refetch()
            roomQueries.forEach((roomQuery) => roomQuery.refetch())
          }}
          disabled={usersQuery.isFetching || roomQueries.some((roomQuery) => roomQuery.isFetching)}
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          새로고침
        </Button>
      </section>

      <Card>
        <CardContent>
          <Input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="이름, 아이디, 이메일, 전화번호로 검색"
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="min-w-[980px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16 text-center">번호</TableHead>
                  <TableHead className="w-36 text-center">ID</TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>이메일</TableHead>
                  <TableHead>연락처</TableHead>
                  <TableHead>채팅방</TableHead>
                  <TableHead className="w-32 text-center">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersQuery.isError ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-red-500">
                      오류가 발생했습니다:{' '}
                      {usersQuery.error instanceof Error ? usersQuery.error.message : '알 수 없는 오류'}
                    </TableCell>
                  </TableRow>
                ) : usersQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      로딩 중...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      데이터가 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user, index) => {
                    const roomQuery = roomQueries[index]
                    const rooms = roomQuery?.data ?? []
                    const isCreating =
                      createRoomMutation.isPending && createRoomMutation.variables === user.id

                    return (
                      <TableRow key={user.id}>
                        <TableCell className="text-center">{(page - 1) * limit + index + 1}</TableCell>
                        <TableCell className="text-center font-medium">{user.id}</TableCell>
                        <TableCell>{user.name || '-'}</TableCell>
                        <TableCell>{user.email || '-'}</TableCell>
                        <TableCell>{user.phoneNumber || '-'}</TableCell>
                        <TableCell>
                          {roomQuery?.isLoading ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Spinner className="h-4 w-4" />
                              채팅방 조회 중
                            </div>
                          ) : roomQuery?.isError ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-red-500">조회 실패</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => roomQuery.refetch()}
                              >
                                다시 시도
                              </Button>
                            </div>
                          ) : rooms.length === 0 ? (
                            <span className="text-sm text-muted-foreground">0개</span>
                          ) : (
                            <span className="font-medium">{rooms.length.toLocaleString()}개</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => createRoomMutation.mutate(user.id)}
                            disabled={isCreating}
                          >
                            {isCreating ? (
                              <Spinner className="mr-2 h-4 w-4" />
                            ) : (
                              <Plus className="mr-2 h-4 w-4" />
                            )}
                            생성
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {total > 0 && (
        <PaginationButton
          page={page}
          limit={limit}
          total={total}
          totalPages={totalPages}
          onPageChange={setPage}
          className="py-4"
        />
      )}
    </div>
  )
}
