"use strict";

import * as twgl from "twgl.js";
import GUI from "lil-gui";

import vsGLSL from "../shaders/vs.glsl?raw";
import fsGLSL from "../shaders/fs.glsl?raw";

import { initAgentsModel, getRoad } from "./client_functions.js";

import {
  CarObject,
  TrafficLightObject,
  RoadObject,
  DestinationObject,
  ObstacleObject,
} from "./type_objects.js";

import {
  generateRoadData,
  generateData,
  generateObstacleData,
} from "../shapes/shapes.js";

import { carData } from "../shapes/car.js";
import { bu3Data } from "../shapes/bu6.js";
import { bu4Data } from "../shapes/bu10.js";
import { bu12Data } from "../shapes/bu12.js";

// Define the Object3D class to represent 3D objects
class Object3D {
  constructor(
    id,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    scale = [1, 1, 1],
    material = "Texture1",
    texture = undefined
  ) {
    this.id = id;
    this.position = position;
    this.rotation = rotation;
    this.scale = scale;
    this.matrix = twgl.m4.create();
    this.material = material;
    this.texture = texture;
  }
}

// Define the agent server URI
const agent_server_uri = "http://localhost:8585/";

// Initialize arrays to store agents and obstacles
const cars = [];
const agents = [];
const obstacles = [];
const destinations = [];
const traffic_lights = [];

let textureRoad = undefined;

// Initialize WebGL-related variables
let gl,
  programInfo,
  obstacleArrays,
  obstaclesBufferInfo,
  obstaclesVao,
  destinationsArrays,
  destinationsBufferInfo,
  destinationsVao,
  trafficLightsArrays,
  trafficLightsBufferInfo,
  trafficLightsVao;

let horizontalRoadsArrays;
let verticalRoadsArrays;

let horizontalRoadsBufferInfo;
let verticalRoadsBufferInfo;

let horizontalRoadsVao;
let verticalRoadsVao;

let carArrays = [];
let carBufferInfo;
let carVao;

let GlobalWidth;
let GlobalHeight;

// Define the camera position
const cameraPosition = {
  x: 0,
  y: 20, // Altura inicial de la cámara
  z: 0,
  rotationY: 0, // Ángulo de rotación en grados
  radius: 30, // Radio de la órbita
};

// Initialize the frame count
let frameCount = 0;

// Define the data object
const data = {
  NAgents: 500,
  width: 100,
  height: 100,
};

async function loadMTL(filePath) {
  try {
    const response = await fetch(filePath);
    const mtlContent = await response.text();

    const materials = {};
    let currentMaterial = null;

    mtlContent.split("\n").forEach((line) => {
      line = line.trim();
      if (line.startsWith("newmtl")) {
        currentMaterial = line.split(" ")[1];
        materials[currentMaterial] = {};
      } else if (line.startsWith("map_Kd")) {
        const texturePath = line.split(" ")[1];
        if (currentMaterial) {
          materials[currentMaterial].texturePath = texturePath;
        }
      }
    });

    return materials;
  } catch (error) {
    console.error("Error loading MTL file:", error);
    return null;
  }
}

async function loadTextures(gl, materials) {
  const textures = {};

  for (const [materialName, materialData] of Object.entries(materials)) {
    if (materialData.texturePath) {
      const texture = twgl.createTexture(gl, {
        src: materialData.texturePath,
        min: gl.LINEAR_MIPMAP_LINEAR,
        mag: gl.LINEAR,
        wrap: gl.REPEAT,
      });
      textures[materialName] = texture;
    }
  }

  return textures;
}

// Main function to initialize and run the application
async function main() {
  const canvas = document.querySelector("canvas");
  gl = canvas.getContext("webgl2");

  // Create the program information using the vertex and fragment shaders
  programInfo = twgl.createProgramInfo(gl, [vsGLSL, fsGLSL]);

  const materials = await loadMTL("./textures/bu12.mtl");

  ({ GlobalWidth, GlobalHeight } = await initAgentsModel(data));
  await getRoad(agents);
  await getCars();

  await getObstacles(materials, gl);

  await getDestinations();
  await getTrafficLights();
  // Set up the user interface
  setupUI();

  // only the car dictionary without size
  carArrays = carData;

  horizontalRoadsArrays = await generateRoadData(1, [0, 0, 0]);
  verticalRoadsArrays = await generateRoadData(1, [0, 0, 1]);

  obstacleArrays = bu4Data;
  destinationsArrays = generateData(1, true);
  trafficLightsArrays = generateData(1, false, true);

  carBufferInfo = twgl.createBufferInfoFromArrays(gl, carArrays);

  // Create buffer information from the agent and obstacle data
  horizontalRoadsBufferInfo = twgl.createBufferInfoFromArrays(
    gl,
    horizontalRoadsArrays
  );
  verticalRoadsBufferInfo = twgl.createBufferInfoFromArrays(
    gl,
    verticalRoadsArrays
  );

  obstaclesBufferInfo = twgl.createBufferInfoFromArrays(gl, obstacleArrays);
  destinationsBufferInfo = twgl.createBufferInfoFromArrays(
    gl,
    destinationsArrays
  );
  trafficLightsBufferInfo = twgl.createBufferInfoFromArrays(
    gl,
    trafficLightsArrays
  );

  carVao = twgl.createVAOFromBufferInfo(gl, programInfo, carBufferInfo);

  // Create vertex array objects (VAOs) from the buffer information
  horizontalRoadsVao = twgl.createVAOFromBufferInfo(
    gl,
    programInfo,
    horizontalRoadsBufferInfo
  );

  verticalRoadsVao = twgl.createVAOFromBufferInfo(
    gl,
    programInfo,
    verticalRoadsBufferInfo
  );

  obstaclesVao = twgl.createVAOFromBufferInfo(
    gl,
    programInfo,
    obstaclesBufferInfo
  );
  destinationsVao = twgl.createVAOFromBufferInfo(
    gl,
    programInfo,
    destinationsBufferInfo
  );
  trafficLightsVao = twgl.createVAOFromBufferInfo(
    gl,
    programInfo,
    trafficLightsBufferInfo
  );

  try {
    textureRoad = twgl.createTexture(gl, {
      min: gl.NEAREST,
      mag: gl.NEAREST,
      src: "./textures/road.png",
    });
    console.log("Texture: ", textureRoad);
  } catch (error) {
    console.log("Error: ", error);
  }

  // Draw the scene
  await drawScene(
    gl,
    programInfo,
    carVao,
    carBufferInfo,
    horizontalRoadsVao,
    horizontalRoadsBufferInfo,
    verticalRoadsVao,
    verticalRoadsBufferInfo,
    obstaclesVao,
    obstaclesBufferInfo,
    destinationsVao,
    destinationsBufferInfo,
    trafficLightsVao,
    trafficLightsBufferInfo
  );
}

function calculateRotation(orientation) {
  console.log("Orientation", orientation);
  const { x, y, z } = orientation;
  if (x === 0 && y === -1) {
    // Izquierda
    return Math.PI / 2; // 90° en radianes
  } else if (x === 0 && y === 1) {
    // Derecha
    return -Math.PI / 2; // -90° en radianes
  } else if (x === 1 && y === 0) {
    // Arriba
    return 0; // Sin rotación
  } else if (x === -1 && y === 0) {
    // Abajo
    return Math.PI; // 180° en radianes
  }
  return 0; // Fallback (sin rotación)
}

async function getCars() {
  try {
    let response = await fetch(agent_server_uri + "getCars");

    if (response.ok) {
      let result = await response.json();

      if (!Array.isArray(cars)) {
        cars = [];
      }

      if (cars.length === 0) {
        for (const car of result.positions) {
          const newCar = new CarObject(
            car.id,
            [car.position.x, car.position.y, car.position.z],
            undefined,
            undefined,
            [car.orientation.x, car.orientation.y, car.orientation.z]
          );
          cars.push(newCar);
        }
      } else {
        for (const car of cars) {
          const currentIdCar = car.id;
          const found = result.positions.find((car) => car.id === currentIdCar);

          if (found === undefined) {
            // If the id does not exist in the new data, remove it from the array
            // that means that car have been removed in backend
            const index = cars.findIndex((car) => car.id === currentIdCar);
            if (index > -1) {
              cars.splice(index, 1);
            }
          }
        }
        for (const car of result.positions) {
          const currentCar = cars.find((CarObject) => CarObject.id === car.id);

          if (currentCar !== undefined) {
            currentCar.position = [
              car.position.x,
              car.position.y,
              car.position.z,
            ];

            // Rotate the car by orientation
            currentCar.rotation = currentCar.rotation = [
              0,
              calculateRotation(car.orientation),
              0,
            ]; // Solo rotación en el eje Y
          } else {
            // Create a new car that was creaded in the backend
            const newCar = new CarObject(
              car.id,
              [car.position.x, car.position.y, car.position.z],
              undefined,
              undefined,
              [car.orientation.x, car.orientation.y, car.orientation.z]
            );
            cars.push(newCar);
          }
        }
      }
    } else {
      console.error(`Failed to fetch car data: ${response.status}`);
    }
  } catch (error) {
    console.error("Error fetching car data:", error);
  }
}

/*
 * Retrieves the current positions of all obstacles from the agent server.
 */
async function getObstacles(materials, gl) {
  try {
    // Enviar una solicitud GET al servidor para obtener las posiciones de los obstáculos
    let response = await fetch(agent_server_uri + "getBuildings");

    if (response.ok) {
      // Parsear la respuesta como JSON
      let result = await response.json();

      // Crear nuevos obstáculos y añadirlos al array global de obstáculos
      for (const obstacle of result.positions) {
        const newObstacle = new Object3D(obstacle.id, [
          obstacle.x,
          obstacle.y,
          obstacle.z,
        ]);

        // Asignar un material (puedes ajustar esto según cómo determines el material)
        newObstacle.material = "Texture1"; // Aquí asigna el material basado en lógica específica

        // Asignar la textura desde los materiales cargados
        const materialName = newObstacle.material;
        const texturePath = materials[materialName]?.texturePath;

        if (texturePath) {
          newObstacle.texture = twgl.createTexture(gl, {
            src: texturePath,
            min: gl.LINEAR_MIPMAP_LINEAR,
            mag: gl.LINEAR,
            wrap: gl.REPEAT,
          });
        } else {
          console.warn(`No texture found for material: ${materialName}`);
        }

        obstacles.push(newObstacle);
      }

      console.log("Obstacles:", obstacles);
    } else {
      console.error(`Failed to fetch obstacle data: ${response.status}`);
    }
  } catch (error) {
    console.log("Error fetching obstacles:", error);
  }
}
// async function getObstacles() {
//   try {
//     // Send a GET request to the agent server to retrieve the obstacle positions
//     let response = await fetch(agent_server_uri + "getBuildings");

//     // Check if the response was successful
//     if (response.ok) {
//       // Parse the response as JSON
//       let result = await response.json();

//       // Create new obstacles and add them to the obstacles array
//       for (const obstacle of result.positions) {
//         const newObstacle = new Object3D(obstacle.id, [
//           obstacle.x,
//           obstacle.y,
//           obstacle.z,
//         ]);
//         obstacles.push(newObstacle);
//       }
//       // Log the obstacles array
//       console.log("Obstacles:", obstacles);
//     }
//   } catch (error) {
//     // Log any errors that occur during the request
//     console.log(error);
//   }
// }

async function getDestinations() {
  try {
    // Send a GET request to the agent server to retrieve the obstacle positions
    let response = await fetch(agent_server_uri + "getDestinations");

    // Check if the response was successful
    if (response.ok) {
      // Parse the response as JSON
      let result = await response.json();

      // Create new obstacles and add them to the obstacles array
      for (const destination of result.positions) {
        const newDestination = new Object3D(destination.id, [
          destination.x,
          destination.y,
          destination.z,
        ]);
        destinations.push(newDestination);
      }
      // Log the obstacles array
      console.log("Destinations:", destinations);
    }
  } catch (error) {
    // Log any errors that occur during the request
    console.log(error);
  }
}

async function getTrafficLights() {
  try {
    // Send a GET request to the agent server to retrieve the obstacle positions
    let response = await fetch(agent_server_uri + "getTrafficLights");

    // Check if the response was successful
    if (response.ok) {
      // Parse the response as JSON
      let result = await response.json();

      // Create new obstacles and add them to the obstacles array
      for (const traffic_light of result.positions) {
        const newTrafficLight = new Object3D(traffic_light.id, [
          traffic_light.x,
          traffic_light.y,
          traffic_light.z,
        ]);
        traffic_lights.push(newTrafficLight);
      }
      // Log the obstacles array
      console.log("Traffic Lights:", traffic_lights);
    }
  } catch (error) {
    // Log any errors that occur during the request
    console.log(error);
  }
}

/*
 * Updates the agent positions by sending a request to the agent server.
 */
async function update() {
  try {
    // Send a request to the agent server to update the agent positions
    let response = await fetch(agent_server_uri + "update");
    console.log("Updating agents");
    // Check if the response was successful
    if (response.ok) {
      // Retrieve the updated agent positions
      await getCars();
      // Log a message indicating that the agents have been updated
      console.log("Updated agents");
    }
  } catch (error) {
    // Log any errors that occur during the request
    console.log(error);
  }
}

/*
 * Draws the scene by rendering the agents and obstacles.
 *
 * @param {WebGLRenderingContext} gl - The WebGL rendering context.
 * @param {Object} programInfo - The program information.
 * @param {WebGLVertexArrayObject} agentsVao - The vertex array object for agents.
 * @param {Object} agentsBufferInfo - The buffer information for agents.
 * @param {WebGLVertexArrayObject} obstaclesVao - The vertex array object for obstacles.
 * @param {Object} obstaclesBufferInfo - The buffer information for obstacles.
 */
async function drawScene(
  gl,
  programInfo,
  carVao,
  carBufferInfo,
  horizontalRoadsVao,
  horizontalRoadsBufferInfo,
  verticalRoadsVao,
  verticalRoadsBufferInfo,
  obstaclesVao,
  obstaclesBufferInfo,
  destinationsVao,
  destinationsBufferInfo,
  trafficLightsVao,
  trafficLightsBufferInfo
) {
  // Resize the canvas to match the display size
  twgl.resizeCanvasToDisplaySize(gl.canvas);

  // Set the viewport to match the canvas size
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  // Set the clear color and enable depth testing
  gl.clearColor(0.2, 0.2, 0.2, 1);
  gl.enable(gl.DEPTH_TEST);

  // Clear the color and depth buffers
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Use the program
  gl.useProgram(programInfo.program);

  // Set up the view-projection matrix
  const viewProjectionMatrix = setupWorldView(gl);

  // Set the distance for rendering
  const distance = 1;

  drawCars(distance, carVao, carBufferInfo, viewProjectionMatrix);
  // Draw the agents
  drawAgents(
    distance,
    horizontalRoadsVao,
    horizontalRoadsBufferInfo,
    verticalRoadsVao,
    verticalRoadsBufferInfo,
    viewProjectionMatrix
  );
  // Draw the obstacles
  drawObstacles(
    distance,
    obstaclesVao,
    obstaclesBufferInfo,
    viewProjectionMatrix
  );

  drawDestinations(
    distance,
    destinationsVao,
    destinationsBufferInfo,
    viewProjectionMatrix
  );

  drawTrafficLights(
    distance,
    trafficLightsVao,
    trafficLightsBufferInfo,
    viewProjectionMatrix
  );

  // Increment the frame count
  frameCount++;

  // Update the scene every 30 frames
  if (frameCount % 30 == 0) {
    frameCount = 0;
    await update();
  }

  // Request the next frame
  requestAnimationFrame(() =>
    drawScene(
      gl,
      programInfo,
      carVao,
      carBufferInfo,
      horizontalRoadsVao,
      horizontalRoadsBufferInfo,
      verticalRoadsVao,
      verticalRoadsBufferInfo,
      obstaclesVao,
      obstaclesBufferInfo,
      destinationsVao,
      destinationsBufferInfo,
      trafficLightsVao,
      trafficLightsBufferInfo
    )
  );
}

/*
 * Draws the agents.
 *
 * @param {Number} distance - The distance for rendering.
 * @param {WebGLVertexArrayObject} agentsVao - The vertex array object for agents.
 * @param {Object} agentsBufferInfo - The buffer information for agents.
 * @param {Float32Array} viewProjectionMatrix - The view-projection matrix.
 */

function drawCars(distance, carVao, carBufferInfo, viewProjectionMatrix) {
  // Bind the appropriate VAO
  gl.bindVertexArray(carVao);

  // Iterate over the agents
  for (const car of cars) {
    // Create the agent's transformation matrix
    const cube_trans = twgl.v3.create(...car.position);
    const cube_scale = twgl.v3.create(...car.scale);

    // Calculate the agent's matrix
    car.matrix = twgl.m4.translate(viewProjectionMatrix, cube_trans);
    car.matrix = twgl.m4.rotateX(car.matrix, car.rotation[0]);
    car.matrix = twgl.m4.rotateY(car.matrix, car.rotation[1]);
    car.matrix = twgl.m4.rotateZ(car.matrix, car.rotation[2]);
    car.matrix = twgl.m4.scale(car.matrix, cube_scale);

    // Set the uniforms for the agent
    let uniforms = {
      u_matrix: car.matrix,
    };

    // Set the uniforms and draw the agent
    twgl.setUniforms(programInfo, uniforms);
    twgl.drawBufferInfo(gl, carBufferInfo);
  }
}

function drawAgents(
  distance,
  horizontalRoadsVao,
  horizontalRoadsBufferInfo,
  verticalRoadsVao,
  verticalRoadsBufferInfo,
  viewProjectionMatrix
) {
  // Iterate over the agents
  for (const agent of agents) {
    // Determinar el VAO y el buffer en función de la orientación
    let vao, bufferInfo;
    if (agent.orientation[0] === 1 && agent.orientation[2] === 0) {
      // Orientación vertical
      vao = verticalRoadsVao;
      bufferInfo = verticalRoadsBufferInfo;
    } else if (agent.orientation[0] === 0 && agent.orientation[2] === 1) {
      // Orientación horizontal
      vao = horizontalRoadsVao;
      bufferInfo = horizontalRoadsBufferInfo;
    } else {
      console.warn(
        "Orientación desconocida para el agente:",
        agent.orientation
      );
      continue; // Salta a la siguiente iteración si la orientación no es válida
    }

    // Bind the appropriate VAO
    gl.bindVertexArray(vao);

    // Create the agent's transformation matrix
    const cube_trans = twgl.v3.create(...agent.position);
    const cube_scale = twgl.v3.create(...agent.scale);

    // Calculate the agent's matrix
    agent.matrix = twgl.m4.translate(viewProjectionMatrix, cube_trans);
    agent.matrix = twgl.m4.rotateX(agent.matrix, agent.rotation[0]);
    agent.matrix = twgl.m4.rotateY(agent.matrix, agent.rotation[1]);
    agent.matrix = twgl.m4.rotateZ(agent.matrix, agent.rotation[2]);
    agent.matrix = twgl.m4.scale(agent.matrix, cube_scale);

    // Set the uniforms for the agent
    let uniforms = {
      u_matrix: agent.matrix,
      u_texture: textureRoad,
    };

    // Set the uniforms and draw the agent
    twgl.setUniforms(programInfo, uniforms);
    twgl.drawBufferInfo(gl, bufferInfo);
  }
}

/*
 * Draws the obstacles.
 *
 * @param {Number} distance - The distance for rendering.
 * @param {WebGLVertexArrayObject} obstaclesVao - The vertex array object for obstacles.
 * @param {Object} obstaclesBufferInfo - The buffer information for obstacles.
 * @param {Float32Array} viewProjectionMatrix - The view-projection matrix.
 */
function drawObstacles(
  distance,
  obstaclesVao,
  obstaclesBufferInfo,
  viewProjectionMatrix
) {
  // Bind the vertex array object for obstacles
  gl.bindVertexArray(obstaclesVao);

  // Iterate over the obstacles
  for (const obstacle of obstacles) {
    // Create the obstacle's transformation matrix
    const cube_trans = twgl.v3.create(...obstacle.position);
    const cube_scale = twgl.v3.create(...obstacle.scale);

    // Calculate the obstacle's matrix
    obstacle.matrix = twgl.m4.translate(viewProjectionMatrix, cube_trans);
    obstacle.matrix = twgl.m4.rotateX(obstacle.matrix, obstacle.rotation[0]);
    obstacle.matrix = twgl.m4.rotateY(obstacle.matrix, obstacle.rotation[1]);
    obstacle.matrix = twgl.m4.rotateZ(obstacle.matrix, obstacle.rotation[2]);
    obstacle.matrix = twgl.m4.scale(obstacle.matrix, cube_scale);

    // Set the uniforms for the obstacle
    let uniforms = {
      u_matrix: obstacle.matrix,
      u_texture: obstacle.texture, // Añadir la textura del obstáculo
    };

    // Set the uniforms and draw the obstacle
    twgl.setUniforms(programInfo, uniforms);
    twgl.drawBufferInfo(gl, obstaclesBufferInfo);
  }
}
// function drawObstacles(
//   distance,
//   obstaclesVao,
//   obstaclesBufferInfo,
//   viewProjectionMatrix
// ) {
//   // Bind the vertex array object for obstacles
//   gl.bindVertexArray(obstaclesVao);

//   // Iterate over the obstacles
//   for (const obstacle of obstacles) {
//     // Create the obstacle's transformation matrix
//     const cube_trans = twgl.v3.create(...obstacle.position);
//     const cube_scale = twgl.v3.create(...obstacle.scale);

//     // Calculate the obstacle's matrix
//     obstacle.matrix = twgl.m4.translate(viewProjectionMatrix, cube_trans);
//     obstacle.matrix = twgl.m4.rotateX(obstacle.matrix, obstacle.rotation[0]);
//     obstacle.matrix = twgl.m4.rotateY(obstacle.matrix, obstacle.rotation[1]);
//     obstacle.matrix = twgl.m4.rotateZ(obstacle.matrix, obstacle.rotation[2]);
//     obstacle.matrix = twgl.m4.scale(obstacle.matrix, cube_scale);

//     // Set the uniforms for the obstacle
//     let uniforms = {
//       u_matrix: obstacle.matrix,
//     };

//     // Set the uniforms and draw the obstacle
//     twgl.setUniforms(programInfo, uniforms);
//     twgl.drawBufferInfo(gl, obstaclesBufferInfo);
//   }
// }

function drawDestinations(
  distance,
  destinationsVao,
  destinationsBufferInfo,
  viewProjectionMatrix
) {
  // Bind the vertex array object for obstacles
  gl.bindVertexArray(destinationsVao);

  // Iterate over the obstacles
  for (const destination of destinations) {
    // Create the obstacle's transformation matrix
    const cube_trans = twgl.v3.create(...destination.position);
    const cube_scale = twgl.v3.create(...destination.scale);

    // Calculate the obstacle's matrix
    destination.matrix = twgl.m4.translate(viewProjectionMatrix, cube_trans);
    destination.matrix = twgl.m4.rotateX(
      destination.matrix,
      destination.rotation[0]
    );
    destination.matrix = twgl.m4.rotateY(
      destination.matrix,
      destination.rotation[1]
    );
    destination.matrix = twgl.m4.rotateZ(
      destination.matrix,
      destination.rotation[2]
    );
    destination.matrix = twgl.m4.scale(destination.matrix, cube_scale);

    let uniforms = {
      u_matrix: destination.matrix,
    };

    // Set the uniforms and draw the obstacle
    twgl.setUniforms(programInfo, uniforms);
    twgl.drawBufferInfo(gl, destinationsBufferInfo);
  }
}

function drawTrafficLights(
  distance,
  trafficLightsVao,
  trafficLightsBufferInfo,
  viewProjectionMatrix
) {
  // Bind the vertex array object for obstacles
  gl.bindVertexArray(trafficLightsVao);

  // Iterate over the obstacles
  for (const trafficLight of traffic_lights) {
    // Create the obstacle's transformation matrix
    const cube_trans = twgl.v3.create(...trafficLight.position);
    const cube_scale = twgl.v3.create(...trafficLight.scale);

    // Calculate the obstacle's matrix
    trafficLight.matrix = twgl.m4.translate(viewProjectionMatrix, cube_trans);
    trafficLight.matrix = twgl.m4.rotateX(
      trafficLight.matrix,
      trafficLight.rotation[0]
    );
    trafficLight.matrix = twgl.m4.rotateY(
      trafficLight.matrix,
      trafficLight.rotation[1]
    );
    trafficLight.matrix = twgl.m4.rotateZ(
      trafficLight.matrix,
      trafficLight.rotation[2]
    );
    trafficLight.matrix = twgl.m4.scale(trafficLight.matrix, cube_scale);

    let uniforms = {
      u_matrix: trafficLight.matrix,
    };

    // Set the uniforms and draw the obstacle
    twgl.setUniforms(programInfo, uniforms);
    twgl.drawBufferInfo(gl, trafficLightsBufferInfo);
  }
}

/*
 * Sets up the world view by creating the view-projection matrix.
 *
 * @param {WebGLRenderingContext} gl - The WebGL rendering context.
 * @returns {Float32Array} The view-projection matrix.
 */
function setupWorldView(gl) {
  const fov = (45 * Math.PI) / 180;
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const projectionMatrix = twgl.m4.perspective(fov, aspect, 1, 200);

  const up = [0, 1, 0]; // Vector arriba
  const target = [GlobalWidth / 2, 0, GlobalHeight / 2];

  // Configuración inicial de rotación
  const angle = cameraPosition.rotationY * (Math.PI / 180); // Convierte de grados a radianes

  // Calcula la posición de la cámara en una órbita alrededor del objetivo
  const radius = cameraPosition.radius;
  const camX = target[0] + radius * Math.sin(angle);
  const camZ = target[2] + radius * Math.cos(angle);
  const camPos = [camX, cameraPosition.y, camZ];

  // Crea la matriz de vista
  const cameraMatrix = twgl.m4.lookAt(camPos, target, up);
  const viewMatrix = twgl.m4.inverse(cameraMatrix);

  // Calcula la matriz de vista-proyección
  const viewProjectionMatrix = twgl.m4.multiply(projectionMatrix, viewMatrix);

  return viewProjectionMatrix;
}

/*
 * Sets up the user interface (UI) for the camera position.
 */
function setupUI() {
  const gui = new GUI();

  // Carpeta para posición de la cámara
  const posFolder = gui.addFolder("Position:");

  // Control para rotación en Y
  posFolder.add(cameraPosition, "rotationY", 0, 360).onChange(() => {
    console.log(`Camera rotation updated: ${cameraPosition.rotationY}`);
  });

  // Controles para la posición en Y (altura)
  posFolder.add(cameraPosition, "y", -50, 50).onChange(() => {
    console.log(`Camera height updated: ${cameraPosition.y}`);
  });

  posFolder.add(cameraPosition, "radius", 10, 50).onChange(() => {
    console.log(`Camera Radius updated: ${cameraPosition.radius}`);
  });
}

main();
/*
 * Initializes the agents model by sending a POST request to the agent server.
 */

// async function initAgentsModel() {
//   try {
//     // Send a POST request to the agent server to initialize the model
//     let response = await fetch(agent_server_uri + "init", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(data),
//     });

//     // Check if the response was successful
//     if (response.ok) {
//       // Parse the response as JSON and log the message
//       let result = await response.json();
//       let GlobalWidth = result.width;
//       let GlobalHeight = result.height;
//       console.log(result.message);
//     }

//     return GlobalHeight, GlobalWidth;
//   } catch (error) {
//     // Log any errors that occur during the request
//     console.log("Error initializing agents model:", error);
//     return 0, 0;
//   }
// }

/*
 * Retrieves the current positions of all agents from the agent server.
 */
// async function getRoad() {
//   try {
//     // Send a GET request to the agent server to retrieve the road positions
//     let response = await fetch(agent_server_uri + "getRoad");

//     // Check if the response was successful
//     if (response.ok) {
//       // Parse the response as JSON
//       let result = await response.json();

//       // console.log("Road positions: ", result.positions);

//       // Check if the agents array is initialized, if not, initialize it
//       if (!Array.isArray(agents)) {
//         agents = [];
//       }

//       // Check if the agents array is empty
//       if (agents.length === 0) {
//         // Create new agents and add them to the agents array
//         for (const agent of result.positions) {
//           const newAgent = new RoadObject(
//             agent.id,
//             [agent.position.x, agent.position.y, agent.position.z],
//             undefined,
//             undefined,
//             [agent.orientation.x, agent.orientation.y, agent.orientation.z]
//           );
//           agents.push(newAgent);
//         }
//       } else {
//         // Update the positions of existing agents
//         for (const agent of result.positions) {
//           const currentAgent = agents.find(
//             (roadObject) => roadObject.id === agent.id
//           );

//           // Check if the agent exists in the agents array
//           if (currentAgent !== undefined) {
//             // Update the agent's position
//             currentAgent.position = [
//               agent.position.x,
//               agent.position.y,
//               agent.position.z,
//             ];

//             // Optionally update orientation if it changes
//             currentAgent.orientation = [
//               agent.orientation.x,
//               agent.orientation.y,
//               agent.orientation.z,
//             ];
//           }
//         }
//       }
//     } else {
//       console.error(`Failed to fetch road data: ${response.status}`);
//     }
//   } catch (error) {
//     // Log any errors that occur during the request
//     console.error("Error fetching road data:", error);
//   }
// }
