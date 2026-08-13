import { Vector3D } from "../../utils/Vector3D.js"

export default class RigidBodyCollider {
  constructor(surface) {
    this.surface = surface // Plane インスタンス
    this.linearVelocity = new Vector3D(0, 0, 0)
    this.angularVelocity = new Vector3D(0, 0, 0)
    this.frictionCoefficient = 0.0
  }

  velocityAt(point) {
    return new Vector3D(
      this.linearVelocity.x,
      this.linearVelocity.y,
      this.linearVelocity.z,
    )
  }

  resolveCollision(
    newPosition,
    newVelocity,
    radius,
    restitutionCoefficient,
    frictionCoefficient,
  ) {
    const closestPoint = this.surface.closestPoint(newPosition)
    const normal = this.surface.normal

    // 平面からの符号付き距離（r = newPosition - closestPoint の法線方向成分）
    const rx = newPosition.x - closestPoint.x
    const ry = newPosition.y - closestPoint.y
    const rz = newPosition.z - closestPoint.z
    const distance = rx * normal.x + ry * normal.y + rz * normal.z

    if (distance <= radius) {
      // 1. 位置の補正（表面上に押し戻す）
      const targetX = closestPoint.x + normal.x * radius
      const targetY = closestPoint.y + normal.y * radius
      const targetZ = closestPoint.z + normal.z * radius
      newPosition.x = targetX
      newPosition.y = targetY
      newPosition.z = targetZ

      // 2. 速度の相対速度計算
      const colliderVel = this.velocityAt(closestPoint)
      const relVelX = newVelocity.x - colliderVel.x
      const relVelY = newVelocity.y - colliderVel.y
      const relVelZ = newVelocity.z - colliderVel.z

      const normalDotRelVel =
        relVelX * normal.x + relVelY * normal.y + relVelZ * normal.z

      if (normalDotRelVel < 0.0) {
        // 法線方向の反発
        const normalVelX = normal.x * normalDotRelVel
        const normalVelY = normal.y * normalDotRelVel
        const normalVelZ = normal.z * normalDotRelVel

        let tangentVelX = relVelX - normalVelX
        let tangentVelY = relVelY - normalVelY
        let tangentVelZ = relVelZ - normalVelZ

        // 法線方向の速度を反発係数倍して反転
        const reflectedNormalVelX = normalVelX * -restitutionCoefficient
        const reflectedNormalVelY = normalVelY * -restitutionCoefficient
        const reflectedNormalVelZ = normalVelZ * -restitutionCoefficient

        // 接線方向の摩擦
        if (frictionCoefficient > 0.0) {
          const tangentSpeed = Math.sqrt(
            tangentVelX * tangentVelX +
              tangentVelY * tangentVelY +
              tangentVelZ * tangentVelZ,
          )
          if (tangentSpeed > 0.0) {
            const frictionImpulse = Math.max(
              1.0 -
                (frictionCoefficient *
                  (1.0 + restitutionCoefficient) *
                  -normalDotRelVel) /
                  tangentSpeed,
              0.0,
            )
            tangentVelX *= frictionImpulse
            tangentVelY *= frictionImpulse
            tangentVelZ *= frictionImpulse
          }
        }

        const finalVelX = reflectedNormalVelX + tangentVelX + colliderVel.x
        const finalVelY = reflectedNormalVelY + tangentVelY + colliderVel.y
        const finalVelZ = reflectedNormalVelZ + tangentVelZ + colliderVel.z

        newVelocity.x = finalVelX
        newVelocity.y = finalVelY
        newVelocity.z = finalVelZ
      }
    }
  }
}
