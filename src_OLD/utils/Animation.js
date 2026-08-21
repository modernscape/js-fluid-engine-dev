// -----------------------------------------------------------------
// 3. Animation 基底クラス
// -----------------------------------------------------------------
export class Animation {
  update(frame) {
    this.onUpdate(frame)
  }
  onUpdate(frame) {
    throw new Error("onUpdate must be overridden")
  }
}
