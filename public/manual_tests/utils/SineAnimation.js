// -----------------------------------------------------------------
// アニメーションクラス群
// -----------------------------------------------------------------
export class SineAnimation {
  constructor() {
    this.y = 0.0
  }
  update(frame) {
    this.y = Math.sin(10.0 * frame.timeInSeconds())
  }
}

export class SineWithDecayAnimation {
  constructor() {
    this.y = 0.0
  }
  update(frame) {
    const decay = Math.exp(-frame.timeInSeconds())
    this.y = Math.sin(10.0 * frame.timeInSeconds()) * decay
  }
}
