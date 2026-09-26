import { useMemo } from 'react'

import { AsciiArt } from '@/components/fx/AsciiArt'
import { EPILOGUE, TOGETHER_ANCHOR } from '@/content/timeline'
import { starfield } from '@/engine/generators'
import { seedFromString } from '@/engine/rng'
import { useElapsedDays } from '@/hooks/useElapsedDays'

import styles from './Epilogue.module.css'

export interface EpilogueProps {
  pool?: string
}

export function Epilogue({ pool }: EpilogueProps) {
  const days = useElapsedDays(TOGETHER_ANCHOR)

  // 星场是确定性的：同一块天空永远长这样。
  // 列数取 48 而非更宽 —— 它以移动端 375px 视口为上限设计，
  // 太宽会在窄屏上溢出成横向滚动条。
  const stars = useMemo(() => starfield(48, 13, seedFromString('with-gu-sky')), [])

  return (
    <section className={styles.epilogue} aria-label="尾声">
      <div className={styles.quote}>
        <AsciiArt
          id="epilogue-quote"
          art={EPILOGUE.quote}
          mode="typewriter"
          durationMs={1600}
          pool={pool}
          priority={10}
          label={EPILOGUE.quote}
        />
      </div>

      <p className={styles.closing}>{EPILOGUE.closing}</p>

      <div className={styles.stars}>
        <AsciiArt
          id="epilogue-stars"
          art={stars}
          mode="dissolve"
          durationMs={4200}
          seed={seedFromString('with-gu-stars')}
          pool={pool}
          priority={5}
          label="字符星空"
        />
      </div>

      <p className={styles.days}>
        我们已经在一起
        <span className={styles.daysValue}>{days}</span>天
      </p>
    </section>
  )
}
