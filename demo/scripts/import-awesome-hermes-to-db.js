/**
 * 将 awesome-hermes-skills enriched 数据导入 PostgreSQL
 *
 * 用法: node scripts/import-awesome-hermes-to-db.js
 * (在 Railway Console 执行，DATABASE_URL 自动可用)
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

  const enrichedPath = join(__dirname, 'awesome_hermes_enriched.json');
  if (!existsSync(enrichedPath)) {
    console.error('❌ 文件不存在: awesome_hermes_enriched.json');
    process.exit(1);
  }

  const enriched = JSON.parse(readFileSync(enrichedPath, 'utf-8'));
  const skills = Object.values(enriched).filter(s => s.display_name && s.display_desc && s.display_desc.length > 5);

  console.log(`📦 准备导入 ${skills.length} 个 skills...`);

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: dbUrl.includes('railway') ? { rejectUnauthorized: false } : undefined,
  });

  let inserted = 0;
  let skipped = 0;
  let failed = 0;

  for (const skill of skills) {
    const sourceUrl = skill.source_url || '';

    // 按 source_url 或 name 去重
    const { rows: existing } = await pool.query(
      'SELECT id FROM skills WHERE source_url = $1 OR name = $2',
      [sourceUrl, skill.name]
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
          skill.name,
          skill.display_name,
          skill.description || '',
          skill.display_name,
          skill.display_desc,
          skill.track_id || 'engineer',
          [skill.track_id || 'engineer'],
          skill.tags || [],
          sourceUrl,
          'hermes-community',
          0,
          0,
          skill.scenario || '',
          false,
        ]
      );
      inserted++;
      if (inserted % 20 === 0) console.log(`  ✓ [${inserted}] ${skill.display_name}`);
    } catch (err) {
      failed++;
      if (failed <= 5) console.error(`  ❌ ${skill.name}: ${err.message}`);
    }
  }

  await pool.end();
  console.log(`\n✅ 完成！插入 ${inserted} 个，跳过 ${skipped} 个，失败 ${failed} 个`);
}

main().catch(console.error);
