/**
 * 13 句台词池
 *
 * 全部来自旧站的 `DynamicLine.vue`（原打字机台词池），原样搬迁 ——
 * 这些是站主自己写的句子，一个字都不该被「优化」。
 *
 * 启动序列与页脚微终端会从中随机取一句。
 */

export const QUIPS: readonly string[] = [
  '呜呜呜咕宝老婆你好可爱',
  'TypeScript 创造的世界并非完美......',
  '缺对象就 new 一个！',
  '宇宙万法的源头到底是什么？',
  '我知道你在想什么！',
  '阿噗噜派！',
  '喵喵喵喵喵？',
  '拼搏百日，我要本升专！',
  '小鹿宝快来姐姐这里（错乱',
  '你感到有邪恶的东西在看着你......',
  '斯哈斯哈，嗅嗅嗅嗅！',
  '怎么可能有人不疯，只是硬撑罢了（',
  '来线下找我玩吧！',
] as const

/** 按种子取一句 —— 用种子而非 Math.random，保证同一会话内稳定可复现 */
export function pickQuip(seed: number): string {
  const index = Math.abs(Math.floor(seed)) % QUIPS.length
  return QUIPS[index] ?? QUIPS[0] ?? ''
}
