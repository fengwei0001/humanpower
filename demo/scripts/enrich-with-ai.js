/**
 * Step 2: 用 AI 按 content-standard 重新组织每个 skill 的名字和描述
 *
 * 用法: DEEPSEEK_API_KEY=sk-xxx node scripts/enrich-with-ai.js
 * 输入: scripts/raw_details.json
 * 输出: scripts/enriched_skills.json
 *
 * 支持断点续跑：已处理的不再重复调用
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DELAY_MS = 1500; // DeepSeek rate limit friendly

if (!DEEPSEEK_API_KEY) {
  console.error('❌ 请设置 DEEPSEEK_API_KEY 环境变量');
  process.exit(1);
}

const SYSTEM_PROMPT = `你是技能便利店的内容编辑。根据以下 AI Skill 的原始信息（包括完整的 SKILL.md 源码），按照「蒸馏内容标准」重新生成结构化描述。

## 命名规则
- 公式：[时间/数量承诺] + [用户想完成的事] 或 [痛苦场景]？+ [解决方案]
- 从用户的痛苦出发，不从功能出发
- 好例子：「30 分钟搞定 PRD」「数据跌了？5分钟定位」「一个人开完评审会」
- 坏例子：「PRD 结构化写作工具」「数据分析报告生成」「多角色评审模拟器」
- 如果原始名字已经很好，可以保留或微调

## 描述规则
- 第一句必须让用户感受到「这就是我需要的」
- 公式：[解决什么痛苦] + [给什么进去] + [得到什么结果]
- 语气像朋友推荐，不是产品说明书
- 50 字以内

## input/output 规则
- 用口语化描述，像跟朋友解释
- input: 用户需要准备什么
- output: 用户能得到什么具体交付物

## scenario 规则
- 画面感，让用户脑子里能看到自己处在那个场景
- 好例子：「周一早上老板扔来一句'做个XX功能'，周三要评审，你慌不慌？」

## steps 规则
- 3-5 步，像朋友教你做菜
- 人话，不是术语
- 每步都有明确的动作和产出

## 输出要求
仅输出 JSON，不要其他文字：
{
  "display_name": "新名字（中文，15字以内）",
  "display_desc": "新描述（中文，50字以内）",
  "input": "输入描述",
  "output": "输出描述",
  "scenario": "场景描述",
  "steps": ["步骤1", "步骤2", "步骤3", "步骤4"]
}`;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function callDeepSeek(userMessage) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.4,
      max_tokens: 800,
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
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString();
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const json = JSON.parse(text);
            resolve(json.choices[0].message.content);
          } catch (e) {
            reject(new Error(`Parse error: ${e.message}`));
          }
        } else {
          reject(new Error(`API ${res.statusCode}: ${text.slice(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('timeout')); });
    req.write(body);
    req.end();
  });
}

function parseAIResponse(text) {
  // 尝试提取 JSON（AI 可能包裹在 ```json ... ``` 中）
  let jsonStr = text;
  const match = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (match) jsonStr = match[1];

  // 也尝试直接找 { ... }
  if (!jsonStr.startsWith('{')) {
    const braceMatch = text.match(/\{[\s\S]*\}/);
    if (braceMatch) jsonStr = braceMatch[0];
  }

  const obj = JSON.parse(jsonStr);

  // 校验必要字段
  if (!obj.display_name || !obj.display_desc) {
    throw new Error('Missing required fields');
  }

  return {
    display_name: obj.display_name,
    display_desc: obj.display_desc,
    input: obj.input || null,
    output: obj.output || null,
    scenario: obj.scenario || null,
    steps: Array.isArray(obj.steps) ? obj.steps : [],
  };
}

function buildUserMessage(skill) {
  let msg = `## Skill 信息
- 英文名: ${skill.name}
- 中文名: ${skill.alias || '无'}
- 原始描述: ${skill.description || '无'}
- 标签: ${(skill.tags || []).join(', ')}
- 下载量: ${skill.downloadCount}
`;

  if (skill.skillMdContent) {
    // 截取前 3000 字符（太长会超 token）
    const md = skill.skillMdContent.length > 3000
      ? skill.skillMdContent.slice(0, 3000) + '\n... (内容过长已截断)'
      : skill.skillMdContent;
    msg += `\n## SKILL.md 源码\n\`\`\`\n${md}\n\`\`\``;
  }

  return msg;
}

async function main() {
  const detailsPath = join(__dirname, 'raw_details.json');
  if (!existsSync(detailsPath)) {
    console.error('❌ 请先执行 node scripts/fetch-skill-details.js');
    process.exit(1);
  }

  const details = JSON.parse(readFileSync(detailsPath, 'utf-8'));
  const skillNames = Object.keys(details);
  console.log(`📦 共 ${skillNames.length} 个 skill 需要 AI 处理\n`);

  // 断点续跑
  const outPath = join(__dirname, 'enriched_skills.json');
  let enriched = {};
  if (existsSync(outPath)) {
    enriched = JSON.parse(readFileSync(outPath, 'utf-8'));
    console.log(`  ↳ 已有 ${Object.keys(enriched).length} 个缓存，跳过\n`);
  }

  let processed = Object.keys(enriched).length;
  let failed = 0;
  const failedList = [];

  for (const name of skillNames) {
    if (enriched[name]) continue;

    const skill = details[name];
    const userMsg = buildUserMessage(skill);

    try {
      const aiResp = await callDeepSeek(userMsg);
      const result = parseAIResponse(aiResp);
      enriched[name] = result;
      processed++;

      if (processed % 5 === 0) {
        process.stdout.write(`\r  进度: ${processed}/${skillNames.length} (失败 ${failed})`);
      }

      // 每 20 个保存一次
      if (processed % 20 === 0) {
        writeFileSync(outPath, JSON.stringify(enriched, null, 2), 'utf-8');
      }
    } catch (err) {
      failed++;
      failedList.push({ name, error: err.message });
      if (failed % 10 === 0) {
        console.warn(`\n  ⚠ 已失败 ${failed} 个，最近: ${name}: ${err.message}`);
      }
    }

    await sleep(DELAY_MS);
  }

  // 最终保存
  writeFileSync(outPath, JSON.stringify(enriched, null, 2), 'utf-8');

  if (failedList.length > 0) {
    writeFileSync(join(__dirname, 'enrich_failed.json'), JSON.stringify(failedList, null, 2), 'utf-8');
  }

  console.log(`\n\n✅ AI 处理完成! 成功 ${processed} 个，失败 ${failed} 个`);
  console.log(`   保存到 ${outPath}`);
  if (failed > 0) {
    console.log(`   失败列表: scripts/enrich_failed.json`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
