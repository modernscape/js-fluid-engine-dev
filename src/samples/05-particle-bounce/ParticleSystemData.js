import { Vector3D } from "../../utils/Vector3D.js"

export default class ParticleSystemData {
  constructor(numberOfParticles = 0) {
    this._positions = []
    this._velocities = []
    this._forces = []

    if (numberOfParticles > 0) {
      this.resize(numberOfParticles)
    }
  }

  numberOfParticles() {
    return this._positions.length
  }

  resize(newSize) {
    while (this._positions.length < newSize) {
      this._positions.push(new Vector3D())
      this._velocities.push(new Vector3D())
      this._forces.push(new Vector3D())
    }
    while (this._positions.length > newSize) {
      this._positions.pop()
      this._velocities.pop()
      this._forces.pop()
    }
  }

  addParticle(
    position = new Vector3D(),
    velocity = new Vector3D(),
    force = new Vector3D(),
  ) {
    this._positions.push(new Vector3D(position.x, position.y, position.z))
    this._velocities.push(new Vector3D(velocity.x, velocity.y, velocity.z))
    this._forces.push(new Vector3D(force.x, force.y, force.z))
  }

  positions() {
    return this._positions
  }

  velocities() {
    return this._velocities
  }

  forces() {
    return this._forces
  }

  clearForces() {
    for (let i = 0; i < this._forces.length; ++i) {
      this._forces[i] = new Vector3D(0, 0, 0)
    }
  }
}
