/**
 * 爬取 agentskills.me 的所有 skill
 * 从每个详情页的 JSON-LD 结构化数据提取信息
 *
 * 用法: node scripts/fetch-agentskills-me.js
 * 输出: scripts/agentskills_raw.json
 *
 * 支持断点续跑
 */
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OUTPUT_PATH = join(__dirname, 'agentskills_raw.json');
const DELAY_MS = 500;

// 81 个 skill slugs（从首页提取）
const SKILL_SLUGS = [
  'ab-test-setup', 'agent-browser', 'agent-md-refactor', 'analytics-tracking',
  'audit-website', 'baoyu-article-illustrator', 'baoyu-comic', 'baoyu-cover-image',
  'baoyu-post-to-wechat', 'baoyu-post-to-x', 'baoyu-slide-deck', 'baoyu-xhs-images',
  'better-auth-best-practices', 'bibi', 'brainstorming', 'building-native-ui',
  'c4-architecture', 'codex', 'command-creator', 'commit-work',
  'competitor-alternatives', 'copy-editing', 'copywriting', 'create-auth-skill',
  'dependency-updater', 'domain-name-brainstormer', 'email-sequence', 'executing-plans',
  'expo-api-routes', 'expo-cicd-workflows', 'expo-deployment', 'expo-dev-client',
  'expo-tailwind-setup', 'feedback-mastery', 'form-cro', 'free-tool-strategy',
  'gemini', 'gepetto', 'humanizer', 'launch-strategy',
  'marketing-ideas', 'marketing-psychology', 'marp-slide', 'meme-factory',
  'mermaid-diagrams', 'naming-analyzer', 'native-data-fetching', 'onboarding-cro',
  'page-cro', 'paid-ads', 'paywall-upgrade-cro', 'plugin-forge',
  'popup-cro', 'pricing-strategy', 'programmatic-seo', 'react-dev',
  'react-native-best-practices', 'reducing-entropy', 'referral-program',
  'remotion-best-practices', 'requirements-clarity', 'schema-markup', 'seo-audit',
  'session-handoff', 'ship-learn-next', 'signup-flow-cro', 'skill-creator',
  'skill-judge', 'social-content', 'subagent-driven-development',
  'supabase-postgres-best-practices', 'systematic-debugging', 'test-driven-development',
  'ui-ux-pro-max', 'upgrading-expo', 'use-dom', 'vercel-react-best-practices',
  'verification-before-completion', 'vue-best-practices', 'web-design-guidelines',
  'writing-plans'
];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchPage(res.headers.location).then(resolve).catch(reject);
        return;
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString()));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function extractJsonLd(html) {
  // 提取 SoftwareApplication 类型的 JSON-LD
  const regex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      if (data['@type'] === 'SoftwareApplication') {
        return data;
      }
    } catch {}
  }

  // fallback: 从 inline JSON 里找
  const jsonLdMatch = html.match(/\{"@context":"https:\/\/schema\.org","@type":"SoftwareApplication"[^}]*\}/);
  if (jsonLdMatch) {
    try { return JSON.parse(jsonLdMatch[0]); } catch {}
  }

  // 再试完整 JSON 对象
  const fullMatch = html.match(/\{"@context":"https:\/\/schema\.org","@type":"SoftwareApplication"[\s\S]*?"aggregateRating":\{[^}]+\}\}/);
  if (fullMatch) {
    try { return JSON.parse(fullMatch[0]); } catch {}
  }

  return null;
}

function extractSkillContent(html) {
  // 尝试提取 skill 的 markdown 内容（通常在页面中渲染）
  // 找 pre 或 code 标签中的内容
  const codeMatch = html.match(/<code[^>]*>([\s\S]*?)<\/code>/i);
  if (codeMatch) {
    return codeMatch[1].replace(/<[^>]+>/g, '').slice(0, 2000);
  }
  return '';
}

async function main() {
  // 加载已有结果（断点续跑）
  let results = {};
  if (existsSync(OUTPUT_PATH)) {
    results = JSON.parse(readFileSync(OUTPUT_PATH, 'utf-8'));
    console.log(`📂 已有 ${Object.keys(results).length} 个结果，继续...`);
  }

  let processed = 0;
  let skipped = 0;

  for (const slug of SKILL_SLUGS) {
    if (results[slug]) {
      skipped++;
      continue;
    }

    try {
      const url = `https://agentskills.me/skill/${slug}`;
      console.log(`[${processed + skipped + 1}/${SKILL_SLUGS.length}] 拉取 ${slug}...`);

      const html = await fetchPage(url);
      const jsonLd = extractJsonLd(html);

      if (jsonLd) {
        results[slug] = {
          slug,
          name: jsonLd.name?.replace(' - Agent Skill', '').trim() || slug,
          description: jsonLd.description || '',
          author: jsonLd.author?.name || '',
          authorUrl: jsonLd.author?.url || '',
          codeRepository: jsonLd.codeRepository || '',
          downloadUrl: jsonLd.downloadUrl || '',
          rating: parseFloat(jsonLd.aggregateRating?.ratingValue) || 0,
          ratingCount: parseInt(jsonLd.aggregateRating?.ratingCount) || 0,
          sourceUrl: jsonLd.codeRepository || `https://agentskills.me/skill/${slug}`,
        };
        processed++;
        console.log(`  ✓ ${results[slug].name} (by ${results[slug].author}, ⭐${results[slug].rating})`);
      } else {
        console.log(`  ⚠️ 未找到 JSON-LD 数据`);
        results[slug] = { slug, name: slug, description: '', error: 'no json-ld' };
        processed++;
      }

      // 每 5 个保存一次
      if (processed % 5 === 0) {
        writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2));
      }

      await sleep(DELAY_MS);
    } catch (err) {
      console.error(`  ❌ ${slug}: ${err.message}`);
      results[slug] = { slug, name: slug, description: '', error: err.message };
      processed++;
    }
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2));
  console.log(`\n✅ 完成！共 ${processed} 个新拉取，${skipped} 个跳过`);
  console.log(`📁 输出: ${OUTPUT_PATH}`);
}

main().catch(console.error);
