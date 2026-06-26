/**
 * Step 1: 拉取每个 skill 的详情（skillMdContent）
 * 从 raw_top1000.json 读取 name 列表，逐个调详情接口
 *
 * 用法: node scripts/fetch-skill-details.js
 * 输出: scripts/raw_details.json
 *
 * 支持断点续跑：如果 raw_details.json 已存在，会跳过已拉取的
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const API_BASE = 'https://www.meyo123.com/api/v1/skills';
const DELAY_MS = 300;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchDetail(name) {
  const url = `${API_BASE}/${encodeURIComponent(name)}`;
  const resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const json = await resp.json();
  return json.data;
}

async function main() {
  // 读取已拉取的 skill 列表
  const rawPath = join(__dirname, 'raw_top1000.json');
  if (!existsSync(rawPath)) {
    console.error('❌ 请先执行 node scripts/fetch-skills.js 拉取基础数据');
    process.exit(1);
  }

  const skills = JSON.parse(readFileSync(rawPath, 'utf-8'));
  console.log(`📦 共 ${skills.length} 个 skill 需要拉取详情\n`);

  // 断点续跑：加载已有结果
  const outPath = join(__dirname, 'raw_details.json');
  let details = {};
  if (existsSync(outPath)) {
    details = JSON.parse(readFileSync(outPath, 'utf-8'));
    console.log(`  ↳ 已有 ${Object.keys(details).length} 个缓存，跳过\n`);
  }

  let fetched = Object.keys(details).length;
  let failed = 0;

  for (let i = 0; i < skills.length; i++) {
    const skill = skills[i];

    // 跳过已拉取的
    if (details[skill.name]) {
      continue;
    }

    try {
      const data = await fetchDetail(skill.name);
      details[skill.name] = {
        name: skill.name,
        alias: skill.alias,
        description: skill.description,
        tags: skill.tags,
        downloadCount: skill.downloadCount,
        skillMdContent: data.skillMdContent || null,
        llmAnalysisScore: data.versions?.[0]?.llmAnalysisScore || skill.llmAnalysisScore,
      };
      fetched++;

      if (fetched % 10 === 0) {
        process.stdout.write(`\r  进度: ${fetched}/${skills.length} (失败 ${failed})`);
        // 每 50 个保存一次（防止中断丢数据）
        if (fetched % 50 === 0) {
          writeFileSync(outPath, JSON.stringify(details, null, 2), 'utf-8');
        }
      }
    } catch (err) {
      failed++;
      // 重试一次
      await sleep(1000);
      try {
        const data = await fetchDetail(skill.name);
        details[skill.name] = {
          name: skill.name,
          alias: skill.alias,
          description: skill.description,
          tags: skill.tags,
          downloadCount: skill.downloadCount,
          skillMdContent: data.skillMdContent || null,
          llmAnalysisScore: data.versions?.[0]?.llmAnalysisScore || skill.llmAnalysisScore,
        };
        fetched++;
        failed--; // 重试成功
      } catch {
        console.warn(`\n  ⚠ ${skill.name}: ${err.message}`);
      }
    }

    await sleep(DELAY_MS);
  }

  // 最终保存
  writeFileSync(outPath, JSON.stringify(details, null, 2), 'utf-8');

  const withMd = Object.values(details).filter(d => d.skillMdContent).length;
  console.log(`\n\n✅ 完成! 共 ${fetched} 个详情，其中 ${withMd} 个有 Markdown 内容，${failed} 个失败`);
  console.log(`   保存到 ${outPath}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
