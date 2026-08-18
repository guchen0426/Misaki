import type { GameId, GameMeta, ResearchTopic } from './types';

export const researchTopics: ResearchTopic[] = [
  {
    title: '拉针救援',
    summary: '水、火、岩浆、金币、怪物被拆成几步顺序题，制造“明明很简单却总有人拉错”的冲动。',
    signal: '即时可读',
    reason: '3 秒内看懂目标和失败原因，最适合短视频投放。',
  },
  {
    title: '停车解堵',
    summary: '在拥挤车阵里拖动车辆，靠顺序规划把目标车放出去，常见于“看着就想帮他解开”的广告。',
    signal: '秩序恢复',
    reason: '拖拽反馈强，解锁路径时会带来明显爽感。',
  },
  {
    title: '画线护送',
    summary: '给小狗、国王或婴儿画线挡蜜蜂、石头和怪物，核心是临场补救与错误示范。',
    signal: '高压救援',
    reason: '失败画面夸张，用户会自然产生“换我来”的冲动。',
  },
  {
    title: '数学门跑酷',
    summary: '选加成门、乘法门或武器门，快速变强后冲进敌群，是近两年最常见的数值爽感广告模板。',
    signal: '数值增长',
    reason: '成长结果清晰，适合后续扩展成长线和排行榜。',
  },
  {
    title: '螺丝拆板',
    summary: '拆螺丝、卸木板、救出角色，通常混合排序与颜色匹配，属于新一代“解压 + 解谜”广告流派。',
    signal: '拆解快感',
    reason: '每一步都有微反馈，适合长线留存扩展。',
  },
  {
    title: '错误选择剧情',
    summary: '给落魄角色选衣服、选工具、修屋子，广告故意犯蠢制造情绪，再诱导玩家自己纠正。',
    signal: '情绪反差',
    reason: '最容易包装成角色宇宙，适合以后接剧情和关卡。',
  },
];

export const gameCatalog: GameMeta[] = [
  {
    id: 'pin-rescue',
    title: '拉针救援',
    genre: '物理解谜',
    hook: '先灭火，再放金币，最后开门，把最经典广告桥段做成无广告版本。',
    focus: '验证“顺序错误 -> 立即翻车”的广告体验是否足够上头。',
    controls: '点击红色插销',
    difficulty: '简单上手 / 高传播',
  },
  {
    id: 'parking-jam',
    title: '停车解堵',
    genre: '路径规划',
    hook: '拖动车辆清空出口，把“帮他挪一下”做成可重复试玩的关卡原型。',
    focus: '验证拖拽手感和空间规划是否能支撑更长的关卡链条。',
    controls: '拖动车辆沿车身方向滑动',
    difficulty: '中等 / 容易反复尝试',
  },
  {
    id: 'save-doge',
    title: '画线救狗',
    genre: '临场防守',
    hook: '画一条线挡住蜂群，复刻最常见的“我上我真能救下来”型广告。',
    focus: '验证画线长度限制和倒计时压迫感是否成立。',
    controls: '按住拖拽画线，松手开局',
    difficulty: '中高 / 反馈强',
  },
];

export const defaultGameId: GameId = 'pin-rescue';

export const gameMetaById = new Map<GameId, GameMeta>(
  gameCatalog.map((game) => [game.id, game]),
);
