import { PhysicsAnimation } from "../utils/PhysicsAnimation.js"
import { Frame } from "../utils/Frame.js"

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

    // 床のライン
    const floorY = canvas.height - 30
    ctx.strokeStyle = "#334155"
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, floorY)
    ctx.lineTo(canvas.width, floorY)
    ctx.stroke()

    // 落下するボールを描画（半径 20px 分を上にずらして、床の上に綺麗に乗せる）
    const radius = 20
    ctx.fillStyle = "#38bdf8"
    ctx.beginPath()
    ctx.arc(canvas.width / 2, this.posY - radius, radius, 0, Math.PI * 2)
    ctx.fill()

    // 状態テキスト
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
    const loop = () => {
      this.update(this.frame)
      this.draw()
      this.frame.advance()

      if (this.frame.index > 450) {
        this.frame.index = 0
        this._currentFrame.index = -1 // 450を超えたら内部状態もリセット
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
