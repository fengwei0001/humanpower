/**
 * 用 AI (deepseek) 重写 agentskills.me 爬取的 skill 标题和描述
 *
 * 用法: DEEPSEEK_API_KEY=sk-xxx node scripts/enrich-agentskills.js [--limit 20]
 * 输入: scripts/agentskills_raw.json
 * 输出: scripts/agentskills_enriched.json
 *
 * 支持断点续跑
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DELAY_MS = 1500;

const limitArg = process.argv.find(a => a.startsWith('--limit'));
const LIMIT = limitArg ? parseInt(process.argv[process.argv.indexOf(limitArg) + 1]) || Infinity : Infinity;

if (!DEEPSEEK_API_KEY) {
  console.error('❌ 请设置 DEEPSEEK_API_KEY 环境变量');
  process.exit(1);
}

const SYSTEM_PROMPT = `你是觅游技能便利店的内容编辑。把英文 AI Skill 的信息重新包装成中文，让中国用户一眼想装。

## 规则

1. 名字：从用户痛点/收益出发，说人话，不超过15字。比如 "brainstorming" → "别急着做功能，先想清楚问题"
2. 描述：一句话说清楚这个 skill 帮用户解决什么具体问题，口语化，像朋友推荐。不超过50字。
3. 场景：什么时候用，一句话描述一个具体场景。
4. 赛道：从 pm/engineer/creator/opc 中选一个最匹配的。大部分是 engineer。
5. 标签：3-5个中文标签，逗号分隔。

## 返回格式（严格 JSON）
{
  "display_name": "中文名字",
  "display_desc": "中文描述",
  "scenario": "场景描述",
  "track_id": "engineer",
  "tags": ["标签1", "标签2", "标签3"]
}

## 注意
- 不要翻译体，要人话
- 不要用"一键""轻松""高效"这类烂大街的词
- 名字要让人有共鸣，最好有画面感或痛点感`;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function callDeepSeek(userContent) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
      temperature: 0.5,
      max_tokens: 500,
    });

    const options = {
      hostname: 'api.deepseek.com',
      path: '/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const resp = Buffer.concat(chunks).toString();
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(resp));
        } else {
          reject(new Error(`API ${res.statusCode}: ${resp.slice(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  const rawPath = join(__dirname, 'agentskills_raw.json');
  const outputPath = join(__dirname, 'agentskills_enriched.json');

  const raw = JSON.parse(readFileSync(rawPath, 'utf-8'));
  let enriched = {};
  if (existsSync(outputPath)) {
    enriched = JSON.parse(readFileSync(outputPath, 'utf-8'));
    console.log(`📂 已有 ${Object.keys(enriched).length} 个结果，继续...`);
  }

  const slugs = Object.keys(raw).filter(k => raw[k].description && !raw[k].error);
  let processed = 0;

  for (const slug of slugs) {
    if (processed >= LIMIT) break;
    if (enriched[slug]) continue;

    const skill = raw[slug];
    const userContent = `Skill 名称: ${skill.name}\n描述 (英文): ${skill.description}\n作者: ${skill.author}\n源码: ${skill.codeRepository}`;

    try {
      console.log(`[${processed + 1}/${Math.min(slugs.length, LIMIT)}] ${slug}...`);
      const result = await callDeepSeek(userContent);
      const content = result.choices?.[0]?.message?.content || '';

      // 解析 JSON
      const jsonMatch = content.match(/```json\s*\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch?.[1] || jsonMatch?.[0] || '';
      const parsed = JSON.parse(jsonStr);

      enriched[slug] = {
        ...skill,
        display_name: parsed.display_name || skill.name,
        display_desc: parsed.display_desc || skill.description,
        scenario: parsed.scenario || '',
        track_id: parsed.track_id || 'engineer',
        tags: parsed.tags || [],
      };

      console.log(`  ✓ ${enriched[slug].display_name}`);
      processed++;

      if (processed % 5 === 0) {
        writeFileSync(outputPath, JSON.stringify(enriched, null, 2));
      }

      await sleep(DELAY_MS);
    } catch (err) {
      console.error(`  ❌ ${slug}: ${err.message}`);
      // 保留原始数据，跳过
      enriched[slug] = { ...skill, display_name: skill.name, display_desc: skill.description, track_id: 'engineer', tags: [] };
      processed++;
    }
  }

  writeFileSync(outputPath, JSON.stringify(enriched, null, 2));
  console.log(`\n✅ 完成！${processed} 个处理完毕`);
  console.log(`📁 输出: ${outputPath}`);
}

main().catch(console.error);
