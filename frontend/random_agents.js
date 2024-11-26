"use strict";

import * as twgl from "twgl.js";
import GUI from "lil-gui";

import vsGLSL from "./shaders/vs.glsl?raw";
import fsGLSL from "./shaders/fs.glsl?raw";

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
} from "./shapes.js";

// Define the Object3D class to represent 3D objects
class Object3D {
  constructor(
    id,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    scale = [1, 1, 1]
  ) {
    this.id = id;
    this.position = position;
    this.rotation = rotation;
    this.scale = scale;
    this.matrix = twgl.m4.create();
  }
}

// Define the agent server URI
const agent_server_uri = "http://localhost:8585/";

// Initialize arrays to store agents and obstacles
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

let agentArrays = [];

let horizontalRoadsArrays;
let verticalRoadsArrays;

let horizontalRoadsBufferInfo;
let verticalRoadsBufferInfo;

let horizontalRoadsVao;
let verticalRoadsVao;

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

// Main function to initialize and run the application
async function main() {
  const canvas = document.querySelector("canvas");
  gl = canvas.getContext("webgl2");

  // Create the program information using the vertex and fragment shaders
  programInfo = twgl.createProgramInfo(gl, [vsGLSL, fsGLSL]);

  // Generate Road Data
  // if (agents.length > 0) {
  //   for (const agent of agents) {
  //     const roadData = generateRoadData(1, agent.orientation);
  //     agentArrays.push(roadData);
  //   }
  // }

  await initAgentsModel();
  await getRoad();

  // console.log("Length of agents: ", agents.length);

  // if (agents.length > 0) {
  //   for (const agent of agents) {
  //     let roadData = await generateRoadData(1, agent.orientation);
  //     console.log("Road Data: ", roadData);
  //     agentArrays.push(roadData);
  //   }
  // } else {
  //   console.log("No agents found");
  // }

  horizontalRoadsArrays = await generateRoadData(1, [0, 0, 0]);
  verticalRoadsArrays = await generateRoadData(1, [0, 0, 1]);

  obstacleArrays = generateObstacleData(1);
  destinationsArrays = generateData(1, true);
  trafficLightsArrays = generateData(1, false, true);

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

  // Set up the user interface
  setupUI();

  // Initialize the agents model
  // Get the agents and obstacles
  await getObstacles();
  await getDestinations();
  await getTrafficLights();

  // Draw the scene
  await drawScene(
    gl,
    programInfo,
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

/*
 * Initializes the agents model by sending a POST request to the agent server.
 */

let GlobalWidth;
let GlobalHeight;

async function initAgentsModel() {
  try {
    // Send a POST request to the agent server to initialize the model
    let response = await fetch(agent_server_uri + "init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    // Check if the response was successful
    if (response.ok) {
      // Parse the response as JSON and log the message
      let result = await response.json();
      GlobalWidth = result.width;
      GlobalHeight = result.height;
      console.log(result.message);
    }
  } catch (error) {
    // Log any errors that occur during the request
    console.log(error);
  }
}

/*
 * Retrieves the current positions of all agents from the agent server.
 */
async function getRoad() {
  try {
    // Send a GET request to the agent server to retrieve the road positions
    let response = await fetch(agent_server_uri + "getRoad");

    // Check if the response was successful
    if (response.ok) {
      // Parse the response as JSON
      let result = await response.json();

      console.log("Road positions: ", result.positions);

      // Check if the agents array is initialized, if not, initialize it
      if (!Array.isArray(agents)) {
        agents = [];
      }

      // Check if the agents array is empty
      if (agents.length === 0) {
        // Create new agents and add them to the agents array
        for (const agent of result.positions) {
          const newAgent = new RoadObject(
            agent.id,
            [agent.position.x, agent.position.y, agent.position.z],
            undefined,
            undefined,
            [agent.orientation.x, agent.orientation.y, agent.orientation.z]
          );
          agents.push(newAgent);
        }
      } else {
        // Update the positions of existing agents
        for (const agent of result.positions) {
          const currentAgent = agents.find(
            (roadObject) => roadObject.id === agent.id
          );

          // Check if the agent exists in the agents array
          if (currentAgent !== undefined) {
            // Update the agent's position
            currentAgent.position = [
              agent.position.x,
              agent.position.y,
              agent.position.z,
            ];

            // Optionally update orientation if it changes
            currentAgent.orientation = [
              agent.orientation.x,
              agent.orientation.y,
              agent.orientation.z,
            ];
          }
        }
      }
    } else {
      console.error(`Failed to fetch road data: ${response.status}`);
    }
  } catch (error) {
    // Log any errors that occur during the request
    console.error("Error fetching road data:", error);
  }
}

/*
 * Retrieves the current positions of all obstacles from the agent server.
 */
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
        const newObstacle = new Object3D(obstacle.id, [
          obstacle.x,
          obstacle.y,
          obstacle.z,
        ]);
        obstacles.push(newObstacle);
      }
      // Log the obstacles array
      console.log("Obstacles:", obstacles);
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
      // await getRoad();
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
    };

    // Set the uniforms and draw the obstacle
    twgl.setUniforms(programInfo, uniforms);
    twgl.drawBufferInfo(gl, obstaclesBufferInfo);
  }
}

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
