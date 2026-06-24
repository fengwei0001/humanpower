import { create } from 'zustand'
import { skills, type Skill } from '../data/skills'

interface SkillsState {
  skills: Skill[]
  filterTrack: string | null
  filterSort: 'hot' | 'new' | 'rating'
  searchQuery: string
  setFilterTrack: (track: string | null) => void
  setFilterSort: (sort: 'hot' | 'new' | 'rating') => void
  setSearchQuery: (query: string) => void
  getFilteredSkills: () => Skill[]
  getSkillById: (id: string) => Skill | undefined
  getSkillsByTrack: (trackId: string) => Skill[]
  getTopSkills: (limit?: number) => Skill[]
  addSkill: (skill: Skill) => void
}

export const useSkillsStore = create<SkillsState>((set, get) => ({
  skills,
  filterTrack: null,
  filterSort: 'hot',
  searchQuery: '',

  setFilterTrack: (track) => set({ filterTrack: track }),
  setFilterSort: (sort) => set({ filterSort: sort }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  getFilteredSkills: () => {
    const { skills, filterTrack, filterSort, searchQuery } = get()
    let filtered = [...skills]

    if (filterTrack) {
      filtered = filtered.filter((s) => s.trackIds?.includes(filterTrack) || s.trackId === filterTrack)
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q))
      )
    }

    switch (filterSort) {
      case 'hot':
        filtered.sort((a, b) => b.installs + b.citations - (a.installs + a.citations))
        break
      case 'new':
        filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        break
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating)
        break
    }

    return filtered
  },

  getSkillById: (id) => get().skills.find((s) => s.id === id),
  getSkillsByTrack: (trackId) => get().skills.filter((s) => s.trackIds?.includes(trackId) || s.trackId === trackId),
  getTopSkills: (limit = 10) =>
    [...get().skills].sort((a, b) => b.installs - a.installs).slice(0, limit),

  addSkill: (skill) => set((state) => ({ skills: [skill, ...state.skills] })),
}))
