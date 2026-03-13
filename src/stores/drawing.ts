import { defineStore } from 'pinia'

export const useDrawingStore = defineStore('drawing', () => {
  /** 上一次抽签时间 */
  let lastDrawing = localStorage.getItem('lastDrawing')
    ? new Date(localStorage.getItem('lastDrawing') as string)
    : new Date('1970-01-01')

  /**
   * 抽签记录。
   */
  function draw() {
    const degreeMap = [[''], ['大', '中', '小', '末']]
    const directionMap = ['凶', '吉']

    function getRandom(arr: unknown[], offset: number = 0) {
      const index = Math.floor(Math.random() * arr.length + offset)
      return { index: index, element: arr[index] }
    }

    lastDrawing = new Date()
    localStorage.setItem('lastDrawing', lastDrawing.toISOString())

    const direction = getRandom(directionMap, 0.6)
    return [getRandom(degreeMap[direction.index]!).element, direction.element] as [string, string]
  }

  /**
   * 判断能否抽签。
   */
  function canDraw() {
    const gap = new Date().getTime() - lastDrawing.getTime()
    if (gap / (1000 * 60 * 60) < 8) return false
    return true
  }

  return { draw, canDraw }
})
