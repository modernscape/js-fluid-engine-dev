// 簡易3次元ベクトルクラス（2D描画用だがC++のVector3D概念に合わせる）
export class Vector3D {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x
    this.y = y
    this.z = z
  }

  add(v) {
    return new Vector3D(this.x + v.x, this.y + v.y, this.z + v.z)
  }
  sub(v) {
    return new Vector3D(this.x - v.x, this.y - v.y, this.z - v.z)
  }
  scale(s) {
    return new Vector3D(this.x * s, this.y * s, this.z * s)
  }
  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z)
  }

  normalized() {
    const len = this.length()
    return len > 0.0
      ? new Vector3D(this.x / len, this.y / len, this.z / len)
      : new Vector3D()
  }
}
