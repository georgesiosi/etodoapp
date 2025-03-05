/**
 * Hook for managing user profile data and preferences
 */

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { UserProfile } from "@/types/profile"

interface ProfileState {
  profile: UserProfile | null
  setProfile: (profile: UserProfile) => void
  getPersonalContext: () => string
}

export const useProfile = create<ProfileState>()(
  persist(
    (set, get) => ({
      profile: null,
      setProfile: (profile) => set({ profile }),
      getPersonalContext: () => get().profile?.personalContext || "",
    }),
    {
      name: "user-profile",
    }
  )
)
