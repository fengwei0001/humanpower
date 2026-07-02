/**
 * Skills API Service
 * 与后端 PostgreSQL 数据交互
 */
import type { Skill } from '../data/skills'

interface SkillFromDB {
  id: number
  source_id: number
  name: string
  alias: string | null
  description: string | null
  display_name: string | null
  display_desc: string | null
  track_id: string | null
  track_ids: string[]
  sub_domain: string | null
  tags: string[]
  source_url: string | null
  creator: string | null
  download_count: number
  rating: number
  llm_score: number
  latest_version: string | null
  verified: boolean
  comment_count: number
  use_case_count: number
  input: string | null
  output: string | null
  scenario: string | null
  steps: string[] | null
  created_at: string
  updated_at: string
}

export interface FetchSkillsParams {
  page?: number
  pageSize?: number
  track?: string
  tag?: string
  search?: string
  sort?: 'hot' | 'new' | 'rating'
}

export interface FetchSkillsResponse {
  skills: Skill[]
  total: number
  page: number
  pageSize: number
}

// 头像 emoji 池
const AVATARS = ['👨‍💻', '👩‍💻', '🧑‍💼', '👨‍🎨', '👩‍🔬', '🧑‍🏫', '👨‍🚀', '🤖', '🦊', '🐱']

function getAvatar(creator: string): string {
  let hash = 0
  for (let i = 0; i < creator.length; i++) {
    hash = ((hash << 5) - hash) + creator.charCodeAt(i)
  }
  return AVATARS[Math.abs(hash) % AVATARS.length]
}

/**
 * 将数据库返回的 skill 转换为前端 Skill 格式
 */
function dbSkillToFrontend(dbSkill: SkillFromDB): Skill {
  return {
    id: `db-${dbSkill.id}`,
    name: dbSkill.display_name || dbSkill.alias || dbSkill.name,
    description: dbSkill.display_desc || dbSkill.description || '',
    trackId: dbSkill.track_id || 'engineer',
    trackIds: dbSkill.track_ids?.length ? dbSkill.track_ids : [dbSkill.track_id || 'engineer'],
    subDomain: dbSkill.sub_domain || '',
    creator: {
      name: dbSkill.creator || 'anonymous',
      avatar: getAvatar(dbSkill.creator || 'anonymous'),
    },
    installs: dbSkill.download_count,
    citations: dbSkill.comment_count * 10 + dbSkill.use_case_count * 50,
    rating: dbSkill.rating || (dbSkill.llm_score ? dbSkill.llm_score / 20 : 4.0),
    successRate: dbSkill.llm_score || 80,
    tags: dbSkill.tags || [],
    createdAt: dbSkill.created_at?.split('T')[0] || '2026-01-01',
    sourceUrl: dbSkill.source_url || undefined,
    input: dbSkill.input || undefined,
    output: dbSkill.output || undefined,
    scenario: dbSkill.scenario || undefined,
    steps: dbSkill.steps || undefined,
  }
}

/**
 * 从后端 API 获取技能列表
 */
export async function fetchSkills(params: FetchSkillsParams = {}): Promise<FetchSkillsResponse> {
  const query = new URLSearchParams()
  if (params.page) query.set('page', String(params.page))
  if (params.pageSize) query.set('pageSize', String(params.pageSize))
  if (params.track) query.set('track', params.track)
  if (params.tag) query.set('tag', params.tag)
  if (params.search) query.set('search', params.search)
  if (params.sort) query.set('sort', params.sort)

  const url = `/api/skills?${query.toString()}`
  const resp = await fetch(url)

  if (!resp.ok) {
    throw new Error(`API error: ${resp.status}`)
  }

  const json = await resp.json()
  const { data } = json

  return {
    skills: data.list.map(dbSkillToFrontend),
    total: data.total,
    page: data.page,
    pageSize: data.pageSize,
  }
}

/**
 * 获取单个技能详情
 */
export async function fetchSkillById(id: number): Promise<Skill | null> {
  const resp = await fetch(`/api/skills/${id}`)
  if (!resp.ok) return null

  const json = await resp.json()
  return dbSkillToFrontend(json.data)
}

/**
 * 获取赛道统计数据
 */
export async function fetchTrackStats(): Promise<Array<{
  track_id: string
  skill_count: number
  total_downloads: number
  avg_score: number
}>> {
  const resp = await fetch('/api/tracks/stats')
  if (!resp.ok) return []

  const json = await resp.json()
  return json.data
}

/**
 * 获取 AI 搜索上下文（所有有优化内容的 skill 摘要）
 */
export interface SearchContextSkill {
  id: number
  name: string
  display_name: string
  display_desc: string
  scenario: string | null
  input: string | null
  output: string | null
  tags: string[]
  track_id: string | null
  track_ids: string[]
  sub_domain: string | null
  download_count: number
  source_url: string | null
}

export async function fetchSearchContext(): Promise<SearchContextSkill[]> {
  const resp = await fetch('/api/skills/search-context')
  if (!resp.ok) return []

  const json = await resp.json()
  return json.data || []
}

/**
 * 获取标签列表（按赛道聚合高频 tags）
 */
export interface TagItem {
  tag: string
  cnt: number
}

export async function fetchTags(track?: string): Promise<TagItem[]> {
  const query = new URLSearchParams()
  if (track) query.set('track', track)

  const resp = await fetch(`/api/skills/tags?${query.toString()}`)
  if (!resp.ok) return []

  const json = await resp.json()
  return json.data || []
}
