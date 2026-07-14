import { useCallback } from "react"

import { serviceAxios } from "@/lib/axios/axios.client"

import { GetRoomsQueryDto, RoomEntity } from "./chat.dto"

export const useChat = () => {
  const getRooms = useCallback(async (dto: GetRoomsQueryDto, id: string) => {
    const response = await serviceAxios.get(`/chat/users/${id}/rooms`, { params: dto })
    return response.data.data || response.data
  }, [])

  const createRoom = useCallback(async (): Promise<RoomEntity> => {
    const response = await serviceAxios.post("/chat/rooms")
    return response.data.data || response.data
  }, [])

  return { getRooms, createRoom }
}
