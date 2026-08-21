import { Vector3D } from "../utils/Vector3D.js"

export default class RigidBodyCollider {
  constructor(surface) {
    this.surface = surface // Plane インスタンス
    this.linearVelocity = new Vector3D(0, 0, 0)
    this.angularVelocity = new Vector3D(0, 0, 0)
    this.frictionCoefficient = 0.1
    this.restitutionCoefficient = 0.7
  }

  // 接触位置における床の速度（並進速度 ＋ 回転による速度）を返す
  velocityAt(point) {
    const lv = this.linearVelocity || new Vector3D(0, 0, 0)
    const av = this.angularVelocity || new Vector3D(0, 0, 0)
    const pos = this.surface.point // 床の基準点

    // 回転の中心から接触位置までのベクトル (r)
    const rx = point.x - pos.x
    const ry = point.y - pos.y
    const rz = point.z - pos.z

    // 外積による回転速度の計算 (v = w × r)
    const rotationalVelocityX = av.y * rz - av.z * ry
    const rotationalVelocityY = av.z * rx - av.x * rz
    const rotationalVelocityZ = av.x * ry - av.y * rx

    return new Vector3D(
      lv.x + rotationalVelocityX,
      lv.y + rotationalVelocityY,
      lv.z + rotationalVelocityZ,
    )
  }

  // 衝突判定と解決（相対速度をベースに計算）
  resolveCollision(particle) {
    if (!this.surface.isInside(particle.position)) {
      return false
    }

    // 1. 粒子が突入した位置（衝突点）を取得
    const contactPoint = this.surface.closestPoint(particle.position)
    const normal = this.surface.normal

    // 2. その瞬間における床の表面速度を取得
    const surfaceVel = this.velocityAt(contactPoint)

    // 3. 粒子の速度から床の速度を引いた「相対速度」を計算
    const relVelX = particle.velocity.x - surfaceVel.x
    const relVelY = particle.velocity.y - surfaceVel.y
    const relVelZ = particle.velocity.z - surfaceVel.z

    // 4. 相対速度を法線方向と接線方向に分解
    const normalDotRelVel =
      relVelX * normal.x + relVelY * normal.y + relVelZ * normal.z

    // すでに床から離れる向きに動いている場合は処理しない
    if (normalDotRelVel > 0) {
      return false
    }

    const normalVelX = normalDotRelVel * normal.x
    const normalVelY = normalDotRelVel * normal.y
    const normalVelZ = normalDotRelVel * normal.z

    let tangentVelX = relVelX - normalVelX
    let tangentVelY = relVelY - normalVelY
    let tangentVelZ = relVelZ - normalVelZ

    const tangentSpeed = Math.sqrt(
      tangentVelX * tangentVelX +
        tangentVelY * tangentVelY +
        tangentVelZ * tangentVelZ,
    )

    // 5. 摩擦（タンジェント方向の減衰）の適用
    if (tangentSpeed > 0.0001) {
      const frictionImpulse = Math.max(
        1.0 -
          (this.frictionCoefficient *
            (1.0 + this.restitutionCoefficient) *
            -normalDotRelVel) /
            tangentSpeed,
        0.0,
      )
      tangentVelX *= frictionImpulse
      tangentVelY *= frictionImpulse
      tangentVelZ *= frictionImpulse
    }

    // 6. 法線方向の跳ね返り（反発係数）の適用
    const newNormalVelX = -this.restitutionCoefficient * normalVelX
    const newNormalVelY = -this.restitutionCoefficient * normalVelY
    const newNormalVelZ = -this.restitutionCoefficient * normalVelZ

    // 7. 新しい相対速度に床の速度を足し戻して、粒子の絶対速度を確定させる
    particle.velocity.x = tangentVelX + newNormalVelX + surfaceVel.x
    particle.velocity.y = tangentVelY + newNormalVelY + surfaceVel.y
    particle.velocity.z = tangentVelZ + newNormalVelZ + surfaceVel.z

    // 8. 埋まり込みの解消（位置の補正）
    const correction = this.surface.closestDistance(particle.position)
    particle.position.x -= correction * normal.x
    particle.position.y -= correction * normal.y
    particle.position.z -= correction * normal.z

    return true
  }
}
