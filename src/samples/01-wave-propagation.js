const kBufferSize = 80

export class Sample01 {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext("2d")
    this.waveX = { x: 0.0, speed: 1 } //波 1
    this.waveY = { x: 1.0, speed: -1.0 } //波 2
    this.waveLengthX = 0.8 //波長 1
    this.waveLengthY = 0 //1.2
    this.maxHeightX = 0.5 //高さ 1
    this.maxHeightY = 0 //0.4

    this.heightField = new Float64Array(kBufferSize)
    this.timeInterval = 1.0 / 60 // 60 FPS
    this.animationFrameId = null
  }

  updateWave(timeInterval, state) {
    state.x += timeInterval * state.speed
    if (state.x > 1.0) {
      state.speed *= -1.0
      state.x = 1.0 + timeInterval * state.speed
    } else if (state.x < 0.0) {
      state.speed *= -1.0
      state.x = timeInterval * state.speed
    }
  }

  accumulateWave(x, waveLength, maxHeight) {
    const quarterWaveLength = 0.25 * waveLength
    const start = Math.floor((x - quarterWaveLength) * kBufferSize)
    const end = Math.floor((x + quarterWaveLength) * kBufferSize)

    for (let i = start; i < end; ++i) {
      let iNew = i
      if (i < 0) {
        iNew = -i - 1
      } else if (i >= kBufferSize) {
        iNew = 2 * kBufferSize - i - 1
      }

      const distance = Math.abs((i + 0.5) / kBufferSize - x)
      const height =
        maxHeight *
        0.5 *
        (Math.cos(Math.min((distance * Math.PI) / quarterWaveLength, Math.PI)) +
          1.0)

      if (iNew >= 0 && iNew < kBufferSize) {
        this.heightField[iNew] += height
      }
    }
  }

  draw() {
    const { ctx, canvas, heightField } = this
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 背景のグリッドや軸を描画
    ctx.strokeStyle = "#334155"
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, canvas.height / 2)
    ctx.lineTo(canvas.width, canvas.height / 2)
    ctx.stroke()

    // 波のラインを描画
    ctx.beginPath()
    ctx.strokeStyle = "#38bdf8"
    ctx.lineWidth = 3

    const dx = canvas.width / kBufferSize
    for (let i = 0; i < kBufferSize; ++i) {
      const x = i * dx
      // 高さをCanvas座標に変換（上がマイナス、下がプラスのため反転）
      const y = canvas.height / 2 - heightField[i] * 150

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.stroke()
  }

  start() {
    const loop = () => {
      this.updateWave(this.timeInterval, this.waveX)
      this.updateWave(this.timeInterval, this.waveY)

      this.heightField.fill(0.0)
      this.accumulateWave(this.waveX.x, this.waveLengthX, this.maxHeightX)
      this.accumulateWave(this.waveY.x, this.waveLengthY, this.maxHeightY)

      this.draw()

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
