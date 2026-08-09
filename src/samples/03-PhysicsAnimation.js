// -----------------------------------------------------------------
// 1. Frame クラス
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
// 2. Timer クラス
// -----------------------------------------------------------------
class Timer {
  constructor() {
    this.reset()
  }
  durationInSeconds() {
    return (performance.now() - this._startingPoint) / 1000.0
  }
  reset() {
    this._startingPoint = performance.now()
  }
}

// -----------------------------------------------------------------
// 3. Animation 基底クラス
// -----------------------------------------------------------------
class Animation {
  update(frame) {
    this.onUpdate(frame)
  }
  onUpdate(frame) {
    throw new Error("onUpdate must be overridden")
  }
}

// -----------------------------------------------------------------
// 4. PhysicsAnimation クラス (サブステップ制御のコア)
// -----------------------------------------------------------------
class PhysicsAnimation extends Animation {
  constructor() {
    super()
    this._currentFrame = new Frame()
    this._currentFrame.index = -1
    this._currentTime = 0.0
    this._isUsingFixedSubTimeSteps = true
    this._numberOfFixedSubTimeSteps = 5
  }

  currentFrame() {
    return this._currentFrame
  }

  currentTimeInSeconds() {
    return this._currentTime
  }

  isUsingFixedSubTimeSteps() {
    return this._isUsingFixedSubTimeSteps
  }
  setIsUsingFixedSubTimeSteps(isUsing) {
    this._isUsingFixedSubTimeSteps = isUsing
  }

  numberOfFixedSubTimeSteps() {
    return this._numberOfFixedSubTimeSteps
  }
  setNumberOfFixedSubTimeSteps(numberOfSteps) {
    this._numberOfFixedSubTimeSteps = numberOfSteps
  }

  onUpdate(frame) {
    if (frame.index > this._currentFrame.index) {
      if (this._currentFrame.index < 0) {
        this.initialize()
      }

      const numberOfFrames = frame.index - this._currentFrame.index
      for (let i = 0; i < numberOfFrames; ++i) {
        this.advanceTimeStep(frame.timeIntervalInSeconds)
      }

      // ★修正: 参照ではなく新しいインスタンスとして値をコピーする
      this._currentFrame = new Frame(frame.index, frame.timeIntervalInSeconds)
    }
  }

  advanceTimeStep(timeIntervalInSeconds) {
    this._currentTime = this._currentFrame.timeInSeconds()

    if (this._isUsingFixedSubTimeSteps) {
      const actualTimeInterval =
        timeIntervalInSeconds / this._numberOfFixedSubTimeSteps

      for (let i = 0; i < this._numberOfFixedSubTimeSteps; ++i) {
        const timer = new Timer()

        this.onAdvanceTimeStep(actualTimeInterval)

        const elapsed = timer.durationInSeconds()
        this._currentTime += actualTimeInterval
      }
    }
  }

  initialize() {
    this.onInitialize()
  }

  onInitialize() {}
  onAdvanceTimeStep(timeIntervalInSeconds) {}
}

// -----------------------------------------------------------------
// 5. メインのサンプルクラス
// -----------------------------------------------------------------
export class PhysicsAnimationSample extends PhysicsAnimation {
  constructor(canvas) {
    super()
    this.canvas = canvas
    this.ctx = canvas.getContext("2d")

    this.frame = new Frame()
    this.setNumberOfFixedSubTimeSteps(8)

    this.posY = 50.0
    this.velocity = 0.0
    this.gravity = 400.0

    this.animationFrameId = null
  }

  onAdvanceTimeStep(timeIntervalInSeconds) {
    this.velocity += this.gravity * timeIntervalInSeconds
    this.posY += this.velocity * timeIntervalInSeconds

    if (this.posY > this.canvas.height - 30) {
      this.posY = this.canvas.height - 30
      this.velocity = -this.velocity * 0.7
    }
  }

  draw() {
    const { ctx, canvas } = this
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.strokeStyle = "#334155"
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, canvas.height - 30)
    ctx.lineTo(canvas.width, canvas.height - 30)
    ctx.stroke()

    ctx.fillStyle = "#38bdf8"
    ctx.beginPath()
    ctx.arc(canvas.width / 2, this.posY, 20, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = "#94a3b8"
    ctx.font = "14px sans-serif"
    ctx.fillText(`Time: ${this.currentTimeInSeconds().toFixed(2)} s`, 20, 30)
    ctx.fillText(
      `Sub-steps: ${this.numberOfFixedSubTimeSteps()} / frame`,
      20,
      55,
    )
  }

  start() {
    document.getElementById("wave-check").style.opacity = "0.0"
    const loop = () => {
      this.update(this.frame)
      this.draw()
      this.frame.advance()

      if (this.frame.index > 300) {
        this.frame.index = 0
        this.posY = 50.0
        this.velocity = 0.0
      }

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
