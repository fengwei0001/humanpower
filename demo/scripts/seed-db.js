/**
 * 将 raw_top1000.json 导入到 PostgreSQL
 *
 * 用法:
 *   DATABASE_URL=postgresql://user:pass@localhost:5432/humanpower node scripts/seed-db.js
 *
 * 前置:
 *   1. 确保数据库已创建: createdb humanpower
 *   2. 已拉取数据: node scripts/fetch-skills.js
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ═══════════════════════════════════════════════
// 分类映射: Mars tags → HumanPower tracks
// ═══════════════════════════════════════════════

const TAG_TO_TRACK = {
  'dev': 'engineer',
  'tools': 'engineer',
  'ai-lab': 'engineer',
  'content': 'ops',
  'marketing': 'ops',
  'office': 'pm',
  'finance': 'ops',
  'learning': null,
  'lifestyle': null,
  'gaming': null,
  'fantasy': null,
};

// 基于关键词的二次分类
const KEYWORD_TRACK_RULES = [
  // PM 相关
  { keywords: ['prd', '产品', 'product', '需求', 'requirement', '评审', 'review board', '原型', 'prototype'], track: 'pm', subDomain: 'PRD写作' },
  { keywords: ['数据分析', 'analytics', 'metric', '指标', 'a/b test', '实验'], track: 'pm', subDomain: '数据分析' },
  { keywords: ['用户研究', 'user research', '用户洞察', '用户画像'], track: 'pm', subDomain: '用户洞察' },
  { keywords: ['增长', 'growth', '留存', 'retention', '转化', 'conversion'], track: 'pm', subDomain: '用户增长' },
  { keywords: ['汇报', '演示', 'presentation', 'ppt', 'slide'], track: 'pm', subDomain: '汇报演示' },
  { keywords: ['项目管理', 'project manage', 'jira', 'sprint', 'agile'], track: 'pm', subDomain: '项目管理' },

  // 工程师相关
  { keywords: ['code review', '代码审查', 'review code'], track: 'engineer', subDomain: 'Code Review' },
  { keywords: ['debug', '调试', 'bug', 'fix', '排查', 'troubleshoot'], track: 'engineer', subDomain: 'Debug' },
  { keywords: ['架构', 'architecture', 'system design', '设计模式', 'microservice'], track: 'engineer', subDomain: '架构设计' },
  { keywords: ['前端', 'frontend', 'react', 'vue', 'css', 'html', 'nextjs', 'next.js', 'tailwind', 'svelte'], track: 'engineer', subDomain: '前端开发' },
  { keywords: ['test', '测试', 'tdd', 'unit test', 'jest', 'vitest', 'cypress'], track: 'engineer', subDomain: 'TDD' },
  { keywords: ['git', 'cli', 'docker', 'deploy', '部署', 'devops', 'ci/cd', 'kubernetes', 'k8s'], track: 'engineer', subDomain: '项目管理' },
  { keywords: ['python', 'javascript', 'typescript', 'rust', 'golang', 'java', 'swift', 'kotlin'], track: 'engineer', subDomain: '前端开发' },
  { keywords: ['api', 'rest', 'graphql', 'backend', '后端', 'database', '数据库', 'sql', 'redis'], track: 'engineer', subDomain: '架构设计' },

  // 设计师相关
  { keywords: ['设计', 'design', 'ui', 'ux', '视觉', 'figma', 'sketch'], track: 'designer', subDomain: '视觉设计' },
  { keywords: ['交互', 'interaction', 'wireframe', 'prototype'], track: 'designer', subDomain: '交互设计' },
  { keywords: ['品牌', 'brand', 'logo', '标识'], track: 'designer', subDomain: '品牌设计' },
  { keywords: ['动效', 'animation', 'motion', 'lottie'], track: 'designer', subDomain: '动效设计' },

  // 运营相关
  { keywords: ['运营', 'operation', '社群', 'community', '社区'], track: 'ops', subDomain: '社群运营' },
  { keywords: ['活动', 'campaign', '策划', 'event'], track: 'ops', subDomain: '活动策划' },
  { keywords: ['内容', 'content', '文案', 'copy', '写作', 'writing', 'blog', 'seo', 'article'], track: 'ops', subDomain: '内容策略' },
  { keywords: ['数据运营', '报表', 'dashboard', '看板'], track: 'ops', subDomain: '数据运营' },

  // HR 相关
  { keywords: ['招聘', 'recruit', '面试', 'interview', '简历', 'resume', 'hr', '人才'], track: 'hr', subDomain: '面试评估' },
  { keywords: ['绩效', 'performance', 'okr', 'kpi'], track: 'hr', subDomain: '绩效设计' },
  { keywords: ['团队', 'team', '文化', 'culture', '组织'], track: 'hr', subDomain: '团队文化' },
];

function classifySkill(skill) {
  const text = `${skill.name} ${skill.alias || ''} ${skill.description || ''} ${(skill.tags || []).join(' ')}`.toLowerCase();

  // 先用关键词规则匹配
  for (const rule of KEYWORD_TRACK_RULES) {
    if (rule.keywords.some(kw => text.includes(kw))) {
      return { trackId: rule.track, subDomain: rule.subDomain };
    }
  }

  // 再用 tags 里的分类标签
  const systemTags = (skill.tags || []).filter(t => TAG_TO_TRACK.hasOwnProperty(t));
  if (systemTags.length > 0) {
    const trackId = TAG_TO_TRACK[systemTags[0]];
    if (trackId) {
      return { trackId, subDomain: null };
    }
  }

  // 默认归入 engineer
  return { trackId: 'engineer', subDomain: null };
}

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ 请设置 DATABASE_URL 环境变量');
    console.error('   例: DATABASE_URL=postgresql://localhost:5432/humanpower node scripts/seed-db.js');
    process.exit(1);
  }

  // 读取原始数据
  const rawPath = join(__dirname, 'raw_top1000.json');
  const skills = JSON.parse(readFileSync(rawPath, 'utf-8'));
  console.log(`📦 读取 ${skills.length} 个 skill\n`);

  // 连接数据库
  const pool = new Pool({ connectionString: dbUrl });

  try {
    // 先运行 migration
    const migrationSql = readFileSync(join(__dirname, 'migrations/001_create_skills.sql'), 'utf-8');
    await pool.query(migrationSql);
    console.log('✓ Migration 执行完成\n');

    // 清空旧数据（idempotent）
    await pool.query('TRUNCATE skills RESTART IDENTITY');
    console.log('✓ 已清空旧数据\n');

    // 批量插入
    let inserted = 0;
    const BATCH_SIZE = 50;

    for (let i = 0; i < skills.length; i += BATCH_SIZE) {
      const batch = skills.slice(i, i + BATCH_SIZE);

      const values = [];
      const params = [];
      let paramIdx = 1;

      for (const skill of batch) {
        const { trackId, subDomain } = classifySkill(skill);
        const trackIds = trackId ? [trackId] : [];

        values.push(`($${paramIdx}, $${paramIdx+1}, $${paramIdx+2}, $${paramIdx+3}, $${paramIdx+4}, $${paramIdx+5}, $${paramIdx+6}, $${paramIdx+7}, $${paramIdx+8}, $${paramIdx+9}, $${paramIdx+10}, $${paramIdx+11}, $${paramIdx+12}, $${paramIdx+13}, $${paramIdx+14})`);

        params.push(
          skill.id,                             // source_id
          skill.name,                           // name
          skill.alias || null,                  // alias
          skill.description || null,            // description
          trackId,                              // track_id
          trackIds,                             // track_ids
          subDomain,                            // sub_domain
          skill.tags || [],                     // tags
          skill.sourceUrl || null,              // source_url
          skill.creator || null,                // creator
          skill.downloadCount || 0,             // download_count
          skill.llmAnalysisScore || 0,          // llm_score
          skill.latestVersion || null,          // latest_version
          skill.verified || false,              // verified
          skill.commentCount || 0,             // comment_count
        );
        paramIdx += 15;
      }

      const sql = `
        INSERT INTO skills (source_id, name, alias, description, track_id, track_ids, sub_domain, tags, source_url, creator, download_count, llm_score, latest_version, verified, comment_count)
        VALUES ${values.join(', ')}
        ON CONFLICT (name) DO UPDATE SET
          alias = EXCLUDED.alias,
          description = EXCLUDED.description,
          track_id = EXCLUDED.track_id,
          download_count = EXCLUDED.download_count,
          llm_score = EXCLUDED.llm_score,
          latest_version = EXCLUDED.latest_version
      `;

      await pool.query(sql, params);
      inserted += batch.length;
      process.stdout.write(`\r  导入进度: ${inserted}/${skills.length}`);
    }

    console.log('\n');

    // 打印统计
    const { rows: stats } = await pool.query(`
      SELECT track_id, COUNT(*) as count
      FROM skills
      GROUP BY track_id
      ORDER BY count DESC
    `);

    console.log('📊 分类统计:');
    for (const row of stats) {
      console.log(`   ${row.track_id || '(未分类)'}: ${row.count} 个`);
    }

    const { rows: [{ count: total }] } = await pool.query('SELECT COUNT(*) FROM skills');
    console.log(`\n✅ 导入完成! 共 ${total} 个 skill`);

  } finally {
    await pool.end();
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
