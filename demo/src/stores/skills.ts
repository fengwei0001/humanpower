import { create } from 'zustand'
import { skills as localSkills, type Skill } from '../data/skills'
import { fetchSkills } from '../services/skills-api'

interface SkillsState {
  skills: Skill[]
  total: number
  page: number
  hasMore: boolean
  loading: boolean
  initialized: boolean
  filterTrack: string | null
  filterSort: 'hot' | 'new' | 'rating'
  searchQuery: string
  setFilterTrack: (track: string | null) => void
  setFilterSort: (sort: 'hot' | 'new' | 'rating') => void
  setSearchQuery: (query: string) => void
  loadSkills: () => Promise<void>
  loadMore: () => Promise<void>
  getFilteredSkills: () => Skill[]
  getSkillById: (id: string) => Skill | undefined
  getSkillsByTrack: (trackId: string) => Skill[]
  getTopSkills: (limit?: number) => Skill[]
  addSkill: (skill: Skill) => void
}

export const useSkillsStore = create<SkillsState>((set, get) => ({
  skills: localSkills,
  total: localSkills.length,
  page: 1,
  hasMore: false,
  loading: false,
  initialized: false,
  filterTrack: null,
  filterSort: 'hot',
  searchQuery: '',

  setFilterTrack: (track) => {
    set({ filterTrack: track, page: 1 })
    get().loadSkills()
  },

  setFilterSort: (sort) => {
    set({ filterSort: sort, page: 1 })
    get().loadSkills()
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  loadSkills: async () => {
    // 暂时只展示本地精品 skill，等线上数据按 content-standard 优化完再切换
    set({ loading: false, initialized: true })
  },

  loadMore: async () => {
    const { page, hasMore, loading, filterTrack, filterSort, searchQuery, skills } = get()
    if (!hasMore || loading) return

    set({ loading: true })

    try {
      const result = await fetchSkills({
        page: page + 1,
        pageSize: 20,
        track: filterTrack || undefined,
        search: searchQuery || undefined,
        sort: filterSort,
      })

      set({
        skills: [...skills, ...result.skills],
        page: page + 1,
        hasMore: (page + 1) * result.pageSize < result.total,
        loading: false,
      })
    } catch {
      set({ loading: false })
    }
  },

  getFilteredSkills: () => {
    const { skills, filterTrack, filterSort, searchQuery, initialized } = get()

    // 数据已从 API 加载（服务端已做筛选排序），直接返回
    if (initialized && !searchQuery) return skills

    // 本地过滤（fallback 或客户端搜索）
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
