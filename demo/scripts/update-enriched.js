/**
 * Step 3: 将 AI 生成的 content-standard 内容写回 PostgreSQL
 *
 * 用法: DATABASE_URL=postgresql://... node scripts/update-enriched.js
 * 输入: scripts/enriched_skills.json
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

  const enrichedPath = join(__dirname, 'enriched_skills.json');
  if (!existsSync(enrichedPath)) {
    console.error('❌ 请先执行 node scripts/enrich-with-ai.js');
    process.exit(1);
  }

  const enriched = JSON.parse(readFileSync(enrichedPath, 'utf-8'));
  const names = Object.keys(enriched);
  console.log(`📦 准备更新 ${names.length} 个 skill 的内容\n`);

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: dbUrl.includes('railway') ? { rejectUnauthorized: false } : undefined,
  });

  try {
    let updated = 0;
    let skipped = 0;

    for (const name of names) {
      const data = enriched[name];
      if (!data || !data.display_name) {
        skipped++;
        continue;
      }

      const sql = `
        UPDATE skills SET
          display_name = $1,
          display_desc = $2,
          input = $3,
          output = $4,
          scenario = $5,
          steps = $6,
          updated_at = NOW()
        WHERE name = $7
      `;

      const result = await pool.query(sql, [
        data.display_name,
        data.display_desc,
        data.input || null,
        data.output || null,
        data.scenario || null,
        data.steps || [],
        name,
      ]);

      if (result.rowCount > 0) {
        updated++;
      } else {
        skipped++;
      }

      if (updated % 50 === 0) {
        process.stdout.write(`\r  进度: ${updated} 已更新, ${skipped} 跳过`);
      }
    }

    console.log(`\n\n✅ 更新完成! ${updated} 个已更新, ${skipped} 个跳过`);

    // 统计有内容的 skill
    const { rows: [{ count: withContent }] } = await pool.query(
      "SELECT COUNT(*) FROM skills WHERE display_name IS NOT NULL AND display_name != ''"
    );
    const { rows: [{ count: total }] } = await pool.query('SELECT COUNT(*) FROM skills');
    console.log(`   数据库: ${total} 个 skill, 其中 ${withContent} 个有优化内容`);

  } finally {
    await pool.end();
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
