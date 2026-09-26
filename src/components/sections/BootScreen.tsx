import { useEffect, useState } from 'react'

import { ART } from '@/art/milestones'
import { AsciiArt } from '@/components/fx/AsciiArt'
import { seedFromString } from '@/engine/rng'

import styles from './BootScreen.module.css'

/** 开机自检日志 —— 逐行滚出，是整站的第一个画面 */
const BOOT_LOG = [
  ['WITH-GU BIOS v2.6.3', 'OK'],
  ['MEMORY CHECK 640K', 'OK'],
  ['LOADING with-gu.kernel', 'OK'],
  ['MOUNTING /dev/heart', 'OK'],
  ['SCANNING ROOM FOR PEOPLE', '1 FOUND'],
  ['CALIBRATING PHOSPHOR', 'OK'],
] as const

/** 每行自检之间的间隔 */
const LINE_STEP_MS = 500

/** 日志滚完到 START 交出来之间，再留一口气 */
const SETTLE_MS = 400

/**
 * 开机序列的**全部时长**，也是 START 交出来的时刻。
 *
 * 老机器开机就是要有这段等待 —— 一按就进只说明这是网页。
 * 但也不能让人等出「是不是卡住了」的念头，所以停在 3~4 秒。
 *
 * 这个数同时喂给 CSS（决定 START 何时出现）和 JS（决定何时把
 * `data-boot-state` 翻成 ready），**只能有一处定义**，否则两边迟早漂开。
 */
const TOTAL_MS = BOOT_LOG.length * LINE_STEP_MS + SETTLE_MS

export interface BootScreenProps {
  /** 用户按下 START —— 同时是解锁音频所需的用户手势 */
  onEnter: () => void
  pool?: string
}

export function BootScreen({ onEnter, pool }: BootScreenProps) {
  // 惰性初始化而非在 effect 里同步 setState（那会多触发一轮渲染）
  const [armed, setArmed] = useState(false)
  const [ready, setReady] = useState(false)

  // 延迟一帧再「上膛」，否则 CSS 动画会在元素挂载前就排好队
  useEffect(() => {
    const id = requestAnimationFrame(() => setArmed(true))
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <section
      className={styles.boot}
      data-armed={armed}
      data-boot-state={ready ? 'ready' : 'loading'}
      aria-label="开机序列"
      style={
        {
          '--boot-line-step': `${LINE_STEP_MS}ms`,
          '--boot-total': `${TOTAL_MS}ms`,
        } as React.CSSProperties
      }
    >
      <div className={styles.log} role="log" aria-label="开机自检日志">
        {BOOT_LOG.map(([label, status], index) => (
          <span
            key={label}
            className={styles.logLine}
            style={{ '--line-index': index } as React.CSSProperties}
          >
            {label}
            <span className={styles.ok}>
              {' '}
              {'.'.repeat(Math.max(2, 42 - label.length))} {status}
            </span>
          </span>
        ))}
      </div>

      <AsciiArt
        id="boot-logo"
        art={ART.bootLogo}
        mode="dissolve"
        durationMs={2600}
        seed={seedFromString('with-gu-logo')}
        pool={pool}
        priority={1000}
        label="咕鹿小屋 GuLu Nest"
      />

      <button
        type="button"
        className={styles.enter}
        onClick={onEnter}
        /* START 交出来的时刻由 CSS 动画决定（它才是那个时间轴的持有者）。
           用事件而不是再起一个 JS 定时器：那等于把同一个时刻算两遍，
           而两遍迟早会不一样。 */
        onAnimationEnd={(event) => {
          // 按钮里那个光标也在跑动画，但它不会结束（infinite）——
          // 真冒泡上来的话也不该算数
          if (event.target !== event.currentTarget) return
          setReady(true)
        }}
      >
        [ START ]
        <span className={styles.cursor} aria-hidden="true" />
      </button>
    </section>
  )
}
