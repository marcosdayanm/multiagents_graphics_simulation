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
  generateTrafficLightData,
} from "../shapes/shapes.js";

import { carData } from "../shapes/car.js";
import { car19Data } from "../shapes/car19.js";

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
const red_traffic_lights = [];
const yellow_traffic_lights = [];

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

let red_traffic_lights_arrays;
let yellow_traffic_lights_arrays;

let red_traffic_lights_buffer_info;
let yellow_traffic_lights_buffer_info;

let red_traffic_lights_vao;
let yellow_traffic_lights_vao;

let GlobalWidth;
let GlobalHeight;

// Define the camera position
const cameraPosition = {
  x: 0,
  y: 20, // Altura inicial de la cámara
  z: 0,
  rot_y: 90, // Ángulo de rotación en grados
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

function drawObject(
  object,
  programInfo,
  bufferInfo,
  viewProjectionMatrix,
  options = {}
) {
  // Calcular la matriz del mundo
  let worldMatrix = twgl.m4.translation(object.position);
  worldMatrix = twgl.m4.rotateX(worldMatrix, object.rotation[0]);
  worldMatrix = twgl.m4.rotateY(worldMatrix, object.rotation[1]);
  worldMatrix = twgl.m4.rotateZ(worldMatrix, object.rotation[2]);
  worldMatrix = twgl.m4.scale(worldMatrix, object.scale);

  const worldViewProjection = twgl.m4.multiply(
    viewProjectionMatrix,
    worldMatrix
  );
  const worldInverseTranspose = twgl.m4.transpose(twgl.m4.inverse(worldMatrix));

  // Uniformes del material
  const material = object.material || {
    ambientColor: [0.3, 0.3, 0.3, 1.0],
    diffuseColor: [0.5, 0.5, 0.5, 1.0],
    specularColor: [1.0, 1.0, 1.0, 1.0],
    shininess: 50.0,
  };

  const uniforms = {
    u_world: worldMatrix,
    u_worldViewProjection: worldViewProjection,
    u_worldInverseTransform: worldInverseTranspose,
    u_ambientColor: material.ambientColor,
    u_diffuseColor: material.diffuseColor,
    u_specularColor: material.specularColor,
    u_shininess: material.shininess,
    ...options, // Incorporar las opciones específicas del objeto
  };

  // Configurar uniformes globales de iluminación
  const lightUniforms = {
    u_lightWorldPosition: [100, 100, 100],
    u_viewWorldPosition: [cameraPosition.x, cameraPosition.y, cameraPosition.z],
    u_ambientLight: [1.0, 1.0, 1.0, 1.0],
    u_diffuseLight: [0.5, 0.5, 0.5, 1.0],
    u_specularLight: [0.5, 0.5, 0.5, 1.0],
  };

  twgl.setUniforms(programInfo, lightUniforms);
  twgl.setUniforms(programInfo, uniforms);

  // Dibujar el buffer del objeto
  twgl.drawBufferInfo(gl, bufferInfo);
}

function getRandomColor() {
  return [
    Math.random(), // Rojo
    Math.random(), // Verde
    Math.random(), // Azul
    1.0, // Alfa (opacidad completa)
  ];
}

// Main function to initialize and run the application
async function main() {
  const canvas = document.querySelector("canvas");
  gl = canvas.getContext("webgl2");

  // Create the program information using the vertex and fragment shaders
  programInfo = twgl.createProgramInfo(gl, [vsGLSL, fsGLSL]);

  ({ GlobalWidth, GlobalHeight } = await initAgentsModel(data));
  await getRoad(agents);
  await getCars();

  await getObstacles();

  await getDestinations();
  await getTrafficLights();
  // Set up the user interface
  setupUI();

  // only the car dictionary without size
  carArrays = car19Data;

  horizontalRoadsArrays = await generateRoadData(1, [0, 0, 0]);
  verticalRoadsArrays = await generateRoadData(1, [0, 0, 1]);

  obstacleArrays = generateObstacleData(1);
  destinationsArrays = generateData(1, true);

  trafficLightsArrays = generateTrafficLightData(1);

  red_traffic_lights_arrays = generateTrafficLightData(1, true);
  yellow_traffic_lights_arrays = generateTrafficLightData(1, false, true);

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

  red_traffic_lights_buffer_info = twgl.createBufferInfoFromArrays(
    gl,
    red_traffic_lights_arrays
  );

  yellow_traffic_lights_buffer_info = twgl.createBufferInfoFromArrays(
    gl,
    yellow_traffic_lights_arrays
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

  red_traffic_lights_vao = twgl.createVAOFromBufferInfo(
    gl,
    programInfo,
    red_traffic_lights_buffer_info
  );

  yellow_traffic_lights_vao = twgl.createVAOFromBufferInfo(
    gl,
    programInfo,
    yellow_traffic_lights_buffer_info
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
    trafficLightsBufferInfo,
    red_traffic_lights_vao,
    yellow_traffic_lights_vao,
    red_traffic_lights_buffer_info,
    yellow_traffic_lights_buffer_info
  );
}

const calculateRotation = (previousOrientation, newOrientation, id) => {
  console.debug("Car id:", id);
  console.debug(`Previous Orientation car id: ${id}:`, previousOrientation);
  console.debug(`New Orientation car id ${id}:`, newOrientation);

  // Calcula el producto cruzado
  const crossProduct = (a, b) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];

  // Calcula el producto punto
  const dotProduct = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

  // Calcula el ángulo entre dos vectores
  const angleBetween = (a, b) => {
    const dot = dotProduct(a, b);
    const cross = crossProduct(a, b);
    const crossMagnitude = Math.sqrt(
      cross[0] ** 2 + cross[1] ** 2 + cross[2] ** 2
    );

    // Calcula el ángulo en radianes
    let angle = Math.atan2(crossMagnitude, dot);

    // Determina el sentido del giro según el eje Y (vertical en WebGL)
    if (cross[1] < 0) angle = -angle;

    return angle; // Devuelve en radianes
  };

  // Si las orientaciones coinciden, no hay rotación
  if (
    previousOrientation[0] === newOrientation[0] &&
    previousOrientation[1] === newOrientation[1] &&
    previousOrientation[2] === newOrientation[2]
  ) {
    console.debug("No rotation");
    return 0;
  }

  // Calcula el ángulo de rotación relativo al frente del coche
  const angle = angleBetween(previousOrientation, newOrientation);

  // Convierte a grados para depuración (opcional)
  const degrees = (angle * 180) / Math.PI;
  console.debug("Rotation angle (degrees):", degrees);

  return angle; // Devuelve en radianes para WebGL
};

async function getCars() {
  try {
    let response = await fetch(agent_server_uri + "getCars");

    if (response.ok) {
      let result = await response.json();

      if (cars.length === 0) {
        for (const car of result.positions) {
          const newCar = new CarObject(
            car.id,
            [car.position.x, car.position.y, car.position.z],
            undefined,
            undefined,
            [car.orientation.x, car.orientation.y, car.orientation.z],
            getRandomColor()
          );
          cars.push(newCar);
        }
      } else {
        for (const car of cars) {
          const currentIdCar = car.id;
          const found = result.positions.find((car) => car.id === currentIdCar);

          if (found === undefined) {
            // If the id does not exist in the new data, remove it from the array
            const index = cars.findIndex((car) => car.id === currentIdCar);
            if (index > -1) {
              cars.splice(index, 1);
            }
          }
        }

        for (const car of result.positions) {
          const currentCar = cars.find((CarObject) => CarObject.id === car.id);

          if (currentCar !== undefined) {
            // Calcula la rotación basada en la orientación previa y nueva
            const previousOrientation = currentCar.orientation;
            const newOrientation = [
              car.orientation.x,
              car.orientation.y,
              car.orientation.z,
            ];
            currentCar.rotation = [
              0,
              calculateRotation(
                previousOrientation,
                newOrientation,
                currentCar.id
              ),
              0,
            ];

            // Actualiza la posición y orientación del coche
            currentCar.position = [
              car.position.x,
              car.position.y,
              car.position.z,
            ];
            // Error de nueva instancia ????
            currentCar.orientation = [0, 0, -1];
          } else {
            // Crea un nuevo coche si no existía
            const newCar = new CarObject(
              car.id,
              [car.position.x, car.position.y, car.position.z],
              undefined,
              undefined,
              [car.orientation.x, car.orientation.y, car.orientation.z],
              getRandomColor()
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

async function getObstacles() {
  try {
    // Send a GET request to the agent server to retrieve the obstacle positions
    let response = await fetch(agent_server_uri + "getBuildings");

    // Check if the response was successful
    if (response.ok) {
      // Parse the response as JSON
      let result = await response.json();

      // Create new obstacles and add them to the obstacles array
      for (const obstacle of result.positions) {
        const newObstacle = new ObstacleObject(obstacle.id, [
          obstacle.x,
          obstacle.y,
          obstacle.z,
        ]);
        obstacles.push(newObstacle);
      }
      // Log the obstacles array
      // console.log("Obstacles:", obstacles);
    }
  } catch (error) {
    // Log any errors that occur during the request
    console.log(error);
  }
}

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
        const newDestination = new DestinationObject(destination.id, [
          destination.x,
          destination.y,
          destination.z,
        ]);
        destinations.push(newDestination);
      }
      // Log the obstacles array
      // console.log("Destinations:", destinations);
    }
  } catch (error) {
    // Log any errors that occur during the request
    console.log(error);
  }
}

async function getTrafficLights() {
  try {
    let response = await fetch(agent_server_uri + "getTrafficLights");

    if (response.ok) {
      let result = await response.json();

      // Limpiar los arrays de colores antes de agregar los semáforos
      red_traffic_lights.length = 0;
      yellow_traffic_lights.length = 0;

      // Crear o actualizar los semáforos
      for (const traffic_light of result.positions) {
        const existingTrafficLight = traffic_lights.find(
          (t) => t.id === traffic_light.id
        );

        if (existingTrafficLight) {
          // Actualizar el semáforo existente
          existingTrafficLight.is_red = traffic_light.is_red;
          existingTrafficLight.is_yellow = traffic_light.is_yellow;
          existingTrafficLight.position = [
            traffic_light.x,
            traffic_light.y,
            traffic_light.z,
          ];
        } else {
          // Crear un nuevo semáforo
          const newTrafficLight = new TrafficLightObject(
            traffic_light.id,
            [traffic_light.x, traffic_light.y, traffic_light.z],
            undefined,
            undefined,
            undefined,
            traffic_light.is_red,
            traffic_light.is_yellow
          );
          traffic_lights.push(newTrafficLight);
        }
      }

      // Separar los semáforos en los arrays correspondientes
      for (const trafficLight of traffic_lights) {
        if (trafficLight.is_red) {
          red_traffic_lights.push(trafficLight);
        } else if (trafficLight.is_yellow) {
          yellow_traffic_lights.push(trafficLight);
        }
      }
    }
  } catch (error) {
    console.error("Error fetching traffic light data:", error);
  }
}

/*
 * Updates the agent positions by sending a request to the agent server.
 */
async function update() {
  try {
    // Send a request to the agent server to update the agent positions
    let response = await fetch(agent_server_uri + "update");
    // console.log("Updating agents");
    // Check if the response was successful
    if (response.ok) {
      // Retrieve the updated agent positions
      await getTrafficLights();
      await getCars();
      // Log a message indicating that the agents have been updated
      // console.log("Updated agents");
    }
  } catch (error) {
    // Log any errors that occur during the request
    console.log(error);
  }
}

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
  trafficLightsBufferInfo,
  red_traffic_lights_vao,
  yellow_traffic_lights_vao,
  red_traffic_lights_buffer_info,
  yellow_traffic_lights_buffer_info
) {
  // Resize the canvas to match the display size
  twgl.resizeCanvasToDisplaySize(gl.canvas);

  // Set the viewport to match the canvas size
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  // Set the clear color and enable depth testing
  gl.clearColor(0.0, 0.0, 0.0, 1);
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
    red_traffic_lights_vao,
    red_traffic_lights_buffer_info,
    yellow_traffic_lights_vao,
    yellow_traffic_lights_buffer_info,
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
      trafficLightsBufferInfo,
      red_traffic_lights_vao,
      yellow_traffic_lights_vao,
      red_traffic_lights_buffer_info,
      yellow_traffic_lights_buffer_info
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
  // Bind el VAO global para los coches
  gl.bindVertexArray(carVao);

  // Iterar sobre todos los coches y dibujarlos usando drawObject
  for (const car of cars) {
    drawObject(car, programInfo, carBufferInfo, viewProjectionMatrix, {
      u_useTexture: 0,
      u_color: car.color,
      u_useColor: 1,
    });
  }
}
// function drawCars(distance, carVao, carBufferInfo, viewProjectionMatrix) {
//   // Bind the appropriate VAO
//   gl.bindVertexArray(carVao);

//   // Iterate over the agents
//   for (const car of cars) {
//     // Create the agent's transformation matrix
//     const cube_trans = twgl.v3.create(...car.position);
//     const cube_scale = twgl.v3.create(...car.scale);

//     // Calculate the agent's matrix
//     car.matrix = twgl.m4.translate(viewProjectionMatrix, cube_trans);
//     car.matrix = twgl.m4.rotateX(car.matrix, car.rotation[0]);
//     car.matrix = twgl.m4.rotateY(car.matrix, car.rotation[1]);
//     car.matrix = twgl.m4.rotateZ(car.matrix, car.rotation[2]);
//     car.matrix = twgl.m4.scale(car.matrix, cube_scale);

//     // Set the uniforms for the agent
//     let uniforms = {
//       u_matrix: car.matrix,
//       u_useTexture: 0,
//       u_color: car.color,
//       u_useColor: 1,
//     };

//     // Set the uniforms and draw the agent
//     twgl.setUniforms(programInfo, uniforms);
//     twgl.drawBufferInfo(gl, carBufferInfo);
//   }
// }

function drawAgents(
  distance,
  horizontalRoadsVao,
  horizontalRoadsBufferInfo,
  verticalRoadsVao,
  verticalRoadsBufferInfo,
  viewProjectionMatrix
) {
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

    // Llamar a drawObject con las opciones específicas para los agentes
    drawObject(agent, programInfo, bufferInfo, viewProjectionMatrix, {
      u_texture: textureRoad,
      u_useTexture: 1, // Se utiliza textura para los agentes
      u_useColor: 0, // No se utiliza color
    });
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
  // Bind el VAO global para los obstáculos
  gl.bindVertexArray(obstaclesVao);

  // Iterar sobre todos los obstáculos y dibujarlos usando drawObject
  for (const obstacle of obstacles) {
    drawObject(
      obstacle,
      programInfo,
      obstaclesBufferInfo,
      viewProjectionMatrix,
      {
        u_useTexture: 0, // No se usa textura para los obstáculos
        u_useColor: 0, // No se usa color para los obstáculos
      }
    );
  }
}

function drawDestinations(
  distance,
  destinationsVao,
  destinationsBufferInfo,
  viewProjectionMatrix
) {
  // Bind el VAO global para los destinos
  gl.bindVertexArray(destinationsVao);

  // Iterar sobre todos los destinos y dibujarlos usando drawObject
  for (const destination of destinations) {
    drawObject(
      destination,
      programInfo,
      destinationsBufferInfo,
      viewProjectionMatrix,
      {
        u_useTexture: 0, // No se usa textura para los destinos
        u_useColor: 0, // No se usa color para los destinos
      }
    );
  }
}

function drawTrafficLights(
  distance,
  trafficLightsVao,
  trafficLightsBufferInfo,
  red_traffic_lights_vao,
  red_traffic_lights_buffer_info,
  yellow_traffic_lights_vao,
  yellow_traffic_lights_buffer_info,
  viewProjectionMatrix
) {
  // Función auxiliar para configurar y dibujar semáforos
  function drawTrafficLightGroup(vao, bufferInfo, trafficLights, options = {}) {
    gl.bindVertexArray(vao);
    for (const trafficLight of trafficLights) {
      drawObject(
        trafficLight,
        programInfo,
        bufferInfo,
        viewProjectionMatrix,
        options
      );
    }
  }

  // Dibuja semáforos en verde
  drawTrafficLightGroup(
    trafficLightsVao,
    trafficLightsBufferInfo,
    traffic_lights.filter((t) => !t.is_red && !t.is_yellow),
    {
      u_useTexture: 0,
      u_useColor: 0,
    }
  );

  // Dibuja semáforos en rojo
  drawTrafficLightGroup(
    red_traffic_lights_vao,
    red_traffic_lights_buffer_info,
    traffic_lights.filter((t) => t.is_red),
    {
      u_useTexture: 0,
    }
  );

  // Dibuja semáforos en amarillo
  drawTrafficLightGroup(
    yellow_traffic_lights_vao,
    yellow_traffic_lights_buffer_info,
    traffic_lights.filter((t) => t.is_yellow),
    {
      u_useTexture: 0,
    }
  );
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
  const angle = cameraPosition.rot_y * (Math.PI / 180); // Convierte de grados a radianes

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
  posFolder.add(cameraPosition, "rot_y", 0, 360).onChange(() => {
    // console.log(`Camera rotation updated: ${cameraPosition.rot_y}`);
  });

  // Controles para la posición en Y (altura)
  posFolder.add(cameraPosition, "y", -50, 50).onChange(() => {
    // console.log(`Camera height updated: ${cameraPosition.y}`);
  });

  posFolder.add(cameraPosition, "radius", 10, 50).onChange(() => {
    // console.log(`Camera Radius updated: ${cameraPosition.radius}`);
  });
}

main();
