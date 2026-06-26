import { create } from 'zustand'
import { skills as localSkills, type Skill } from '../data/skills'
import { fetchSkills, type FetchSkillsParams } from '../services/skills-api'

interface SkillsState {
  // 数据
  skills: Skill[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
  loading: boolean
  error: string | null
  dataSource: 'local' | 'api' // 当前数据来源

  // 过滤条件
  filterTrack: string | null
  filterSort: 'hot' | 'new' | 'rating'
  searchQuery: string

  // Actions
  setFilterTrack: (track: string | null) => void
  setFilterSort: (sort: 'hot' | 'new' | 'rating') => void
  setSearchQuery: (query: string) => void
  loadSkills: (params?: FetchSkillsParams) => Promise<void>
  loadMore: () => Promise<void>
  getFilteredSkills: () => Skill[]
  getSkillById: (id: string) => Skill | undefined
  getSkillsByTrack: (trackId: string) => Skill[]
  getTopSkills: (limit?: number) => Skill[]
  addSkill: (skill: Skill) => void
}

export const useSkillsStore = create<SkillsState>((set, get) => ({
  // 初始用本地数据，API 加载后替换
  skills: localSkills,
  total: localSkills.length,
  page: 1,
  pageSize: 20,
  hasMore: false,
  loading: false,
  error: null,
  dataSource: 'local',

  filterTrack: null,
  filterSort: 'hot',
  searchQuery: '',

  setFilterTrack: (track) => {
    set({ filterTrack: track, page: 1, skills: [], hasMore: false })
    get().loadSkills()
  },

  setFilterSort: (sort) => {
    set({ filterSort: sort, page: 1, skills: [], hasMore: false })
    get().loadSkills()
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query })
    // 搜索有 debounce，由组件控制何时调用 loadSkills
  },

  /**
   * 从 API 加载技能列表（首页/切换筛选条件时调用）
   */
  loadSkills: async (params?: FetchSkillsParams) => {
    const { filterTrack, filterSort, searchQuery } = get()
    set({ loading: true, error: null })

    try {
      const result = await fetchSkills({
        page: params?.page || 1,
        pageSize: params?.pageSize || 20,
        track: params?.track ?? filterTrack ?? undefined,
        search: params?.search ?? (searchQuery || undefined),
        sort: params?.sort ?? filterSort,
      })

      set({
        skills: result.skills,
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        hasMore: result.page * result.pageSize < result.total,
        loading: false,
        dataSource: 'api',
      })
    } catch (err: any) {
      console.warn('API load failed, falling back to local data:', err.message)
      // API 不可用时 fallback 到本地数据
      set({
        skills: localSkills,
        total: localSkills.length,
        hasMore: false,
        loading: false,
        dataSource: 'local',
        error: err.message,
      })
    }
  },

  /**
   * 加载更多（滚动分页）
   */
  loadMore: async () => {
    const { page, pageSize, hasMore, loading, filterTrack, filterSort, searchQuery, skills } = get()
    if (!hasMore || loading) return

    set({ loading: true })

    try {
      const result = await fetchSkills({
        page: page + 1,
        pageSize,
        track: filterTrack ?? undefined,
        search: searchQuery || undefined,
        sort: filterSort,
      })

      set({
        skills: [...skills, ...result.skills],
        page: result.page,
        hasMore: result.page * result.pageSize < result.total,
        loading: false,
      })
    } catch (err: any) {
      set({ loading: false, error: err.message })
    }
  },

  getFilteredSkills: () => {
    const { skills, filterTrack, filterSort, searchQuery, dataSource } = get()

    // 如果数据来自 API，服务端已经做了筛选排序，直接返回
    if (dataSource === 'api') return skills

    // 本地数据的客户端筛选（fallback 模式）
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
