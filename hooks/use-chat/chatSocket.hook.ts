'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { io, type Socket } from 'socket.io-client'

import type { MessageCursor, MessageEntity, RoomEntity, RoomMessagesPage } from './chat.dto'

export type ChatSocketStatus = 'idle' | 'connecting' | 'connected' | 'joined' | 'error' | 'closed'

export type JoinRoomDto = {
  roomId: string
}

export type SendChatMessageDto = {
  roomId: string
  content: string
}

export type QueryMessagesDto = {
  roomId: string
  limit: number
  cursor?: MessageCursor
}

type UseChatSocketOptions = {
  roomId?: string | null
  enabled?: boolean
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null
  return null
}

function getSocketUrl() {
  const explicitUrl = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_WS_URL
  if (explicitUrl) return withChatNamespace(explicitUrl)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  if (!apiUrl) return 'http://localhost:3500/chat'

  return withChatNamespace(apiUrl.replace(/\/api\/v\d+\/?$/, '').replace(/\/$/, ''))
}

function withChatNamespace(url: string) {
  const trimmed = url.replace(/\/$/, '')
  return trimmed.endsWith('/chat') ? trimmed : `${trimmed}/chat`
}

function normalizeMessage(input: any): MessageEntity | null {
  if (!input) return null
  if (input.data) return normalizeMessage(input.data)
  if (input.message && typeof input.message === 'object') return normalizeMessage(input.message)
  if (input.roomId && input.content) return input as MessageEntity
  return null
}

function getRoomMessages(room?: RoomEntity | null) {
  return room?.messages ?? []
}

function normalizeMessagesPage(input: any): RoomMessagesPage {
  const payload = input?.data?.data && input?.data?.more ? input.data : input?.data && input?.more ? input : input?.data ?? input
  const messages = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : []

  return {
    data: messages as MessageEntity[],
    more: {
      hasMore: Boolean(payload?.more?.hasMore),
      nextCursor: payload?.more?.nextCursor ?? null,
    },
  }
}

function mergeMessages(current: MessageEntity[], incoming: MessageEntity[]) {
  const next = [...current]
  incoming.forEach((message) => {
    if (message.id && next.some((item) => item.id === message.id)) return
    next.push(message)
  })
  return next
}

function toOnlineValue(payload: any, fallback?: boolean) {
  if (typeof payload?.isOnline === 'boolean') return payload.isOnline
  if (typeof payload?.online === 'boolean') return payload.online
  if (typeof payload?.status === 'string') return payload.status.toLowerCase() === 'online'
  return fallback
}

export function useChatSocket({ roomId, enabled = true }: UseChatSocketOptions = {}) {
  const socketRef = useRef<Socket | null>(null)
  const activeRoomIdRef = useRef<string | null>(roomId ?? null)
  const [status, setStatus] = useState<ChatSocketStatus>('idle')
  const [room, setRoom] = useState<RoomEntity | null>(null)
  const [messages, setMessages] = useState<MessageEntity[]>([])
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    activeRoomIdRef.current = roomId ?? null
  }, [roomId])

  const disconnect = useCallback(() => {
    const socket = socketRef.current
    if (!socket) return

    if (activeRoomIdRef.current) {
      socket.emit('chat:leaveRoom', { roomId: activeRoomIdRef.current })
    }

    socket.disconnect()
    socketRef.current = null
    setStatus('closed')
  }, [])

  const connect = useCallback(() => {
    if (!enabled) return null
    if (socketRef.current?.connected) return socketRef.current

    const token = getCookie('access_token')
    setStatus('connecting')
    setError(null)

    const socket = io(getSocketUrl(), {
      transports: ['websocket'],
      auth: token ? { token } : undefined,
      query: token ? { token } : undefined,
      autoConnect: false,
      reconnectionAttempts: 3,
      timeout: 10000,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setStatus('connected')
    })

    socket.on('disconnect', () => {
      setStatus('closed')
    })

    socket.on('connect_error', (connectError) => {
      setError(connectError instanceof Error ? connectError : new Error(String(connectError)))
      setStatus('error')
    })

    socket.on('chat:userJoinedRoom', (joinedRoom: RoomEntity) => {
      if (!activeRoomIdRef.current || joinedRoom.id !== activeRoomIdRef.current) return
      setRoom(joinedRoom)
      setMessages(getRoomMessages(joinedRoom))
      setStatus('joined')
    })

    const handleMessage = (payload: unknown) => {
      const message = normalizeMessage(payload)
      if (!message) return
      if (activeRoomIdRef.current && message.roomId !== activeRoomIdRef.current) return

      setMessages((prev) => {
        if (message.id && prev.some((item) => item.id === message.id)) return prev
        return [...prev, message]
      })
    }

    const handleStatus = (payload: any, fallback?: boolean) => {
      if (typeof payload === 'string') {
        if (typeof fallback !== 'boolean') return
        setOnlineUsers((prev) => ({
          ...prev,
          [payload]: fallback,
        }))
        return
      }

      if (Array.isArray(payload)) {
        payload.forEach((item) => handleStatus(item, fallback))
        return
      }

      if (payload?.data) {
        handleStatus(payload.data, fallback)
        return
      }

      if (payload?.user) {
        handleStatus(
          {
            ...payload.user,
            isOnline: toOnlineValue(payload, fallback),
          },
          fallback,
        )
        return
      }

      if (payload?.onlineUsers && typeof payload.onlineUsers === 'object') {
        if (Array.isArray(payload.onlineUsers)) {
          payload.onlineUsers.forEach((item: any) => handleStatus(item, true))
          return
        }

        setOnlineUsers((prev) => ({
          ...prev,
          ...payload.onlineUsers,
        }))
        return
      }

      const onlineUserIds = payload?.allUserOnlineIds || payload?.onlineUserIds || payload?.userIds
      if (Array.isArray(onlineUserIds)) {
        setOnlineUsers((prev) => {
          const next = { ...prev }
          onlineUserIds.forEach((userId) => {
            if (typeof userId === 'string' && userId) {
              next[userId] = true
            }
          })
          return next
        })
        return
      }

      const userId = payload?.userId || payload?.id
      const isOnline = toOnlineValue(payload, fallback)
      if (!userId || typeof isOnline !== 'boolean') return

      setOnlineUsers((prev) => ({
        ...prev,
        [userId]: isOnline,
      }))
    }

    socket.on('chat:message', handleMessage)
    socket.on('chat:newMessage', handleMessage)
    socket.on('chat:messageCreated', handleMessage)
    // socket.on('chat:userStatus', handleStatus)
    // socket.on('userStatus', handleStatus)
    // socket.on('chat:onlineUsers', handleStatus)
    // socket.on('onlineUsers', handleStatus)
    socket.on('chat:userOnline', (payload) => handleStatus(payload, true))
    socket.on('chat:userOffline', (payload) => handleStatus(payload, false))
    // socket.on('chat:userTyping', (payload) => {
    //   handleStatus(payload, true)
    // })
    socket.connect()

    return socket
  }, [enabled])

  const joinRoom = useCallback(
    async (dto: JoinRoomDto) => {
      const socket = socketRef.current?.connected ? socketRef.current : connect()
      if (!socket) throw new Error('Socket is not available')

      activeRoomIdRef.current = dto.roomId
      setStatus(socket.connected ? 'connected' : 'connecting')
      setError(null)

      return await new Promise<RoomEntity>((resolve, reject) => {
        socket.timeout(10000).emit('chat:joinRoom', dto, (ackError: Error | null, joinedRoom?: RoomEntity) => {
          if (ackError) {
            const nextError = ackError instanceof Error ? ackError : new Error(String(ackError))
            setError(nextError)
            setStatus('error')
            reject(nextError)
            return
          }

          if (!joinedRoom?.id) {
            const nextError = new Error('Invalid room response')
            setError(nextError)
            setStatus('error')
            reject(nextError)
            return
          }

          setRoom(joinedRoom)
          setMessages(getRoomMessages(joinedRoom))
          setStatus('joined')
          resolve(joinedRoom)
        })
      })
    },
    [connect],
  )

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim()
      const targetRoomId = activeRoomIdRef.current
      const socket = socketRef.current

      if (!trimmed || !targetRoomId || !socket?.connected) return null

      return await new Promise<MessageEntity | null>((resolve, reject) => {
        socket.timeout(10000).emit(
          'chat:sendMessage',
          {
            roomId: targetRoomId,
            content: trimmed,
          } satisfies SendChatMessageDto,
          (ackError: Error | null, payload?: unknown) => {
            if (ackError) {
              const nextError = ackError instanceof Error ? ackError : new Error(String(ackError))
              setError(nextError)
              reject(nextError)
              return
            }

            const message = normalizeMessage(payload)
            if (message) {
              setMessages((prev) => {
                if (message.id && prev.some((item) => item.id === message.id)) return prev
                return [...prev, message]
              })
            }
            resolve(message)
          },
        )
      })
    },
    [],
  )

  const queryMessages = useCallback(
    async (roomId: string, limit: number = 10, cursor?: MessageCursor): Promise<RoomMessagesPage> => {
      const socket = socketRef.current?.connected ? socketRef.current : connect()
      if (!socket) throw new Error('Socket is not available')

      return await new Promise<RoomMessagesPage>((resolve, reject) => {
        const timeoutId = window.setTimeout(() => {
          socket.off('chat:messagesQueried', handleMessagesQueried)
          reject(new Error('Query messages timeout'))
        }, 10000)

        const handleMessagesQueried = (payload: unknown) => {
          window.clearTimeout(timeoutId)
          const page = normalizeMessagesPage(payload)

          if (!activeRoomIdRef.current || activeRoomIdRef.current === roomId) {
            setMessages((prev) => mergeMessages(prev, page.data))
          }

          resolve(page)
        }

        socket.once('chat:messagesQueried', handleMessagesQueried)
        socket.emit('chat:queryMessages', {
          roomId,
          limit,
          cursor,
        } satisfies QueryMessagesDto)
      })
    },
    [connect],
  )

  useEffect(() => {
    if (!enabled) return
    const socket = connect()
    if (!socket || !roomId) return

    const joinWhenConnected = () => {
      joinRoom({ roomId }).catch(() => undefined)
    }

    if (socket.connected) {
      joinWhenConnected()
    } else {
      socket.once('connect', joinWhenConnected)
    }

    return () => {
      socket.off('connect', joinWhenConnected)
    }
  }, [connect, enabled, joinRoom, roomId])

  useEffect(() => {
    return disconnect
  }, [disconnect])

  return {
    socket: socketRef.current,
    status,
    isConnected: status === 'connected' || status === 'joined',
    isJoined: status === 'joined',
    room,
    messages,
    onlineUsers,
    error,
    connect,
    disconnect,
    joinRoom,
    queryMessages,
    sendMessage,
  }
}
