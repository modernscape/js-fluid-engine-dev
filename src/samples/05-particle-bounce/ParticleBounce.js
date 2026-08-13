import { Vector3D } from "../../utils/Vector3D.js"
import { Frame } from "../../utils/Frame.js"
import ParticleSystemData from "./ParticleSystemData.js"
import Plane from "./Plane.js"
import RigidBodyCollider from "./RigidBodyCollider.js"

export class ParticleBounceSample {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = this.canvas.getContext("2d")
    this.animationFrameId = null
    this.frame = new Frame(0, 1.0 / 60.0)

    this.particles = null
    this.collider = null
    this.maxParticles = 600 // 画面上に存在する最大粒子数

    this.restitutionCoefficient = 0.3 // 跳ね返りを少し抑える
    this.frictionCoefficient = 0.2 // 床での摩擦
    this.dragCoefficient = 0.2 // 空気抵抗（スプレーの広がりを調整）
  }

  start() {
    this.resetSimulation()

    const loop = () => {
      this.update(this.frame)
      this.draw()
      this.frame.advance()
      this.animationFrameId = requestAnimationFrame(loop)
    }
    this.animationFrameId = requestAnimationFrame(loop)
  }

  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  resetSimulation() {
    this.frame = new Frame(0, 1.0 / 60.0)

    // 床を y = 0 に設定
    const plane = new Plane(new Vector3D(0, 1, 0), new Vector3D(0, 0, 0))
    this.collider = new RigidBodyCollider(plane)
    this.collider.frictionCoefficient = this.frictionCoefficient

    this.particles = new ParticleSystemData()
  }

  update(frame) {
    // 1. エミッター（噴水）：上限に達するまで毎フレーム新しい粒子を発生させる
    if (this.particles.numberOfParticles() < this.maxParticles) {
      const emitCount = 4 // 1フレームあたりに追加する粒子数
      for (let i = 0; i < emitCount; i++) {
        // 発生源の位置（上部の中央）
        const pos = new Vector3D(0.0, 2.5, 0.0)

        // 放射状に広がる初速度（上向き ＋ 3D空間へのランダムな広がり）
        const angle = Math.random() * Math.PI * 2
        const speed = 1.0 + Math.random() * 1.5
        const vx = Math.cos(angle) * speed * 0.6
        const vy = 3.5 + Math.random() * 1.5 // 上方向への勢い
        const vz = Math.sin(angle) * speed * 0.6

        const vel = new Vector3D(vx, vy, vz)
        this.particles.addParticle(pos, vel)
      }
    }

    // 古い粒子が多すぎてあふれた場合、先頭（古いもの）を削除する処理（必要に応じて）
    // ※ ParticleSystemData の仕様に削除メソッドがない場合はそのままでも最大数で安定します

    const subSteps = 5
    const dt = frame.timeIntervalInSeconds / subSteps

    for (let step = 0; step < subSteps; ++step) {
      this.particles.clearForces()
      const positions = this.particles.positions()
      const velocities = this.particles.velocities()
      const forces = this.particles.forces()
      const gravity = new Vector3D(0.0, -9.8, 0.0)

      for (let i = 0; i < this.particles.numberOfParticles(); ++i) {
        // 重力を加算
        forces[i] = forces[i].add(gravity)

        // 空気抵抗を加算
        if (this.dragCoefficient > 0.0) {
          forces[i] = forces[i].add(velocities[i].scale(-this.dragCoefficient))
        }

        velocities[i] = velocities[i].add(forces[i].scale(dt))
        positions[i] = positions[i].add(velocities[i].scale(dt))

        // 床（プレーン）との衝突・跳ね返り解決
        this.collider.resolveCollision(
          positions[i],
          velocities[i],
          0.04, // 粒子の半径
          this.restitutionCoefficient,
          this.collider.frictionCoefficient,
        )
      }
    }
  }

  draw() {
    const ctx = this.ctx
    const width = this.canvas.width
    const height = this.canvas.height
    ctx.fillStyle = "#111111"
    ctx.fillRect(0, 0, width, height)

    // 画面サイズに応じたスケーリング（上部から噴き出し、下部に床が来るレイアウト）
    const scale = Math.min(width, height) * 0.18
    const centerX = width * 0.5
    const centerY = height * 0.8 // 床を画面下寄りに配置

    // 床の描画
    ctx.strokeStyle = "#444444"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(width * 0, centerY)
    ctx.lineTo(width * 1, centerY)
    ctx.stroke()

    // --- 床（Plane）のグリッド可視化 ---
    ctx.strokeStyle = "#333333"
    ctx.lineWidth = 1

    // 1. 縦のライン（Canvas上端から床に向かって広がる奥行き線）
    // for (let x = -5; x <= 5; x += 1) {
    //   ctx.beginPath()
    //   // 上端側の座標（Canvasのトップ y = 0）
    //   const topX = centerX + x * scale * 0.4
    //   const topY = 0

    //   // 床側の座標（y = centerY）
    //   const bottomX = centerX + x * scale * 2.0
    //   const bottomY = centerY + 100

    //   ctx.moveTo(topX, topY)
    //   ctx.lineTo(bottomX, bottomY)
    //   ctx.stroke()
    // }

    // 床の水平ライン（基準となる線）
    // ctx.strokeStyle = "#555555"
    // ctx.lineWidth = 1.5
    // ctx.beginPath()
    // ctx.moveTo(width * 0.1, centerY)
    // ctx.lineTo(width * 0.9, centerY)
    // ctx.stroke()
    // ------------------------------------

    // すべての粒子の描画
    const positions = this.particles.positions()
    ctx.fillStyle = "#ffffff"
    for (let i = 0; i < positions.length; i++) {
      const p = positions[i]
      const sx = centerX + p.x * scale
      const sy = centerY - p.y * scale

      ctx.beginPath()
      ctx.arc(sx, sy, 2.0, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}
