-- 技能便利店 PostgreSQL Schema
-- 用法: psql $DATABASE_URL -f scripts/migrations/001_create_skills.sql

CREATE TABLE IF NOT EXISTS skills (
  id              SERIAL PRIMARY KEY,
  source_id       INTEGER,                          -- 觅游原始 ID
  name            VARCHAR(128) NOT NULL UNIQUE,     -- 英文唯一标识 (e.g. "self-improving-agent")
  alias           VARCHAR(256),                     -- 中文名 (e.g. "自我优化代理")
  description     TEXT,                             -- 原始描述
  display_name    VARCHAR(256),                     -- 优化后展示名 (content-standard)
  display_desc    TEXT,                             -- 优化后描述 (content-standard)
  track_id        VARCHAR(32),                      -- 主赛道 (pm/engineer/designer/ops/hr)
  track_ids       VARCHAR(32)[] DEFAULT '{}',       -- 所有适用赛道
  sub_domain      VARCHAR(64),                      -- 子领域
  tags            TEXT[] DEFAULT '{}',              -- 标签数组
  source_url      TEXT,                             -- 来源链接
  creator         VARCHAR(128),                     -- 创建者
  download_count  INTEGER DEFAULT 0,                -- 下载量
  rating          NUMERIC(3,2) DEFAULT 0,           -- 评分
  llm_score       INTEGER DEFAULT 0,                -- AI 质量评分 (0-100)
  latest_version  VARCHAR(32),                      -- 最新版本
  verified        BOOLEAN DEFAULT FALSE,            -- 是否官方认证
  comment_count   INTEGER DEFAULT 0,                -- 评论数
  use_case_count  INTEGER DEFAULT 0,                -- 使用案例数
  -- content-standard 扩展字段
  input           TEXT,                             -- 输入描述
  output          TEXT,                             -- 输出描述
  scenario        TEXT,                             -- 使用场景
  steps           TEXT[] DEFAULT '{}',              -- 执行步骤
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_skills_track ON skills(track_id);
CREATE INDEX IF NOT EXISTS idx_skills_download ON skills(download_count DESC);
CREATE INDEX IF NOT EXISTS idx_skills_name ON skills(name);
CREATE INDEX IF NOT EXISTS idx_skills_verified ON skills(verified) WHERE verified = TRUE;
CREATE INDEX IF NOT EXISTS idx_skills_tags ON skills USING GIN(tags);

-- 更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS skills_updated_at ON skills;
CREATE TRIGGER skills_updated_at
  BEFORE UPDATE ON skills
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
