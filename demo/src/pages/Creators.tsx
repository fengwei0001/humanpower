import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { creators } from '../data/creators'
import { tracks } from '../data/tracks'
import { useSkillsStore } from '../stores/skills'

type FeedAction = 'published' | 'updated' | 'used' | 'favorited' | 'reviewed'

interface FeedItem {
  id: string
  creatorId: string
  skillId: string
  action: FeedAction
  time: string
  note: string
  trackId?: string
}

const actionLabels: Record<FeedAction, { text: string; icon: string; color: string }> = {
  published: { text: '发布了技能', icon: '🎉', color: 'text-brand-green' },
  updated:   { text: '更新了技能', icon: '⚡', color: 'text-blue-600' },
  used:      { text: '使用了技能', icon: '▶️', color: 'text-amber-600' },
  favorited: { text: '收藏了技能', icon: '⭐', color: 'text-purple-600' },
  reviewed:  { text: '评价了技能', icon: '💬', color: 'text-pink-600' },
}

type FeedTab = 'following' | 'pm' | 'engineer' | 'creator' | 'opc'

const feedTabs: { key: FeedTab; label: string; icon: string }[] = [
  { key: 'following', label: '关注动态', icon: '📢' },
  { key: 'pm', label: '产品经理', icon: '🎯' },
  { key: 'engineer', label: '工程师', icon: '⚡' },
  { key: 'creator', label: '自媒体', icon: '📹' },
  { key: 'opc', label: 'OPC', icon: '🚀' },
]

const feedItems: FeedItem[] = [
  { id: 'f1', creatorId: 'creator-zara', skillId: 'pm-slides', action: 'updated', time: '2 小时前', trackId: 'pm', note: '更新了演示模板库，新增 5 套暗色系风格。现在支持一键切换主题，适合深色背景的场合。' },
  { id: 'f2', creatorId: 'creator-zephyr', skillId: 'pm-prd-writer', action: 'updated', time: '5 小时前', trackId: 'pm', note: '优化了异常处理的自动补全，现在能识别更多边界情况。再也不会漏掉「如果用户取消操作」这类 case 了。' },
  { id: 'f3', creatorId: 'creator-jesse', skillId: 'eng-superpowers', action: 'published', time: '昨天', trackId: 'engineer', note: '全新技能上线！让 AI 从设计讨论到 TDD 到自动 Code Review，出来的代码你敢直接合到 main。' },
  { id: 'f4', creatorId: 'creator-dean', skillId: 'pm-ost', action: 'reviewed', time: '昨天', trackId: 'pm', note: '用了一个月，帮我砍掉了 3 个伪需求。以前每次老板说「做个XX」我就开干，现在会先问「这解决什么问题」。强烈推荐给每个产品经理。' },
  { id: 'f5', creatorId: 'creator-corey', skillId: 'ops-ab-testing', action: 'updated', time: '2 天前', trackId: 'opc', note: '增加了多变量实验的样本量速查表，不用再手算了。直接输入变量数量和预期效果大小就行。' },
  { id: 'f6', creatorId: 'creator-matt', skillId: 'eng-debugging', action: 'used', time: '3 天前', trackId: 'engineer', note: '昨晚线上出了个并发 Bug，用这个方法 15 分钟就定位到了。以前这种问题至少排查 2 小时。' },
  { id: 'f7', creatorId: 'creator-zara', skillId: 'ops-lark-minutes', action: 'favorited', time: '3 天前', trackId: 'pm', note: '终于有人把会议纪要自动化做好了。能识别隐含承诺，不只是显式 TODO，太需要了。' },
  { id: 'f8', creatorId: 'creator-zephyr', skillId: 'pm-review-board', action: 'updated', time: '4 天前', trackId: 'pm', note: '法务角色审查能力增强，现在能检测 GDPR 合规问题。跨国产品必备。' },
  { id: 'f9', creatorId: 'creator-jesse', skillId: 'eng-debugging', action: 'reviewed', time: '4 天前', trackId: 'engineer', note: '这是我见过最系统的 Debug 方法论。不是教你用 console.log，而是教你怎么思考。从现象出发推理到根因，像侦探破案一样。' },
  { id: 'f10', creatorId: 'creator-matt', skillId: 'eng-superpowers', action: 'favorited', time: '5 天前', trackId: 'engineer', note: '看完才知道 AI 写代码不只是补全那么简单。它能帮你做架构决策、帮你考虑边界 case。' },
  { id: 'f11', creatorId: 'creator-zara', skillId: 'pm-slides', action: 'published', time: '1 天前', trackId: 'creator', note: '新系列：用 AI 做短视频选题。不是让 AI 瞎编，而是让它帮你从评论区、热搜、竞品里挖选题金矿。' },
  { id: 'f12', creatorId: 'creator-corey', skillId: 'ops-ab-testing', action: 'used', time: '2 天前', trackId: 'creator', note: '用这个方法测试了 3 种封面风格，数据说话——人物封面点击率比文字封面高 47%。以后选封面不用猜了。' },
  { id: 'f13', creatorId: 'creator-corey', skillId: 'ops-ab-testing', action: 'published', time: '1 天前', trackId: 'opc', note: '独立开发者增长手册上线！从 0 用户到前 100 个付费用户的完整打法，含 12 个实操模板。' },
  { id: 'f14', creatorId: 'creator-dean', skillId: 'pm-ost', action: 'used', time: '3 天前', trackId: 'opc', note: '用这个方法评估了 5 个产品方向，最后选了个市场最小但需求最刚的。一个人做，就得挑能赢的战场。' },
]

export default function Creators() {
  const navigate = useNavigate()
  const { skills } = useSkillsStore()
  const [followedIds, setFollowedIds] = useState<string[]>(['creator-zephyr', 'creator-zara', 'creator-jesse'])
  const [filterTrack, setFilterTrack] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<FeedTab>('following')

  const toggleFollow = (id: string) => {
    setFollowedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const filteredCreators = filterTrack
    ? creators.filter((c) => c.trackIds.includes(filterTrack))
    : creators

  const visibleFeed = activeTab === 'following'
    ? feedItems.filter(item => followedIds.includes(item.creatorId))
    : feedItems.filter(item => item.trackId === activeTab)

  return (
    <div className="p-8 max-w-[1100px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-text-primary">创作者</h1>
        <p className="text-sm text-text-secondary mt-1">
          关注的创作者有新动态时，你的 Agent 会第一时间学到他们的新方法论。
        </p>
      </motion.div>

      {/* Feed Tab 切换 */}
      <div className="flex gap-1 mb-6 border-b border-border">
        {feedTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-all relative ${
              activeTab === tab.key ? 'text-brand-green' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.icon} {tab.label}
            {activeTab === tab.key && <span className="absolute bottom-0 left-2 right-2 h-[3px] rounded-full bg-brand-green" />}
          </button>
        ))}
      </div>

      <div className="flex gap-6">
        {/* Left: Feed */}
        <div className="flex-1 min-w-0">
          <div className="space-y-4">
            {visibleFeed.map((item, i) => {
              const creator = creators.find(c => c.id === item.creatorId)
              const skill = skills.find(s => s.id === item.skillId)
              if (!creator || !skill) return null
              const actionMeta = actionLabels[item.action]

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="bg-white rounded-card p-5 border border-border hover:border-brand-green/20 transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-full bg-brand-green-surface flex items-center justify-center text-xl cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => navigate(`/creators/${creator.id}`)}
                    >
                      {creator.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-text-primary hover:text-brand-green cursor-pointer transition-colors" onClick={() => navigate(`/creators/${creator.id}`)}>
                          {creator.name}
                        </span>
                        <span className={`text-xs font-medium ${actionMeta.color}`}>{actionMeta.text}</span>
                      </div>
                      <div className="text-[11px] text-text-tertiary">{item.time}</div>
                    </div>
                  </div>

                  {item.note && (
                    <p className="ml-[52px] text-sm text-text-primary leading-relaxed mb-3">{item.note}</p>
                  )}

                  <div
                    className="ml-[52px] bg-[#F8FDF4] border border-brand-green/15 rounded-2xl p-4 cursor-pointer hover:border-brand-green/30 transition-all group"
                    onClick={() => navigate(`/skills/${skill.id}`)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-base">{actionMeta.icon}</span>
                      <h3 className="text-[15px] font-bold text-text-primary group-hover:text-brand-green transition-colors">{skill.name}</h3>
                    </div>
                    <p className="text-xs text-text-tertiary line-clamp-1 mb-3">{skill.description}</p>
                    <div className="flex items-center gap-4 text-xs text-text-tertiary">
                      <span>🔥 {skill.installs.toLocaleString()}</span>
                      <span>🔗 {skill.citations}</span>
                      <span>⭐ {skill.rating}</span>
                    </div>
                  </div>
                </motion.div>
              )
            })}

            {visibleFeed.length === 0 && (
              <div className="text-center py-16">
                <span className="text-3xl block mb-3">📭</span>
                <p className="text-sm text-text-secondary">
                  {activeTab === 'following' ? '还没有关注动态，去右边关注几个人吧' : '该赛道暂无动态'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-[300px] shrink-0">
          <div className="sticky top-8 space-y-5">
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setFilterTrack(null)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${!filterTrack ? 'bg-text-primary text-white' : 'bg-white border border-border text-text-secondary'}`}
              >全部</button>
              {tracks.map((track) => (
                <button
                  key={track.id}
                  onClick={() => setFilterTrack(track.id === filterTrack ? null : track.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterTrack === track.id ? 'text-white' : 'bg-white border border-border text-text-secondary'}`}
                  style={filterTrack === track.id ? { backgroundColor: track.color } : undefined}
                >{track.icon} {track.name}</button>
              ))}
            </div>

            <div className="bg-white rounded-card border border-border overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <h3 className="text-sm font-bold text-text-primary">推荐关注</h3>
              </div>
              <div className="divide-y divide-border">
                {filteredCreators.map((creator) => {
                  const isFollowed = followedIds.includes(creator.id)
                  return (
                    <div key={creator.id} className="px-4 py-3 hover:bg-surface-hover transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-brand-green-surface flex items-center justify-center text-2xl cursor-pointer hover:scale-105 transition-transform" onClick={() => navigate(`/creators/${creator.id}`)}>
                          {creator.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-text-primary truncate hover:text-brand-green cursor-pointer transition-colors" onClick={() => navigate(`/creators/${creator.id}`)}>
                            {creator.name}
                          </div>
                          <div className="text-[11px] text-text-tertiary truncate">{creator.title}</div>
                        </div>
                        <button
                          onClick={() => toggleFollow(creator.id)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-base font-medium transition-all shrink-0 ${isFollowed ? 'bg-brand-green-surface text-brand-green' : 'bg-text-primary text-white hover:bg-text-primary/90'}`}
                        >{isFollowed ? '✓' : '+'}</button>
                      </div>
                      <div className="ml-[56px] mt-1 flex items-center gap-3 text-[11px] text-text-tertiary">
                        <span>{creator.followers.toLocaleString()} followers</span>
                        <span>{creator.skillsCreated} 技能</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
