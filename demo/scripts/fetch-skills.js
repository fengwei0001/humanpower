/**
 * 从觅游 API 拉取 Top 1000 个 Skill（按下载量降序）
 * 用法: node scripts/fetch-skills.js
 */
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const API_BASE = 'https://www.meyo123.com/api/v1/skills';
const PAGE_SIZE = 50;
const TOTAL_PAGES = 20; // 20 × 50 = 1000
const DELAY_MS = 300;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchPage(page) {
  const url = `${API_BASE}?page=${page}&pageSize=${PAGE_SIZE}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`HTTP ${resp.status} on page ${page}`);
  const json = await resp.json();
  return json.data;
}

async function main() {
  console.log('🚀 开始拉取觅游 Top 1000 Skills...\n');

  const allSkills = [];

  for (let page = 1; page <= TOTAL_PAGES; page++) {
    try {
      const data = await fetchPage(page);
      allSkills.push(...data.list);
      console.log(`  ✓ page ${page}/${TOTAL_PAGES}: got ${data.list.length} skills, total ${allSkills.length}/${data.total}`);

      if (page < TOTAL_PAGES) await sleep(DELAY_MS);
    } catch (err) {
      console.error(`  ✗ page ${page} failed: ${err.message}`);
      // 重试一次
      await sleep(1000);
      try {
        const data = await fetchPage(page);
        allSkills.push(...data.list);
        console.log(`  ✓ page ${page} retry OK: ${data.list.length} skills`);
      } catch (err2) {
        console.error(`  ✗ page ${page} retry failed, skipping: ${err2.message}`);
      }
    }
  }

  const outPath = join(__dirname, 'raw_top1000.json');
  writeFileSync(outPath, JSON.stringify(allSkills, null, 2), 'utf-8');
  console.log(`\n✅ 完成! 共 ${allSkills.length} 个 skill 保存到 ${outPath}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
