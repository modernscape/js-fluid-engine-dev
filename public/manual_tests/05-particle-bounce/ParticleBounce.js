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

    const tiltedNormal = new Vector3D(0, 0.8, 0.0).normalized()
    const plane = new Plane(tiltedNormal, new Vector3D(0, 0.5, 0))

    this.collider = new RigidBodyCollider(plane)
    this.collider.frictionCoefficient = 0.2
    this.collider.restitutionCoefficient = 0.8

    // --- 【ここを設定】最初から動く・回転する床にする場合 ---
    this.collider.linearVelocity = new Vector3D(0, 0.1, 0.3)
    this.collider.angularVelocity = new Vector3D(0.0, 0.0, 0.01)
    // --------------------------------------------------------

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

    if (this.collider && this.collider.surface) {
      const plane = this.collider.surface
      const lv = this.collider.linearVelocity
      const av = this.collider.angularVelocity

      // 1ステップあたりの移動量を足し込む（subStepsで割るか、全体のdtを使う）
      // ※ dt は subStep ごとの時間なので、1フレーム分進めるなら frame.timeIntervalInSeconds を使います
      const frameDt = frame.timeIntervalInSeconds

      // 位置の更新 (p = p + v * dt)
      plane.point.x += lv.x * frameDt
      plane.point.y += lv.y * frameDt
      plane.point.z += lv.z * frameDt

      // ※もし angularVelocity による回転も反映させたい場合はここに回転処理を入れます
      if (av.x !== 0 || av.y !== 0 || av.z !== 0) {
        const nx = plane.normal.x
        const ny = plane.normal.y
        const nz = plane.normal.z

        // 外積: rotationDelta = av × normal
        const dnx = (av.y * nz - av.z * ny) * frameDt
        const dny = (av.z * nx - av.x * nz) * frameDt
        const dnz = (av.x * ny - av.y * nx) * frameDt

        plane.normal.x += dnx
        plane.normal.y += dny
        plane.normal.z += dnz

        // 向きが変わるので必ず正規化して長さ 1.0 に保つ
        plane.normal = plane.normal.normalized
          ? plane.normal.normalized()
          : plane.normal
      }
    }

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

        // --- 修正：positions[i] と velocities[i] をオブジェクトとしてまとめて渡す ---
        const particleProxy = {
          position: positions[i],
          velocity: velocities[i],
        }

        if (this.collider.resolveCollision(particleProxy)) {
          // 衝突によって変更された位置・速度を元の配列に戻す（必要に応じて）
          positions[i] = particleProxy.position
          velocities[i] = particleProxy.velocity
        }
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

    // --- 動く床（Plane）の描画 ---
    if (this.collider && this.collider.surface) {
      const plane = this.collider.surface
      const normal = plane.normal
      const point = plane.point // 現在の床の基準点（移動を反映）

      // 画面の左右端に対応する3D上のワールド座標を計算してラインを描画する
      // 画面の左端 (x = 0) と右端 (x = width) に対応するワールドX座標を逆算
      const worldX1 = (0 - centerX) / scale
      const worldX2 = (width - centerX) / scale

      // 平面の方程式 (normal.x * (x - point.x) + normal.y * (y - point.y) + normal.z * (z - point.z) = 0) から Yを求める
      // ※ ここでは Z = 0 の断面として計算します
      const getY = (wx) => {
        if (Math.abs(normal.y) < 0.0001) return point.y // 法線がほぼ垂直な場合の保険
        return point.y - (normal.x * (wx - point.x) + normal.z * 0) / normal.y
      }

      const worldY1 = getY(worldX1)
      const worldY2 = getY(worldX2)

      // 3D座標を2D画面上のピクセル座標に変換
      const sx1 = 0
      const sy1 = centerY - worldY1 * scale
      const sx2 = width
      const sy2 = centerY - worldY2 * scale

      ctx.strokeStyle = "#66aaff" // 動く床であることがわかりやすいように少し色を変える（お好みで調整）
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(sx1, sy1)
      ctx.lineTo(sx2, sy2)
      ctx.stroke()
    }

    ctx.strokeStyle = "#333333"
    ctx.lineWidth = 1

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
