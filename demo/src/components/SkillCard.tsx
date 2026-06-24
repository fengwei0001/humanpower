import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Skill } from '../data/skills'
import { tracks } from '../data/tracks'

interface Props {
  skill: Skill
  index?: number
}

export default function SkillCard({ skill, index = 0 }: Props) {
  const navigate = useNavigate()
  const track = tracks.find((t) => t.id === skill.trackId)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="skill-card"
      onClick={() => navigate(`/skills/${skill.id}`)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-semibold text-text-primary truncate">{skill.name}</h3>
          <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{skill.description}</p>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {(skill.trackIds || [skill.trackId]).map((tid) => {
          const t = tracks.find((tr) => tr.id === tid)
          return t ? (
            <span
              key={tid}
              className="tag"
              style={{ backgroundColor: t.bgColor, color: t.color }}
            >
              {t.icon} {t.name}
            </span>
          ) : null
        })}
        {skill.tags.slice(0, 2).map((tag) => (
          <span key={tag} className="tag bg-gray-50 text-text-secondary">
            {tag}
          </span>
        ))}
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-4 text-xs text-text-secondary">
          <span className="flex items-center gap-1">
            📥 {skill.installs.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            🔗 {skill.citations}
          </span>
          <span className="flex items-center gap-1">
            ⭐ {skill.rating}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{skill.creator.avatar}</span>
          <span className="text-xs text-text-tertiary">{skill.creator.name}</span>
        </div>
      </div>
    </motion.div>
  )
}
