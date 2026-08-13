import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { Vector3D } from "../../utils/Vector3D.js"
import { Frame } from "../../utils/Frame.js"
import ParticleSystemData from "../05-particle-bounce/ParticleSystemData.js"
import Plane from "../05-particle-bounce/Plane.js"
import RigidBodyCollider from "../05-particle-bounce/RigidBodyCollider.js"

export class ParticleBounceThreeSample {
  constructor(canvas) {
    this.canvas = canvas
    this.frame = new Frame(0, 1.0 / 60.0)
    this.particles = new ParticleSystemData()
    this.maxParticles = 600

    // Three.js シーンのセットアップ
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(
      75,
      canvas.width / canvas.height,
      0.1,
      1000,
    )
    this.camera.position.set(0, 2, 5)

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)

    // 粒子用のポイントクラウド
    const geo = new THREE.BufferGeometry()
    const posAttr = new THREE.BufferAttribute(
      new Float32Array(this.maxParticles * 3),
      3,
    )

    geo.setAttribute("position", posAttr)
    this.points = new THREE.Points(
      geo,
      new THREE.PointsMaterial({ size: 0.05, color: 0xffffff }),
    )
    this.scene.add(this.points)

    this.planeGroup = new THREE.Group()

    // 1. 床のメッシュ（PlaneGeometry を使わず、もし板の色が必要なら GridHelper の下に敷く）
    this.planeMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 10),
      new THREE.MeshBasicMaterial({
        color: 0xff2244,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
      }),
    )
    // 回転させて水平にする
    this.planeMesh.rotation.x = -Math.PI / 2
    this.planeGroup.add(this.planeMesh)
    this.scene.add(this.planeGroup)

    this.resetSimulation()
  }

  resetSimulation() {
    const tiltedNormal = new Vector3D(0, 0.8, 0.0).normalized()
    const plane = new Plane(tiltedNormal, new Vector3D(0, 0.5, 0))
    this.collider = new RigidBodyCollider(plane)
    this.collider.linearVelocity = new Vector3D(0, 0.1, 0.3)
    this.collider.angularVelocity = new Vector3D(0.02, 0.01, 0.01)
  }

  update(frame) {
    // 物理シミュレーションのロジック (05と共通)
    // ※ 衝突計算後に this.planeMesh の更新を行う必要があります

    // ... (05の物理更新処理を記述) ...

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

    // Three.js へのデータ同期
    const positions = this.particles.positions()
    const attr = this.points.geometry.attributes.position
    for (let i = 0; i < positions.length; i++) {
      attr.setXYZ(i, positions[i].x, positions[i].y, positions[i].z)
    }
    attr.needsUpdate = true

    // 床の描画更新
    const surface = this.collider.surface
    this.planeMesh.position.set(
      surface.point.x,
      surface.point.y,
      surface.point.z,
    )
    this.planeMesh.lookAt(
      surface.point.x + surface.normal.x,
      surface.point.y + surface.normal.y,
      surface.point.z + surface.normal.z,
    )
  }

  start() {
    const loop = () => {
      this.update(this.frame)
      this.controls.update()
      this.renderer.render(this.scene, this.camera)
      this.frame.advance()
      requestAnimationFrame(loop)
    }
    requestAnimationFrame(loop)
  }
}
