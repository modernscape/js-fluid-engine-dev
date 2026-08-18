import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"

export class FlipDamBreakingSample {
  constructor(canvas) {
    // Canvasコンテキスト衝突回避
    const parent = canvas.parentNode
    const newCanvas = document.createElement("canvas")
    newCanvas.width = canvas.width || 800
    newCanvas.height = canvas.height || 600
    newCanvas.id = canvas.id
    newCanvas.className = canvas.className
    newCanvas.style.cssText = canvas.style.cssText

    if (parent) {
      parent.replaceChild(newCanvas, canvas)
    }

    this.canvas = newCanvas
    this.originalCanvas = canvas

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0xf5f5f5)

    this.camera = new THREE.PerspectiveCamera(
      60,
      this.canvas.clientWidth / this.canvas.clientHeight,
      0.1,
      100,
    )
    this.camera.position.set(3.8, 2.2, 3.8)

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
    })
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight)
    this.renderer.shadowMap.enabled = true

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.target.set(1.5, 0.5, 0.75)
    this.controls.update()

    // ライティング
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    this.scene.add(ambientLight)

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9)
    dirLight.position.set(5, 10, 5)
    this.scene.add(dirLight)

    // シミュレーションパラメータ (C++ テストケース準拠)[cite: 5]
    this.domainSize = { x: 3.0, y: 2.0, z: 1.5 }
    this.particles = []
    this.maxParticles = 6000 // 画像のような高密度感を再現するため粒子数を増加

    this.initSceneObjects()
    this.initParticles()

    this.isRunning = false
    this.animate = this.animate.bind(this)
  }

  initSceneObjects() {
    // 床面
    const floorGeo = new THREE.PlaneGeometry(
      this.domainSize.x,
      this.domainSize.z,
    )
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xe2e2e2,
      roughness: 0.8,
    })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.position.set(this.domainSize.x / 2, 0, this.domainSize.z / 2)
    this.scene.add(floor)

    // 3本の赤い円柱障害物 (C++ コライダー定義)[cite: 5, 7]
    const cylGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.75, 32)
    const cylMaterial = new THREE.MeshStandardMaterial({
      color: 0xd93829,
      roughness: 0.2,
    })

    const cylinderPositions = [
      { x: 1.0, y: 0.375, z: 0.375 },
      { x: 1.5, y: 0.375, z: 0.75 },
      { x: 2.0, y: 0.375, z: 1.125 },
    ]

    this.colliders = []
    cylinderPositions.forEach((pos) => {
      const cyl = new THREE.Mesh(cylGeometry, cylMaterial)
      cyl.position.set(pos.x, pos.y, pos.z)
      this.scene.add(cyl)
      this.colliders.push({
        center: new THREE.Vector3(pos.x, pos.y, pos.z),
        radius: 0.1,
        height: 0.75,
      })
    })

    // 水粒子用ポイントメッシュ
    const particleGeo = new THREE.BufferGeometry()
    const positions = new Float32Array(this.maxParticles * 3)
    particleGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3),
    )

    const particleMat = new THREE.PointsMaterial({
      color: 0x1d70b8,
      size: 0.038,
      transparent: true,
      opacity: 0.88,
    })

    this.particleMesh = new THREE.Points(particleGeo, particleMat)
    this.scene.add(this.particleMesh)
  }

  initParticles() {
    // C++のエミッターボックス定義に基づく初期粒子の高密度格子状生成[cite: 5, 6]
    const spacing = 0.038
    const lz = this.domainSize.z

    // Box 1: {0, 0, 0} to {0.5, 0.75, 0.75 * lz}[cite: 5]
    for (let x = 0.03; x < 0.5; x += spacing) {
      for (let y = 0.03; y < 0.75; y += spacing) {
        for (let z = 0.03; z < 0.75 * lz; z += spacing) {
          if (this.particles.length < this.maxParticles) {
            this.particles.push({
              pos: new THREE.Vector3(x, y, z),
              vel: new THREE.Vector3(0, 0, 0),
            })
          }
        }
      }
    }

    // Box 2: {2.5, 0, 0.25 * lz} to {3.5, 0.75, 1.5 * lz}[cite: 5]
    for (let x = 2.5; x < 3.0; x += spacing) {
      for (let y = 0.03; y < 0.75; y += spacing) {
        for (let z = 0.25 * lz; z < lz; z += spacing) {
          if (this.particles.length < this.maxParticles) {
            this.particles.push({
              pos: new THREE.Vector3(x, y, z),
              vel: new THREE.Vector3(0, 0, 0),
            })
          }
        }
      }
    }
  }

  updateSimulation() {
    const dt = 0.012 // タイムステップを少し細かくして安定性と跳ね上がりを表現
    const gravity = new THREE.Vector3(0, -9.8, 0)
    const n = this.particles.length

    // 1. 重力の適用と移動
    for (let i = 0; i < n; i++) {
      let p = this.particles[i]
      p.vel.addScaledVector(gravity, dt)
      p.pos.addScaledVector(p.vel, dt)
    }

    // 2. 圧力・非圧縮性を高めるための粒子間反発（スプラッシュを強調）
    const restDist = 0.045
    const stiffness = 160.0

    // パフォーマンスを考慮しつつ水塊の凝集感を出すため近傍反発を計算
    for (let i = 0; i < n; i++) {
      let p1 = this.particles[i]
      for (let j = i + 1; j < n; j++) {
        let p2 = this.particles[j]

        const dx = p2.pos.x - p1.pos.x
        if (Math.abs(dx) > restDist * 1.3) continue
        const dy = p2.pos.y - p1.pos.y
        if (Math.abs(dy) > restDist * 1.3) continue
        const dz = p2.pos.z - p1.pos.z
        if (Math.abs(dz) > restDist * 1.3) continue

        let dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
        if (dist < restDist && dist > 0.0001) {
          let nx = dx / dist
          let ny = dy / dist
          let nz = dz / dist
          let overlap = restDist - dist
          let force = overlap * stiffness * dt

          p1.pos.x -= nx * force * 0.5
          p1.pos.y -= ny * force * 0.5
          p1.pos.z -= nz * force * 0.5
          p2.pos.x += nx * force * 0.5
          p2.pos.y += ny * force * 0.5
          p2.pos.z += nz * force * 0.5

          // 速度のやり取り（波の伝播）
          let rvx = p2.vel.x - p1.vel.x
          let rvy = p2.vel.y - p1.vel.y
          let rvz = p2.vel.z - p1.vel.z
          let vn = rvx * nx + rvy * ny + rvz * nz
          if (vn < 0) {
            let impulse = 0.15 * vn
            p1.vel.x += nx * impulse
            p1.vel.y += ny * impulse
            p1.vel.z += nz * impulse
            p2.vel.x -= nx * impulse
            p2.vel.y -= ny * impulse
            p2.vel.z -= nz * impulse
          }
        }
      }
    }

    // 3. 境界条件・円柱コライダーとの衝突処理
    for (let i = 0; i < n; i++) {
      let p = this.particles[i]

      // 床面および壁面
      const margin = 0.02
      if (p.pos.x < margin) {
        p.pos.x = margin
        p.vel.x *= -0.25
      }
      if (p.pos.x > this.domainSize.x - margin) {
        p.pos.x = this.domainSize.x - margin
        p.vel.x *= -0.25
      }
      if (p.pos.z < margin) {
        p.pos.z = margin
        p.vel.z *= -0.25
      }
      if (p.pos.z > this.domainSize.z - margin) {
        p.pos.z = this.domainSize.z - margin
        p.vel.z *= -0.25
      }
      if (p.pos.y < margin) {
        p.pos.y = margin
        p.vel.y *= -0.15
        p.vel.x *= 0.88
        p.vel.z *= 0.88
      }

      // 3本の円柱コライダー衝突（激しいスプラッシュを発生させる）[cite: 5, 7]
      for (const cyl of this.colliders) {
        const dx = p.pos.x - cyl.center.x
        const dz = p.pos.z - cyl.center.z
        const distXZ = Math.sqrt(dx * dx + dz * dz)

        if (
          distXZ < cyl.radius + 0.025 &&
          p.pos.y >= 0 &&
          p.pos.y <= cyl.height
        ) {
          const nx = dx / (distXZ || 1)
          const nz = dz / (distXZ || 1)
          // 外側へ押し出し
          p.pos.x = cyl.center.x + (cyl.radius + 0.025) * nx
          p.pos.z = cyl.center.z + (cyl.radius + 0.025) * nz
          // 衝突エネルギーを保って上方向や周囲へ激しく跳ね返る
          const dot = p.vel.x * nx + p.vel.z * nz
          if (dot < 0) {
            p.vel.x -= 1.8 * dot * nx
            p.vel.z -= 1.8 * dot * nz
            p.vel.y += Math.abs(dot) * 0.5 // 衝突時に上方向へのベクトルを付加
          }
        }
      }
    }

    // 4. Three.js バッファの更新
    const positions = this.particleMesh.geometry.attributes.position.array
    for (let i = 0; i < n; i++) {
      positions[i * 3] = this.particles[i].pos.x
      positions[i * 3 + 1] = this.particles[i].pos.y
      positions[i * 3 + 2] = this.particles[i].pos.z
    }
    this.particleMesh.geometry.attributes.position.needsUpdate = true
  }

  start() {
    this.isRunning = true
    this.animationFrameId = requestAnimationFrame(this.animate)
  }

  animate() {
    if (!this.isRunning) return
    this.updateSimulation()
    this.controls.update()
    this.renderer.render(this.scene, this.camera)
    this.animationFrameId = requestAnimationFrame(this.animate)
  }

  stop() {
    this.isRunning = false
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
    }
    if (this.renderer) {
      this.renderer.dispose()
    }
    if (this.canvas.parentNode && this.originalCanvas) {
      this.canvas.parentNode.replaceChild(this.originalCanvas, this.canvas)
    }
  }
}
