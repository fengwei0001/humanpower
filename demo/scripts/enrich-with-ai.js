/**
 * Step 2: 用 AI (deepseek-v4-pro) 按 content-standard 重新组织每个 skill 的名字和描述
 *
 * 用法: node scripts/enrich-with-ai.js [--limit 100]
 * 输入: scripts/raw_details.json
 * 输出: scripts/enriched_skills.json
 *
 * 支持断点续跑：已处理的不再重复调用
 * 支持 --limit N 参数：只处理前 N 个
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DELAY_MS = 2000;

// 解析 --limit 参数
const limitArg = process.argv.find(a => a.startsWith('--limit'));
const LIMIT = limitArg ? parseInt(process.argv[process.argv.indexOf(limitArg) + 1]) || Infinity : Infinity;

if (!DEEPSEEK_API_KEY) {
  console.error('❌ 请设置 DEEPSEEK_API_KEY 环境变量');
  process.exit(1);
}

const SYSTEM_PROMPT = `你是「蒸馏」技能便利店的内容编辑。你的任务是：把一个 AI Skill 的原始技术信息，重新包装成让用户一眼想装的内容。

## 什么是蒸馏物

蒸馏物是可被 Agent 执行的能力单元。用户的 Agent 拿到它之后，能直接帮用户把一件具体的事干完。
好的蒸馏物 = 一次执行干完一件具体的事 + 内含真实经验让 Agent 比裸跑强 + 名字让人一眼就知道自己需不需要。

## 名字怎么写

名字是用户决定装不装的第一判断。从用户的痛苦和收益出发，不从功能出发。

公式：「[时间/数量承诺] + [用户想完成的事]」或「[痛苦场景]？+ [解决方案]」

好名字的标准：用户扫一眼就知道「这东西能帮我干什么」「装了省多少事」。

好例子：
- 「30 分钟搞定 PRD」—— 用户知道：帮我写 PRD，还快
- 「一个人开完评审会」—— 用户知道：不用凑人，一个人搞定评审
- 「数据跌了？5分钟定位」—— 用户知道：帮我找数据下跌原因
- 「再也不返工的埋点方案」—— 用户知道：帮我搞埋点，不用返工
- 「PR 没人看？AI 帮你 Review」—— 用户知道：帮我做 Code Review

坏例子（绝对不要写成这样）：
- 「自我优化代理」—— 用户反应：？？这是啥
- 「本体知识图谱」—— 用户反应：跟我有什么关系
- 「GitHub 命令行助手」—— 用户反应：我为什么要装这个
- 「主动智能体」—— 用户反应：能帮我干嘛？
- 「天气助手」—— 用户反应：手机不能查？

## 名字的语气

像你跟同事推荐一个工具时会怎么说：「这个能让 AI 记住你的习惯」「装了以后 PR 不用求人 Review 了」。
不要写成广告语、对联、口号。不要追求对仗和押韵。就是大白话，但一句话说清楚价值。

好：「让 AI 记住你的纠正，不再重复犯错」
坏：「一次纠正，AI终身不犯」（太像广告slogan）

好：「装 Skill 前先扫一遍，别中招」
坏：「装技能前先安检，防Agent中招」（太像新闻标题）

## 描述怎么写

第一句话必须让用户感受到「这就是我需要的」。先说爽点，再说怎么做。

公式：[解决什么痛苦] + [给什么进去] + [得到什么结果]

好例子：
- 「再也不用对着空白文档发呆了。把老板那句话丢进来，出来就是能过评审的 PRD。」
- 「不用再凑齐 6 个人的时间了。PM、研发、QA、设计、运营、法务同时帮你挑刺，5 分钟出结果。」
- 「老板问'为什么这个数掉了'的时候，你不用再慌了。丢进数据，出来的是带图表的分析报告和行动建议。」

坏例子：
- 「将模糊的产品需求转化为评审就绪的 PRD，包含五章节标准文档输出。」
- 「AI技能安全审查，安装前必检，识别风险、权限及异常行为。」
- 「记录经验、错误及修正，实现持续改进。」

## 场景怎么写

让用户在脑子里能看到自己处在那个场景中。是一个具体的画面，不是抽象描述。

好：「周一早上老板扔来一句'做个XX功能'，周三要评审，你慌不慌？」
坏：「当你需要快速输出产品需求文档时」

## 步骤怎么写

像朋友教你做菜，不是教科书。3-4 步，每步有明确动作。

好：「把你脑子里那坨混沌想法倒出来，我帮你理」
坏：「澄清阶段——提取已知信息，识别信息缺口」

## 输入/输出怎么写

口语化，像跟朋友说「你把 XX 丢给它就行，出来的是 XX，直接能用」。

## 你的输出格式

仅输出以下 JSON，不要任何其他文字：
{
  "display_name": "12字以内，大白话说清楚能帮用户干嘛",
  "display_desc": "40-60字，先说爽点再说怎么做，朋友推荐语气",
  "input": "用户需要准备什么，口语化",
  "output": "用户能拿到什么具体交付物",
  "scenario": "一个画面感场景，用户能代入自己",
  "steps": ["步骤1 人话", "步骤2 人话", "步骤3 人话", "步骤4 人话"]
}`;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function callDeepSeek(userMessage) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'deepseek-v4-pro',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.3,
      max_tokens: 8192,
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
            resolve(json.choices[0].message.content || '');
          } catch (e) {
            reject(new Error(`Response parse error: ${e.message}`));
          }
        } else {
          reject(new Error(`API ${res.statusCode}: ${text.slice(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(120000, () => { req.destroy(); reject(new Error('timeout')); });
    req.write(body);
    req.end();
  });
}

function parseAIResponse(text) {
  let s = text.trim();

  // v4-pro 推理模型：跳过 </think> 之前的内容
  const thinkEnd = s.indexOf('</think>');
  if (thinkEnd >= 0) s = s.slice(thinkEnd + 8).trim();

  // 去掉 markdown 代码块包裹
  const codeMatch = s.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeMatch) s = codeMatch[1].trim();

  // 找 { ... }
  const braceStart = s.indexOf('{');
  const braceEnd = s.lastIndexOf('}');
  if (braceStart >= 0 && braceEnd > braceStart) {
    s = s.slice(braceStart, braceEnd + 1);
  }

  const obj = JSON.parse(s);

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
  let msg = `英文名: ${skill.name}
中文名: ${skill.alias || '无'}
原始描述: ${skill.description || '无'}
标签: ${(skill.tags || []).slice(0, 5).join(', ')}
下载量: ${skill.downloadCount}`;

  if (skill.skillMdContent) {
    const md = skill.skillMdContent.length > 1500
      ? skill.skillMdContent.slice(0, 1500) + '\n(截断)'
      : skill.skillMdContent;
    msg += `\n\nSKILL.md 内容:\n${md}`;
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
  const skillNames = Object.keys(details).slice(0, LIMIT);
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

      process.stdout.write(`\r  进度: ${processed}/${skillNames.length} (失败 ${failed})`);

      // 每 10 个保存一次
      if (processed % 10 === 0) {
        writeFileSync(outPath, JSON.stringify(enriched, null, 2), 'utf-8');
      }
    } catch (err) {
      failed++;
      failedList.push({ name, error: err.message });
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
