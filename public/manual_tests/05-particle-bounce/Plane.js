import { Vector3D } from "../utils/Vector3D.js"

export default class Plane {
  constructor(normal = new Vector3D(0, 1, 0), point = new Vector3D(0, 0, 0)) {
    this.normal = normal.normalized ? normal.normalized() : normal
    this.point = point
  }

  // 点から平面までの最短距離を計算
  closestDistance(otherPoint) {
    // Vector3D の減算と内積の呼び出し方を確認
    const rX = otherPoint.x - this.point.x
    const rY = otherPoint.y - this.point.y
    const rZ = otherPoint.z - this.point.z

    return rX * this.normal.x + rY * this.normal.y + rZ * this.normal.z
  }

  // 平面上における指定点に最も近い点を計算
  closestPoint(otherPoint) {
    const dist = this.closestDistance(otherPoint)
    return new Vector3D(
      otherPoint.x - this.normal.x * dist,
      otherPoint.y - this.normal.y * dist,
      otherPoint.z - this.normal.z * dist,
    )
  }

  isInside(otherPoint) {
    return this.closestDistance(otherPoint) <= 0
  }
}
