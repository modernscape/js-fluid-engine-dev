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
    this.trajectory = []

    this.restitutionCoefficient = 0.5
    this.frictionCoefficient = 0.0
    this.dragCoefficient = 0.0
  }

  start() {
    this.resetSimulation()

    // ループ処理
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
    this.trajectory = []
    const plane = new Plane(new Vector3D(0, 1, 0), new Vector3D(0, 0, 0))
    this.collider = new RigidBodyCollider(plane)
    this.collider.frictionCoefficient = this.frictionCoefficient

    this.particles = new ParticleSystemData()
    this.particles.addParticle(
      new Vector3D(0.0, 3.0, 0.0),
      new Vector3D(1.0, 0.0, 0.0),
    )
  }

  update(frame) {
    const subSteps = 5
    const dt = frame.timeIntervalInSeconds / subSteps

    for (let step = 0; step < subSteps; ++step) {
      this.particles.clearForces()
      const positions = this.particles.positions()
      const velocities = this.particles.velocities()
      const forces = this.particles.forces()
      const gravity = new Vector3D(0.0, -9.8, 0.0)

      for (let i = 0; i < this.particles.numberOfParticles(); ++i) {
        forces[i] = forces[i].add(gravity)
        if (this.dragCoefficient > 0.0) {
          forces[i] = forces[i].add(velocities[i].scale(-this.dragCoefficient))
        }

        velocities[i] = velocities[i].add(forces[i].scale(dt))
        positions[i] = positions[i].add(velocities[i].scale(dt))

        this.collider.resolveCollision(
          positions[i],
          velocities[i],
          0.05,
          this.restitutionCoefficient,
          this.collider.frictionCoefficient,
        )
      }
    }

    if (this.particles.numberOfParticles() > 0) {
      const p = this.particles.positions()[0]
      this.trajectory.push({ x: p.x, y: p.y })
      if (this.trajectory.length > 500) this.trajectory.shift()
    }
  }

  draw() {
    const ctx = this.ctx
    const width = this.canvas.width
    const height = this.canvas.height
    ctx.fillStyle = "#111111"
    ctx.fillRect(0, 0, width, height)

    const scale = 80
    const centerX = 150
    const centerY = 320

    // 軌跡
    ctx.strokeStyle = "rgba(242, 81, 0, 0.4)"
    ctx.lineWidth = 2
    ctx.beginPath()
    for (let i = 0; i < this.trajectory.length; i++) {
      const pt = this.trajectory[i]
      const sx = centerX + pt.x * scale
      const sy = centerY - pt.y * scale
      i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy)
    }
    ctx.stroke()

    // パーティクル
    if (this.particles.numberOfParticles() > 0) {
      const p = this.particles.positions()[0]
      ctx.fillStyle = "#fda6ff"
      ctx.beginPath()
      ctx.arc(centerX + p.x * scale, centerY - p.y * scale, 6, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}
