/**
 * CRT 覆盖层
 *
 * 全部是**静态** fixed 层，且刻意不用 `backdrop-filter` 与 `filter: blur()`
 * —— 那两者会强制整层每帧重新栅格化，在低端机上直接把帧率拖垮。
 * 样式定义在全局的 styles/crt.css。
 */
export function CrtOverlay() {
  return (
    <div className="crt" aria-hidden="true">
      <div className="crt__scanlines" />
      <div className="crt__vignette" />
      <div className="crt__flicker" />
    </div>
  )
}
