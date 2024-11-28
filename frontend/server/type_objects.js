import * as twgl from "twgl.js";

export class CarObject {
  constructor(
    id,
    position = [0, 0, 0],
    // rotation in radians
    rotation = [0, 0, 0],
    scale = [1, 1, 1],
    orientation = [0, 0, -1],
    color = [1.0, 1.0, 1.0, 1.0],
    material = {
      ambientColor: [0.3, 0.3, 0.3, 1.0],
      diffuseColor: [0.5, 0.5, 0.5, 1.0],
      specularColor: [1.0, 1.0, 1.0, 1.0],
      shininess: 50.0,
    }
  ) {
    this.id = id;
    this.position = position;
    this.rotation = rotation;
    this.scale = scale;
    this.orientation = orientation;
    this.color = color;
    this.matrix = twgl.m4.create();
    this.material = material;
  }
}

export class TrafficLightObject {
  constructor(
    id,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    scale = [1, 1, 1],
    orientation = undefined,
    is_red = false,
    is_yellow = false
  ) {
    this.id = id;
    this.position = position;
    this.rotation = rotation;
    this.scale = scale;
    this.orientation = orientation;
    this.matrix = twgl.m4.create();
    this.is_red = is_red;
    this.is_yellow = is_yellow;
  }
}

export class RoadObject {
  constructor(
    id,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    scale = [1, 1, 1],
    orientation = [0, 0, 0]
  ) {
    this.id = id;
    this.position = position;
    this.rotation = rotation;
    this.scale = scale;
    this.orientation = orientation;
    this.matrix = twgl.m4.create();
  }
}

export class DestinationObject {
  constructor(
    id,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    scale = [1, 1, 1],
    orientation = [0, 0, 0],
    material = {
      ambientColor: [0.3, 0.3, 0.3, 1.0],
      diffuseColor: [0.5, 0.5, 0.5, 1.0],
      specularColor: [1.0, 1.0, 1.0, 1.0],
      shininess: 50.0,
    }
  ) {
    this.id = id;
    this.position = position;
    this.rotation = rotation;
    this.scale = scale;
    this.orientation = orientation;
    this.material = material;
    this.matrix = twgl.m4.create();
  }
}

export class ObstacleObject {
  constructor(
    id,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    scale = [1, 1, 1],
    orientation = [0, 0, 0],
    color = [0.5, 0.5, 0.5, 1.0],
    material = {
      ambientColor: [0.3, 0.3, 0.3, 1.0],
      diffuseColor: [0.5, 0.5, 0.5, 1.0],
      specularColor: [1.0, 1.0, 1.0, 1.0],
      shininess: 50.0,
    }
  ) {
    this.id = id;
    this.position = position;
    this.rotation = rotation;
    this.scale = scale;
    this.orientation = orientation;
    this.material = material;
    this.color = color;
    this.matrix = twgl.m4.create();
  }
}
