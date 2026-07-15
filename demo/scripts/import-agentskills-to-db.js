/**
 * 将 agentskills.me 的 enriched skills 导入 PostgreSQL
 *
 * 用法: DATABASE_URL=postgresql://... node scripts/import-agentskills-to-db.js
 * 输入: scripts/agentskills_enriched.json
 */
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ 请设置 DATABASE_URL 环境变量');
    process.exit(1);
  }

  const enrichedPath = join(__dirname, 'agentskills_enriched.json');
  if (!existsSync(enrichedPath)) {
    console.error('❌ 请先执行 node scripts/enrich-agentskills.js');
    process.exit(1);
  }

  const enriched = JSON.parse(readFileSync(enrichedPath, 'utf-8'));
  const skills = Object.values(enriched).filter(s => s.display_name && s.display_desc);

  console.log(`📦 准备导入 ${skills.length} 个 skills...`);

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: dbUrl.includes('railway') ? { rejectUnauthorized: false } : undefined,
  });

  let inserted = 0;
  let skipped = 0;

  for (const skill of skills) {
    // 检查是否已存在（按 source_url 去重）
    const { rows: existing } = await pool.query(
      'SELECT id FROM skills WHERE source_url = $1',
      [skill.sourceUrl || skill.codeRepository || '']
    );

    if (existing.length > 0) {
      skipped++;
      continue;
    }

    try {
      await pool.query(
        `INSERT INTO skills (
          name, alias, description, display_name, display_desc,
          track_id, track_ids, tags, source_url, creator,
          download_count, rating, scenario, verified
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          skill.slug,
          skill.name,
          skill.description,
          skill.display_name,
          skill.display_desc,
          skill.track_id || 'engineer',
          [skill.track_id || 'engineer'],
          skill.tags || [],
          skill.sourceUrl || skill.codeRepository || '',
          skill.author || 'unknown',
          skill.ratingCount || 0,
          skill.rating || 0,
          skill.scenario || '',
          false,
        ]
      );
      inserted++;
      console.log(`  ✓ [${inserted}] ${skill.display_name}`);
    } catch (err) {
      console.error(`  ❌ ${skill.slug}: ${err.message}`);
    }
  }

  await pool.end();
  console.log(`\n✅ 完成！插入 ${inserted} 个，跳过 ${skipped} 个（已存在）`);
}

main().catch(console.error);
