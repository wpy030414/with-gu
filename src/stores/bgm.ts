import { defineStore } from 'pinia'

export const useBGMStore = defineStore('bgm', () => {
  /** 流媒体供应商 */
  const vendor = {
    getNeteaseUnit: (id: string) => {
      return `//music.163.com/song/media/outer/url?id=${id}.mp3`
    },
  }

  /** 播放器 DOM */
  const player = document.querySelector('#player') as HTMLAudioElement

  /**
   * 设置背景音乐。
   *
   * @param url 链接
   */
  function setBGM(url: string) {
    if (player) player.src = url
  }

  /**
   * 播放或暂停 BGM。
   *
   * @param force 强制指定
   */
  function playOrPause(force?: 'play' | 'pause') {
    if (player)
      switch (force) {
        case 'play':
          player.play()
          break
        case 'pause':
          player.pause()
          break
        default:
          if (player.paused) player.play()
          else player.pause()
      }
  }

  return { vendor, setBGM, playOrPause }
})
