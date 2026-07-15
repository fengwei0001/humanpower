/**
 * 用户标识 — 浏览器指纹 + localStorage 持久化
 * 同一浏览器内始终返回同一个 token，用于：
 * 1. yunAgent Profile 隔离
 * 2. 用户行为持久化（安装、关注、评价）
 */

const STORAGE_KEY = 'meyo_user_token'

function generateFingerprint(): string {
  const nav = window.navigator
  const screen = window.screen

  // 收集浏览器特征
  const components = [
    nav.userAgent,
    nav.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    nav.hardwareConcurrency || 'unknown',
    (nav as any).deviceMemory || 'unknown',
  ]

  // 简单 hash
  const str = components.join('|')
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }

  return Math.abs(hash).toString(36)
}

function generateToken(): string {
  const fingerprint = generateFingerprint()
  const random = Math.random().toString(36).slice(2, 10)
  const timestamp = Date.now().toString(36)
  return `meyo_${fingerprint}_${random}_${timestamp}`
}

/**
 * 获取用户 token（首次访问时生成并持久化）
 */
export function getUserToken(): string {
  let token = localStorage.getItem(STORAGE_KEY)
  if (!token) {
    token = generateToken()
    localStorage.setItem(STORAGE_KEY, token)
  }
  return token
}

/**
 * 获取用于 yunAgent Profile 的短 ID
 */
export function getProfileId(): string {
  const token = getUserToken()
  // 取 token 中间的指纹+随机部分作为 profile id
  return token.replace('meyo_', '').slice(0, 16)
}
