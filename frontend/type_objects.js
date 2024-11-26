import * as twgl from "twgl.js";

export class CarObject {
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

export class TrafficLightObject {
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

export class ObstacleObject {
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
