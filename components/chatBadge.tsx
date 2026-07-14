'use client'

import { FormEvent, UIEvent, WheelEvent, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { ArrowLeft, MessageCircle, RefreshCcw, Search, Send } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Spinner } from '@/components/ui/spinner'
import type { MessageEntity, RoomEntity } from '@/hooks/use-chat/chat.dto'
import { useChat } from '@/hooks/use-chat/chat.hook'
import { useChatSocket } from '@/hooks/use-chat/chatSocket.hook'

const ROOM_PAGE_LIMIT = 10
const MESSAGE_PAGE_LIMIT = 10

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null
  return null
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
  return atob(padded)
}

function getUserIdFromToken(token: string): string | null {
  try {
    const payload = JSON.parse(decodeBase64Url(token.split('.')[1] ?? ''))
    return payload?.sub || payload?.id || payload?.userId || null
  } catch {
    return null
  }
}

function normalizeRooms(input: any): RoomEntity[] {
  if (Array.isArray(input)) return input as RoomEntity[]
  if (input && typeof input === 'object') {
    if (Array.isArray(input.docs)) return input.docs as RoomEntity[]
    if (Array.isArray(input.items)) return input.items as RoomEntity[]
    if (Array.isArray(input.data)) return input.data as RoomEntity[]
  }
  return []
}

function normalizeRoomsPage(input: any, page: number) {
  const rooms = normalizeRooms(input)
  const totalPages = Number(input?.totalPages ?? input?.meta?.totalPages ?? input?.pagination?.totalPages)
  const currentPage = Number(input?.currentPage ?? input?.page ?? input?.meta?.page ?? input?.pagination?.page ?? page)

  return {
    rooms,
    page: currentPage,
    nextPage:
      Number.isFinite(totalPages) && totalPages > 0
        ? currentPage < totalPages
          ? currentPage + 1
          : undefined
        : rooms.length >= ROOM_PAGE_LIMIT
          ? page + 1
          : undefined,
  }
}

function formatDate(value?: Date | string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
  })
}

function getInitial(value: string) {
  return value.trim().charAt(0).toUpperCase() || 'C'
}

function getLatestMessage(messages?: MessageEntity[] | null) {
  if (!messages || messages.length === 0) return null
  return [...messages].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })[0]
}

function sortMessagesOldestFirst(messages: MessageEntity[]) {
  return [...messages].sort((a, b) => {
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  })
}

function canScrollInDirection(element: HTMLElement, deltaY: number) {
  if (element.scrollHeight <= element.clientHeight) return false
  if (deltaY < 0) return element.scrollTop > 0
  if (deltaY > 0) return element.scrollTop + element.clientHeight < element.scrollHeight - 1
  return false
}

function getRoomTitle(room: RoomEntity, userId: string) {
  const partner = getRoomPartner(room, userId)
  return partner?.name || partner?.email || partner?.id || `채팅방 ${room.id.slice(0, 8)}`
}

function getRoomPartner(room: RoomEntity, userId: string) {
  return room.user1Id === userId ? room.user2 : room.user1
}

function getUserOnlineFromRoom(user: any) {
  if (typeof user?.isOnline === 'boolean') return user.isOnline
  if (typeof user?.online === 'boolean') return user.online
  if (typeof user?.status === 'string') return user.status.toLowerCase() === 'online'
  return undefined
}

function getRoomPartnerOnline(room: RoomEntity, userId: string, onlineUsers: Record<string, boolean>) {
  const partner = getRoomPartner(room, userId)
  const partnerId = partner?.id
  if (partnerId && Object.prototype.hasOwnProperty.call(onlineUsers, partnerId)) {
    return onlineUsers[partnerId] === true
  }

  return getUserOnlineFromRoom(partner) === true
}

export function ChatBadge() {
  const router = useRouter()
  const { getRooms } = useChat()
  const [open, setOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [hasToken, setHasToken] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [draftMessage, setDraftMessage] = useState('')
  const [hasMoreMessages, setHasMoreMessages] = useState(false)
  const [isFetchingMessages, setIsFetchingMessages] = useState(false)
  const messagesScrollRef = useRef<HTMLDivElement | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const previousMessagesScrollHeightRef = useRef<number | null>(null)
  const isFetchingMessagesRef = useRef(false)

  useEffect(() => {
    const token = getCookie('access_token')
    setHasToken(Boolean(token))
    setUserId(token ? getUserIdFromToken(token) : null)
  }, [])

  const roomsQuery = useInfiniteQuery({
    queryKey: ['chat-badge-rooms', userId],
    queryFn: async ({ pageParam }) =>
      normalizeRoomsPage(
        await getRooms(
          {
            page: pageParam as number,
            limit: ROOM_PAGE_LIMIT,
            sortBy: 'lastMessageAt',
            sortOrder: 'desc',
          },
          userId as string,
        ),
        pageParam as number,
      ),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: Boolean(userId),
    refetchOnWindowFocus: false,
    staleTime: 10_000,
  })

  const refetchRooms = roomsQuery.refetch

  useEffect(() => {
    if (open && userId) {
      refetchRooms()
    }
  }, [open, userId, refetchRooms])

  const rooms = roomsQuery.data?.pages.flatMap((page) => page.rooms) ?? []
  const roomCount = rooms.length
  const {
    status: socketStatus,
    room: joinedRoom,
    messages: socketMessages,
    onlineUsers,
    joinRoom,
    queryMessages,
    sendMessage,
  } = useChatSocket({
    roomId: selectedRoomId,
    enabled: open,
  })
  const filteredRooms = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return rooms

    return rooms.filter((room) => {
      const latestMessage = getLatestMessage(room.messages)
      const text = [
        getRoomTitle(room, userId ?? ''),
        latestMessage?.content,
        room.id,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return text.includes(query)
    })
  }, [rooms, searchQuery, userId])
  const displayRooms = filteredRooms
  const selectedRoomFromList = rooms.find((room) => room.id === selectedRoomId) ?? null
  const selectedRoom = joinedRoom?.id === selectedRoomId ? joinedRoom : selectedRoomFromList
  const selectedMessages = useMemo(
    () => sortMessagesOldestFirst(socketMessages.length > 0 ? socketMessages : selectedRoom?.messages ?? []),
    [selectedRoom?.messages, socketMessages],
  )
  const selectedRoomTitle = selectedRoom ? getRoomTitle(selectedRoom, userId ?? '') : '채팅방'
  const selectedPartnerOnline = selectedRoom ? getRoomPartnerOnline(selectedRoom, userId ?? '', onlineUsers) : false

  useLayoutEffect(() => {
    if (!selectedRoomId) return

    const container = messagesScrollRef.current
    const previousScrollHeight = previousMessagesScrollHeightRef.current
    if (container && previousScrollHeight !== null) {
      previousMessagesScrollHeightRef.current = null
      container.scrollTop = container.scrollHeight - previousScrollHeight
      return
    }

    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [selectedRoomId, selectedMessages.length])

  const handleSelectRoom = async (room: RoomEntity) => {
    setSelectedRoomId(room.id)
    setDraftMessage('')
    setHasMoreMessages(true)
    setIsFetchingMessages(false)
    isFetchingMessagesRef.current = false
    previousMessagesScrollHeightRef.current = null

    const joinedRoom = await joinRoom({ roomId: room.id }).catch(() => undefined)
    const initialMessages = joinedRoom?.messages ?? room.messages ?? []
    setHasMoreMessages(initialMessages.length > 0)
  }

  const handleSendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const message = draftMessage.trim()
    if (!message || !selectedRoomId) return

    setDraftMessage('')
    await sendMessage(message).catch(() => {
      setDraftMessage(message)
    })
  }

  const handleRoomsScroll = (event: UIEvent<HTMLDivElement>) => {
    if (!roomsQuery.hasNextPage || roomsQuery.isFetchingNextPage) return

    const target = event.currentTarget
    const remaining = target.scrollHeight - target.scrollTop - target.clientHeight
    if (remaining < 96) {
      roomsQuery.fetchNextPage()
    }
  }

  const loadOlderMessages = async (container: HTMLElement) => {
    if (!selectedRoomId || socketStatus !== 'joined' || !hasMoreMessages || isFetchingMessagesRef.current) return false

    const oldestMessage = selectedMessages[0]
    if (!oldestMessage?.id || !oldestMessage.createdAt) {
      setHasMoreMessages(false)
      return false
    }

    previousMessagesScrollHeightRef.current = container.scrollHeight
    isFetchingMessagesRef.current = true
    setIsFetchingMessages(true)

    try {
      const page = await queryMessages(selectedRoomId, MESSAGE_PAGE_LIMIT, {
        id: oldestMessage.id,
        createdAt: oldestMessage.createdAt,
      })
      if (page.data.length === 0) {
        previousMessagesScrollHeightRef.current = null
      }
      setHasMoreMessages(page.more.hasMore)
      return true
    } catch {
      previousMessagesScrollHeightRef.current = null
      return false
    } finally {
      isFetchingMessagesRef.current = false
      setIsFetchingMessages(false)
    }
  }

  const handleChatWheel = (event: WheelEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null
    const scrollArea = target?.closest<HTMLElement>('[data-chat-scroll-area]')

    if (scrollArea && event.currentTarget.contains(scrollArea) && canScrollInDirection(scrollArea, event.deltaY)) {
      event.stopPropagation()
      return
    }

    if (scrollArea && event.currentTarget.contains(scrollArea) && event.deltaY < 0 && scrollArea.scrollTop <= 1) {
      event.preventDefault()
      event.stopPropagation()
      void loadOlderMessages(scrollArea)
      return
    }

    event.preventDefault()
    event.stopPropagation()
  }

  const handleMessagesScroll = async (event: UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget
    if (target.scrollTop > 56) return

    await loadOlderMessages(target)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-full text-white hover:bg-white/10 hover:text-white/80"
          aria-label="채팅방"
        >
          <MessageCircle className="h-5 w-5" />
          {roomCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] font-bold text-[#FF5833]">
              {roomCount > 99 ? '99+' : roomCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={10}
        className="w-[min(calc(100vw-24px),380px)] overflow-hidden overscroll-contain rounded-2xl border-0 bg-white p-0 shadow-[0_18px_60px_rgba(15,23,42,0.22)]"
        style={{ zIndex: 100002 }}
        onWheel={handleChatWheel}
      >
        {selectedRoomId ? (
          <div className="flex h-[min(calc(100vh-96px),520px)] max-h-[calc(100vh-96px)] flex-col">
            <div className="flex items-center gap-3 border-b border-slate-100 px-3 py-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full hover:bg-slate-100"
                onClick={() => setSelectedRoomId(null)}
                aria-label="채팅방 목록으로 돌아가기"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-[#0084ff] to-[#7c3aed] text-sm font-bold text-white">
                {getInitial(selectedRoomTitle)}
                <span
                  className={[
                    'absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white',
                    selectedPartnerOnline ? 'bg-emerald-500' : 'bg-slate-300',
                  ].join(' ')}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-950">{selectedRoomTitle}</p>
                <p className="text-xs text-slate-500">
                  {socketStatus === 'connecting'
                    ? 'Connecting...'
                    : selectedPartnerOnline
                      ? 'Active now'
                      : 'Offline'}
                </p>
              </div>
            </div>

            <div
              ref={messagesScrollRef}
              data-chat-scroll-area
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white px-3 py-4"
              onScroll={handleMessagesScroll}
            >
              {socketStatus === 'connecting' && selectedMessages.length === 0 ? (
                <div className="flex h-full items-center justify-center gap-2 text-sm text-slate-500">
                  <Spinner className="h-4 w-4" />
                  채팅방 입장 중
                </div>
              ) : selectedMessages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <MessageCircle className="h-8 w-8" />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-slate-950">아직 메시지가 없습니다</p>
                  <p className="mt-1 text-xs text-slate-500">첫 메시지를 보내 대화를 시작하세요.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {isFetchingMessages && (
                    <div className="flex justify-center py-1">
                      <Spinner className="h-4 w-4 text-slate-400" />
                    </div>
                  )}
                  {selectedMessages.map((message, index) => {
                    const isMine = message.senderId === userId
                    const key = message.id ?? `${message.roomId}-${message.createdAt ?? index}-${index}`

                    return (
                      <div key={key} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={[
                            'max-w-[78%] rounded-2xl px-3 py-2 text-sm leading-relaxed',
                            isMine
                              ? 'rounded-br-md bg-[#0084ff] text-white'
                              : 'rounded-bl-md bg-slate-100 text-slate-900',
                          ].join(' ')}
                        >
                          {message.content}
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="flex items-center gap-2 border-t border-slate-100 px-3 py-3">
              <input
                value={draftMessage}
                onChange={(event) => setDraftMessage(event.target.value)}
                placeholder="Aa"
                className="h-10 min-w-0 flex-1 rounded-full bg-slate-100 px-4 text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
              <Button
                type="submit"
                size="icon"
                className="h-10 w-10 rounded-full bg-[#0084ff] text-white hover:bg-[#0075e6]"
                disabled={!draftMessage.trim() || socketStatus === 'connecting'}
                aria-label="메시지 보내기"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-4 pb-2 pt-4">
              <div>
                <p className="text-xl font-bold tracking-tight text-slate-950">Chats</p>
                <p className="text-xs text-slate-500">전체 {roomCount.toLocaleString()}개</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200"
                onClick={() => roomsQuery.refetch()}
                disabled={!userId || roomsQuery.isFetching}
                aria-label="채팅방 새로고침"
              >
                {roomsQuery.isFetching ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  <RefreshCcw className="h-4 w-4" />
                )}
              </Button>
            </div>

            {hasToken && (
              <div className="px-4 pb-3">
                <div className="flex h-9 items-center gap-2 rounded-full bg-slate-100 px-3 text-sm text-slate-500">
                  <Search className="h-4 w-4" />
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search Messenger"
                    className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-500"
                  />
                </div>
              </div>
            )}

            {!hasToken ? (
              <div className="space-y-4 px-6 py-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FF5833]/10 text-[#FF5833]">
                  <MessageCircle className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-950">로그인이 필요합니다</p>
                  <p className="mt-1 text-xs text-slate-500">로그인 후 채팅방을 확인할 수 있습니다.</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="rounded-full bg-[#FF5833] px-5 hover:bg-[#e94d2c]"
                  onClick={() => {
                    setOpen(false)
                    router.push('/sign-in')
                  }}
                >
                  로그인
                </Button>
              </div>
            ) : roomsQuery.isLoading ? (
              <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-slate-500">
                <Spinner className="h-4 w-4" />
                채팅방 조회 중
              </div>
            ) : roomsQuery.isError ? (
              <div className="space-y-3 px-6 py-8 text-center">
                <p className="text-sm font-semibold text-red-500">채팅방을 불러오지 못했습니다.</p>
                <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => roomsQuery.refetch()}>
                  다시 시도
                </Button>
              </div>
            ) : roomCount === 0 ? (
              <div className="px-6 py-10 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <MessageCircle className="h-7 w-7" />
                </div>
                <p className="mt-4 text-sm font-semibold text-slate-950">채팅방이 없습니다</p>
                <p className="mt-1 text-xs text-slate-500">새로운 상담이 생성되면 여기에 표시됩니다.</p>
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <Search className="h-7 w-7" />
                </div>
                <p className="mt-4 text-sm font-semibold text-slate-950">검색 결과가 없습니다</p>
                <p className="mt-1 text-xs text-slate-500">다른 검색어를 입력해보세요.</p>
              </div>
            ) : (
              <div
                data-chat-scroll-area
                className="max-h-[380px] overflow-y-auto overscroll-contain px-2 pb-2"
                onScroll={handleRoomsScroll}
              >
                {displayRooms.map((room) => {
                  const latestMessage = getLatestMessage(room.messages)
                  const date = formatDate(room.lastMessageAt ?? latestMessage?.createdAt ?? room.createdAt)
                  const title = getRoomTitle(room, userId ?? '')
                  const isPartnerOnline = getRoomPartnerOnline(room, userId ?? '', onlineUsers)

                  return (
                    <button
                      key={room.id}
                      type="button"
                      className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-slate-100"
                      onClick={() => handleSelectRoom(room)}
                    >
                      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-[#0084ff] to-[#7c3aed] text-sm font-bold text-white shadow-sm">
                        {getInitial(title)}
                        <span
                          className={[
                            'absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white',
                            isPartnerOnline ? 'bg-emerald-500' : 'bg-slate-300',
                          ].join(' ')}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-slate-950">{title}</p>
                          {date && <span className="shrink-0 text-[11px] text-slate-400">{date}</span>}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {isPartnerOnline ? 'Active now · ' : ''}
                          {latestMessage?.content || '아직 메시지가 없습니다.'}
                        </p>
                      </div>
                    </button>
                  )
                })}
                {roomsQuery.isFetchingNextPage && (
                  <div className="flex items-center justify-center gap-2 px-4 py-3 text-xs text-slate-500">
                    <Spinner className="h-3.5 w-3.5" />
                    채팅방 더 불러오는 중
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
