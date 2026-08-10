import { Frame } from "../utils/Frame.js"
import { Animation } from "../utils/Animation.js"
import { Timer } from "../utils/Timer.js"

// -----------------------------------------------------------------
// 4. PhysicsAnimation クラス (サブステップ制御のコア)
// -----------------------------------------------------------------
export class PhysicsAnimation extends Animation {
  constructor() {
    super()
    this._currentFrame = new Frame()
    this._currentFrame.index = -1
    this._currentTime = 0.0
    this._isUsingFixedSubTimeSteps = true
    this._numberOfFixedSubTimeSteps = 5
  }

  currentFrame() {
    return this._currentFrame
  }

  currentTimeInSeconds() {
    return this._currentTime
  }

  isUsingFixedSubTimeSteps() {
    return this._isUsingFixedSubTimeSteps
  }
  setIsUsingFixedSubTimeSteps(isUsing) {
    this._isUsingFixedSubTimeSteps = isUsing
  }

  numberOfFixedSubTimeSteps() {
    return this._numberOfFixedSubTimeSteps
  }
  setNumberOfFixedSubTimeSteps(numberOfSteps) {
    this._numberOfFixedSubTimeSteps = numberOfSteps
  }

  onUpdate(frame) {
    if (frame.index > this._currentFrame.index) {
      if (this._currentFrame.index < 0) {
        this.initialize()
      }

      const numberOfFrames = frame.index - this._currentFrame.index
      for (let i = 0; i < numberOfFrames; ++i) {
        this.advanceTimeStep(frame.timeIntervalInSeconds)
      }

      // ★修正: 参照ではなく新しいインスタンスとして値をコピーする
      this._currentFrame = new Frame(frame.index, frame.timeIntervalInSeconds)
    }
  }

  advanceTimeStep(timeIntervalInSeconds) {
    this._currentTime = this._currentFrame.timeInSeconds()

    if (this._isUsingFixedSubTimeSteps) {
      const actualTimeInterval =
        timeIntervalInSeconds / this._numberOfFixedSubTimeSteps

      for (let i = 0; i < this._numberOfFixedSubTimeSteps; ++i) {
        const timer = new Timer()

        this.onAdvanceTimeStep(actualTimeInterval)

        const elapsed = timer.durationInSeconds()
        this._currentTime += actualTimeInterval
      }
    }
  }

  initialize() {
    this.onInitialize()
  }

  onInitialize() {}
  onAdvanceTimeStep(timeIntervalInSeconds) {}
}
