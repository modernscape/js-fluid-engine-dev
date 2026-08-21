// -----------------------------------------------------------------
// 1. Frame クラス
// -----------------------------------------------------------------
export class Frame {
  constructor(newIndex = 0, newTimeIntervalInSeconds = 1.0 / 60.0) {
    this.index = newIndex
    this.timeIntervalInSeconds = newTimeIntervalInSeconds
  }
  timeInSeconds() {
    return this.index * this.timeIntervalInSeconds
  }
  advance() {
    this.index++
  }
}
