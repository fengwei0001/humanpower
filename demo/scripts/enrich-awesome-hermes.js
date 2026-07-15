/**
 * 用 AI 重写 awesome-hermes-skills 的标题和描述
 *
 * 用法: DEEPSEEK_API_KEY=sk-xxx node scripts/enrich-awesome-hermes.js [--limit 50]
 * 输入: scripts/awesome_hermes_raw.json
 * 输出: scripts/awesome_hermes_enriched.json
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DELAY_MS = 1200;

const limitArg = process.argv.find(a => a.startsWith('--limit'));
const LIMIT = limitArg ? parseInt(process.argv[process.argv.indexOf(limitArg) + 1]) || Infinity : Infinity;

if (!DEEPSEEK_API_KEY) {
  console.error('❌ 请设置 DEEPSEEK_API_KEY 环境变量');
  process.exit(1);
}

const SYSTEM_PROMPT = `你是觅游技能便利店的内容编辑。把英文 AI Skill 信息重新包装成中文，让中国用户一眼想装。

## 规则
1. 名字：从用户痛点/收益出发，说人话，不超过15字
2. 描述：一句话说清楚解决什么问题，口语化，不超过50字
3. 场景：什么时候用，一句话
4. 赛道：从 pm/engineer/creator/opc 中选一个
5. 标签：3-5个中文标签

## 返回格式（严格 JSON）
{"display_name":"中文名","display_desc":"描述","scenario":"场景","track_id":"engineer","tags":["标签1","标签2","标签3"]}

## 注意
- 说人话，不要翻译体
- 不要用"一键""轻松""高效"
- 如果是纯开发工具就归 engineer，内容创作归 creator，产品/商业归 pm，独立开发归 opc`;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function callDeepSeek(userContent) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
      temperature: 0.5,
      max_tokens: 300,
    });
    const options = {
      hostname: 'api.deepseek.com', path: '/chat/completions', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_API_KEY}`, 'Content-Length': Buffer.byteLength(body) },
    };
    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const resp = Buffer.concat(chunks).toString();
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(JSON.parse(resp));
        else reject(new Error(`API ${res.statusCode}: ${resp.slice(0, 200)}`));
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  const rawPath = join(__dirname, 'awesome_hermes_raw.json');
  const outputPath = join(__dirname, 'awesome_hermes_enriched.json');

  const raw = JSON.parse(readFileSync(rawPath, 'utf-8'));
  let enriched = {};
  if (existsSync(outputPath)) {
    enriched = JSON.parse(readFileSync(outputPath, 'utf-8'));
    console.log(`📂 已有 ${Object.keys(enriched).length} 个，继续...`);
  }

  // Filter skills with description
  const valid = raw.filter(s => s.description && s.description.length > 10);
  let processed = 0;

  for (const skill of valid) {
    if (processed >= LIMIT) break;
    const key = skill.name;
    if (enriched[key]) continue;

    const userContent = `Skill: ${skill.name}\nDescription: ${skill.description}\nCategory: ${skill.category || ''}\nSource: ${skill.source_url || ''}`;

    try {
      process.stdout.write(`[${processed + 1}/${Math.min(valid.length, LIMIT)}] ${key}... `);
      const result = await callDeepSeek(userContent);
      const content = result.choices?.[0]?.message?.content || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch?.[0] || '{}');

      enriched[key] = {
        ...skill,
        display_name: parsed.display_name || skill.name,
        display_desc: parsed.display_desc || skill.description,
        scenario: parsed.scenario || '',
        track_id: parsed.track_id || 'engineer',
        tags: parsed.tags || [],
      };
      console.log(`✓ ${enriched[key].display_name}`);
      processed++;

      if (processed % 10 === 0) writeFileSync(outputPath, JSON.stringify(enriched, null, 2));
      await sleep(DELAY_MS);
    } catch (err) {
      console.log(`❌ ${err.message}`);
      enriched[key] = { ...skill, display_name: skill.name, display_desc: skill.description, track_id: 'engineer', tags: [] };
      processed++;
    }
  }

  writeFileSync(outputPath, JSON.stringify(enriched, null, 2));
  console.log(`\n✅ 完成！${processed} 个`);
}

main().catch(console.error);
