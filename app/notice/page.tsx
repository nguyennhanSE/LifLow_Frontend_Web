import type { Metadata } from "next"
import AnnouncementBoard from "./components/AnnouncementBoard";

export const metadata: Metadata = {
  title: "공지사항",
  description: "Liflow의 공지사항과 이벤트, 업데이트 소식을 확인하세요.",
}

export default function Page() {
  return <AnnouncementBoard />
}
