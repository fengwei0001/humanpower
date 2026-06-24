import { create } from 'zustand'
import { currentUser, type User, type Shrimp } from '../data/users'

interface UserState {
  user: User
  installedSkills: string[]
  installSkill: (skillId: string, shrimpId: string) => void
  uninstallSkill: (skillId: string) => void
}

export const useUserStore = create<UserState>((set) => ({
  user: currentUser,
  installedSkills: ['pm-prd-writer', 'pm-review-board', 'pm-analytics', 'pm-experiment', 'pm-tracking', 'pm-survey', 'eng-superpowers', 'eng-tdd'],

  installSkill: (skillId, shrimpId) =>
    set((state) => ({
      installedSkills: [...state.installedSkills, skillId],
      user: {
        ...state.user,
        shrimps: state.user.shrimps.map((s: Shrimp) =>
          s.id === shrimpId ? { ...s, skills: [...s.skills, skillId] } : s
        ),
      },
    })),

  uninstallSkill: (skillId) =>
    set((state) => ({
      installedSkills: state.installedSkills.filter((id: string) => id !== skillId),
    })),
}))
