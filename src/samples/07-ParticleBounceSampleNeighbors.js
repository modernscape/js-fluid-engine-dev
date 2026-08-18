import { Vector3D } from "../utils/Vector3D.js"
import { Frame } from "../utils/Frame.js"
import ParticleSystemData from "./05-particle-bounce/ParticleSystemData.js"
import Plane from "./05-particle-bounce/Plane.js"
import RigidBodyCollider from "./05-particle-bounce/RigidBodyCollider.js"

export class ParticleBounceSampleNeighbors {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = this.canvas.getContext("2d")
    this.animationFrameId = null
    this.frame = new Frame(0, 1.0 / 60.0)

    this.particles = null
    this.collider = null
    this.maxParticles = 600

    // 近傍探索パラメータ
    this.h = 0.2 // 探索半径
    this.grid = new Map()

    this.restitutionCoefficient = 0.3
    this.frictionCoefficient = 0.2
    this.dragCoefficient = 0.2
  }

  // 空間ハッシュのキー生成
  getHash(pos) {
    const ix = Math.floor(pos.x / this.h)
    const iy = Math.floor(pos.y / this.h)
    const iz = Math.floor(pos.z / this.h)
    return `${ix},${iy},${iz}`
  }

  buildGrid(positions) {
    this.grid.clear()
    for (let i = 0; i < positions.length; i++) {
      const key = this.getHash(positions[i])
      if (!this.grid.has(key)) this.grid.set(key, [])
      this.grid.get(key).push(i)
    }
  }

  // 近傍パーティクルのインデックスを取得
  getNeighbors(idx, positions) {
    const pos = positions[idx]
    const neighbors = []
    const ix = Math.floor(pos.x / this.h)
    const iy = Math.floor(pos.y / this.h)
    const iz = Math.floor(pos.z / this.h)

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const key = `${ix + dx},${iy + dy},${iz + dz}`
          if (this.grid.has(key)) {
            const cell = this.grid.get(key)
            for (const neighborIdx of cell) {
              if (neighborIdx !== idx) {
                const distSq = pos
                  .subtract(positions[neighborIdx])
                  .lengthSquared()
                if (distSq < this.h * this.h) {
                  neighbors.push(neighborIdx)
                }
              }
            }
          }
        }
      }
    }
    return neighbors
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

    this.collider.linearVelocity = new Vector3D(0.2, 0.0, 0.1)
    this.collider.angularVelocity = new Vector3D(0.01, 0.02, 0.0)

    this.particles = new ParticleSystemData()
  }

  update(frame) {
    if (this.particles.numberOfParticles() < this.maxParticles) {
      const emitCount = 4
      for (let i = 0; i < emitCount; i++) {
        const pos = new Vector3D(0.0, 2.5, 0.0)
        const angle = Math.random() * Math.PI * 2
        const speed = 1.0 + Math.random() * 1.5
        const vx = Math.cos(angle) * speed * 0.6
        const vy = 3.5 + Math.random() * 1.5
        const vz = Math.sin(angle) * speed * 0.6

        const vel = new Vector3D(vx, vy, vz)
        this.particles.addParticle(pos, vel)
      }
    }

    const subSteps = 5
    const dt = frame.timeIntervalInSeconds / subSteps
    const frameDt = frame.timeIntervalInSeconds

    if (this.collider && this.collider.surface) {
      const plane = this.collider.surface
      const lv = this.collider.linearVelocity
      const av = this.collider.angularVelocity

      plane.point.x += lv.x * frameDt
      plane.point.y += lv.y * frameDt
      plane.point.z += lv.z * frameDt

      if (av.x !== 0 || av.y !== 0 || av.z !== 0) {
        const nx = plane.normal.x
        const ny = plane.normal.y
        const nz = plane.normal.z
        const dnx = (av.y * nz - av.z * ny) * frameDt
        const dny = (av.z * nx - av.x * nz) * frameDt
        const dnz = (av.x * ny - av.y * nx) * frameDt
        plane.normal.x += dnx
        plane.normal.y += dny
        plane.normal.z += dnz
        plane.normal = plane.normal.normalized
          ? plane.normal.normalized()
          : plane.normal
      }
    }

    for (let step = 0; step < subSteps; ++step) {
      const positions = this.particles.positions()
      this.buildGrid(positions)

      this.particles.clearForces()
      const velocities = this.particles.velocities()
      const forces = this.particles.forces()
      const gravity = new Vector3D(0.0, -9.8, 0.0)

      for (let i = 0; i < this.particles.numberOfParticles(); ++i) {
        // 近傍を利用した相互作用 (例: 簡易的な反発力)
        const neighbors = this.getNeighbors(i, positions)
        for (const neighborIdx of neighbors) {
          const dir = positions[i].subtract(positions[neighborIdx])
          const dist = dir.length()
          if (dist > 0.0001) {
            forces[i] = forces[i].add(dir.scale(0.1 / dist))
          }
        }

        forces[i] = forces[i].add(gravity)
        if (this.dragCoefficient > 0.0) {
          forces[i] = forces[i].add(velocities[i].scale(-this.dragCoefficient))
        }

        velocities[i] = velocities[i].add(forces[i].scale(dt))
        positions[i] = positions[i].add(velocities[i].scale(dt))

        const particleProxy = {
          position: positions[i],
          velocity: velocities[i],
        }

        if (this.collider.resolveCollision(particleProxy)) {
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

    const scale = Math.min(width, height) * 0.18
    const centerX = width * 0.5
    const centerY = height * 0.8

    if (this.collider && this.collider.surface) {
      const plane = this.collider.surface
      const normal = plane.normal
      const point = plane.point
      const getY = (wx) => {
        if (Math.abs(normal.y) < 0.0001) return point.y
        return point.y - (normal.x * (wx - point.x) + normal.z * 0) / normal.y
      }
      const sx1 = 0
      const sy1 = centerY - getY((0 - centerX) / scale) * scale
      const sx2 = width
      const sy2 = centerY - getY((width - centerX) / scale) * scale
      ctx.strokeStyle = "#ffaa66"
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(sx1, sy1)
      ctx.lineTo(sx2, sy2)
      ctx.stroke()
    }

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
