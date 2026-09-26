import { useEffect, useState } from 'react'

import { ART } from '@/art/milestones'
import { AsciiArt } from '@/components/fx/AsciiArt'
import { pickQuip } from '@/content/quips'
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

export interface BootScreenProps {
  /** 用户按下 ENTER —— 同时是解锁音频所需的用户手势 */
  onEnter: () => void
  pool?: string
}

export function BootScreen({ onEnter, pool }: BootScreenProps) {
  // 惰性初始化而非在 effect 里同步 setState（那会多触发一轮渲染）
  const [armed, setArmed] = useState(false)
  const [quip] = useState(() => pickQuip(seedFromString('with-gu-boot')))

  // 延迟一帧再「上膛」，否则 CSS 动画会在元素挂载前就排好队
  useEffect(() => {
    const id = requestAnimationFrame(() => setArmed(true))
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <section className={styles.boot} data-armed={armed} aria-label="开机序列">
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

      <p className={styles.quip}>{quip}</p>

      <button type="button" className={styles.enter} onClick={onEnter}>
        [ ENTER ]
        <span className={styles.cursor} aria-hidden="true" />
      </button>
    </section>
  )
}
