const kBufferSize = 80

export class Sample01 {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext("2d")
    this.waveA = { x: 0.0, speed: 1, length: 0.8, maxHeight: 0.5 } //波 1
    this.waveB = { x: 1.0, speed: -1.0, length: 1.2, maxHeight: 0.4 } //波 2
    this.waveC = { x: 0.4, speed: 0.4, length: 1.0, maxHeight: 0.3 } //波 3
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

  accumulateWave(wave) {
    const quarterWaveLength = 0.25 * wave.length
    const start = Math.floor((wave.x - quarterWaveLength) * kBufferSize)
    const end = Math.floor((wave.x + quarterWaveLength) * kBufferSize)

    for (let i = start; i < end; ++i) {
      let iNew = i
      if (i < 0) {
        iNew = -i - 1
      } else if (i >= kBufferSize) {
        iNew = 2 * kBufferSize - i - 1
      }

      const distance = Math.abs((i + 0.5) / kBufferSize - wave.x)
      const height =
        wave.maxHeight *
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
    const chkA = document.getElementById("toggleWaveA")
    const chkB = document.getElementById("toggleWaveB")
    const chkC = document.getElementById("toggleWaveC")
    document.getElementById("wave-check").style.opacity = "1.0"

    const loop = () => {
      this.heightField.fill(0.0)

      if (chkA.checked) {
        this.updateWave(this.timeInterval, this.waveA)
        this.accumulateWave(this.waveA)
      }
      if (chkB.checked) {
        this.updateWave(this.timeInterval, this.waveB)
        this.accumulateWave(this.waveB)
      }
      if (chkC.checked) {
        this.updateWave(this.timeInterval, this.waveC)
        this.accumulateWave(this.waveC)
      }

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
