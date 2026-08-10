// -----------------------------------------------------------------
// Frame クラス
// -----------------------------------------------------------------
class Frame {
  constructor(newIndex = 0, newTimeIntervalInSeconds = 1.0 / 60.0) {
    this.index = newIndex
    this.timeIntervalInSeconds = newTimeIntervalInSeconds
  }

  timeInSeconds() {
    return this.index * this.timeIntervalInSeconds
  }

  advance() {
    this.index++
  }
}

// -----------------------------------------------------------------
// アニメーションクラス群
// -----------------------------------------------------------------
class SineAnimation {
  constructor() {
    this.y = 0.0
  }
  update(frame) {
    this.y = Math.sin(10.0 * frame.timeInSeconds())
  }
}

class SineWithDecayAnimation {
  constructor() {
    this.y = 0.0
  }
  update(frame) {
    const decay = Math.exp(-frame.timeInSeconds())
    this.y = Math.sin(10.0 * frame.timeInSeconds()) * decay
  }
}

// -----------------------------------------------------------------
// メインのサンプルクラス (必ずこの名前でエクスポート)
// -----------------------------------------------------------------
export class SineAnimationSample {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext("2d")

    this.frame = new Frame()
    this.sineAnim = new SineAnimation()
    this.decayAnim = new SineWithDecayAnimation()

    this.maxFrames = 240
    this.historySine = []
    this.historyDecay = []

    this.animationFrameId = null
  }

  draw() {
    const { ctx, canvas } = this
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 中央の基準軸を描画
    ctx.strokeStyle = "#334155"
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, canvas.height / 2)
    ctx.lineTo(canvas.width, canvas.height / 2)
    ctx.stroke()

    const dx = canvas.width / this.maxFrames
    const centerY = canvas.height / 2

    // 1. 減衰なしサイン波の軌跡（青）
    ctx.beginPath()
    ctx.strokeStyle = "#38bdf8"
    ctx.lineWidth = 2
    for (let i = 0; i < this.historySine.length; ++i) {
      const x = i * dx
      const y = centerY - this.historySine[i] * 100
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()

    // 2. 減衰ありサイン波の軌跡（オレンジ）
    ctx.beginPath()
    ctx.strokeStyle = "#fb923c"
    ctx.lineWidth = 2
    for (let i = 0; i < this.historyDecay.length; ++i) {
      const x = i * dx
      const y = centerY - this.historyDecay[i] * 100
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }

  start() {
    const loop = () => {
      if (this.frame.index >= this.maxFrames) {
        this.frame.index = 0
        this.historySine = []
        this.historyDecay = []
      }

      this.sineAnim.update(this.frame)
      this.decayAnim.update(this.frame)

      this.historySine.push(this.sineAnim.y)
      this.historyDecay.push(this.decayAnim.y)

      this.draw()

      this.frame.advance()
      this.animationFrameId = requestAnimationFrame(loop)
    }
    loop()
  }

  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
    }
  }
}
