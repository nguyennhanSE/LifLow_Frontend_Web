import { useCallback } from 'react'
import { serviceAxios } from '@/lib/axios/axios.client'
import type { StaticPageEntity } from '@/entities/static-page/static-page.entity'
import type { CreateStaticPageDto, UpdateStaticPageDto } from './static-page.dto'

export const useStaticPage = () => {
  const getStaticPages = useCallback(async () => {
    const response = await serviceAxios.get('/static-pages')
    return (response.data.data || response.data) as StaticPageEntity[]
  }, [])

  const getStaticPageBySlug = useCallback(async (slug: string) => {
    const response = await serviceAxios.get(`/static-pages/slug/${slug}`)
    return (response.data.data || response.data) as StaticPageEntity
  }, [])

  const getStaticPageById = useCallback(async (id: string) => {
    const response = await serviceAxios.get(`/static-pages/${id}`)
    return (response.data.data || response.data) as StaticPageEntity
  }, [])

  const createStaticPage = useCallback(async (dto: CreateStaticPageDto) => {
    const response = await serviceAxios.post('/static-pages', dto)
    return (response.data.data || response.data) as StaticPageEntity
  }, [])

  const updateStaticPage = useCallback(async (id: string, dto: UpdateStaticPageDto) => {
    const response = await serviceAxios.patch(`/static-pages/${id}`, dto)
    return (response.data.data || response.data) as StaticPageEntity
  }, [])

  const deleteStaticPage = useCallback(async (id: string) => {
    const response = await serviceAxios.delete(`/static-pages/${id}`)
    return response.data
  }, [])

  return {
    getStaticPages,
    getStaticPageBySlug,
    getStaticPageById,
    createStaticPage,
    updateStaticPage,
    deleteStaticPage,
  }
}
