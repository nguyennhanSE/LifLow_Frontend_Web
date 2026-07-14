import type { User } from "@/entities/user.entity"

/** Fired when my-page profile (avatar / 기본 정보) is updated so sidebar can sync. */
export const USER_PROFILE_UPDATED_EVENT = "liflow:user-profile-updated"

export function emitUserProfileUpdated(user: User) {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(USER_PROFILE_UPDATED_EVENT, { detail: user }))
}
