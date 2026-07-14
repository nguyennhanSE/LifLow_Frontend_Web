import type { Metadata } from "next"
import AnnouncementBoard from "./components/AnnouncementBoard";import i18next from 'i18next'


export const metadata: Metadata = {
  title: i18next.t('key53', '공지사항'),
  description: i18next.t('liflow5', 'Liflow의 공지사항과 이벤트, 업데이트 소식을 확인하세요.'),
}

export default function Page() {
  return <AnnouncementBoard />
}
