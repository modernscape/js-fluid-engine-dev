// -----------------------------------------------------------------
// 2. Timer クラス
// -----------------------------------------------------------------
export class Timer {
  constructor() {
    this.reset()
  }
  durationInSeconds() {
    return (performance.now() - this._startingPoint) / 1000.0
  }
  reset() {
    this._startingPoint = performance.now()
  }
}
