"use strict";

import * as twgl from "twgl.js";
import GUI from "lil-gui";

import { objectFaceColors } from "./object.js";

const vsGLSL = `#version 300 es
in vec4 a_position;
in vec4 a_color;
in vec2 a_texCoord; 

uniform mat4 u_transforms;
uniform mat4 u_matrix;

out vec4 v_color;
out vec2 v_texCoord;

void main() {
    v_texCoord = a_texCoord;
    gl_Position = u_matrix * a_position;
    v_color = a_color;
}
`;

const fsGLSL = `#version 300 es
precision highp float;

in vec4 v_color;
in vec2 v_texCoord;

uniform sampler2D u_texture;

out vec4 outColor;

void main() {
    outColor = texture(u_texture, v_texCoord);
    // outColor = v_color;
}
`;

// Define the vertex shader code, using GLSL 3.00
// const vsGLSL = `#version 300 es
// in vec4 a_position;
// in vec4 a_color;

// uniform mat4 u_transforms;
// uniform mat4 u_matrix;

// out vec4 v_color;

// void main() {
// gl_Position = u_matrix * a_position;
// v_color = a_color;
// }
// `;

// Define the fragment shader code, using GLSL 3.00
// const fsGLSL = `#version 300 es
// precision highp float;

// in vec4 v_color;

// out vec4 outColor;

// void main() {
// outColor = v_color;
// }
// `;

// Define the fragment shader code, using GLSL 3.00
// const fsGLSL = `#version 300 es
// precision highp float;

// in vec4 v_color;
// in vec2 v_texcoord;

// uniform sampler2D u_texture;

// out vec4 outColor;

// void main() {
//   outColor = texture(u_texture, v_texcoord);
// }
// `;

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
  agentArrays,
  obstacleArrays,
  agentsBufferInfo,
  obstaclesBufferInfo,
  agentsVao,
  obstaclesVao,
  destinationsArrays,
  destinationsBufferInfo,
  destinationsVao,
  trafficLightsArrays,
  trafficLightsBufferInfo,
  trafficLightsVao;

// Define the camera position
// const cameraPosition = { x: 0, y: 0, z: 0 };
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

  // Generate the agent and obstacle data
  agentArrays = generateData(1);
  obstacleArrays = generateObstacleData(1);
  destinationsArrays = generateData(1, true);
  trafficLightsArrays = generateData(1, false, true);

  // Create buffer information from the agent and obstacle data
  agentsBufferInfo = twgl.createBufferInfoFromArrays(gl, agentArrays);
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
  agentsVao = twgl.createVAOFromBufferInfo(gl, programInfo, agentsBufferInfo);
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
      src: "/textures/road.png",
    });
    console.log("Texture: ", textureRoad);
  } catch (error) {
    console.log("Error: ", error);
  }

  // Set up the user interface
  setupUI();

  // Initialize the agents model
  await initAgentsModel();

  // Get the agents and obstacles
  await getAgents();
  await getObstacles();
  await getDestinations();
  await getTrafficLights();

  // Draw the scene
  await drawScene(
    gl,
    programInfo,
    agentsVao,
    agentsBufferInfo,
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
async function getAgents() {
  try {
    // Send a GET request to the agent server to retrieve the agent positions
    let response = await fetch(agent_server_uri + "getAgents");

    // Check if the response was successful
    if (response.ok) {
      // Parse the response as JSON
      let result = await response.json();

      // Log the agent positions
      // console.log(result.positions);

      // console.log("Agents length: ", agents.length);

      // // Debug;
      // console.log("Agents in first row received");
      // result.positions.filter((e) => e.z == 0).forEach((e) => console.log(e));

      // console.log("Agents in first row");
      // agents
      //   .filter((e) => e.position[2] == 0)
      //   .forEach((e) => console.log(e.position));

      // for (const agent of agents) {
      //   if (parseInt(agent.id.slice(2)) % 24 == 1) {
      //     console.log("Agent id: ", agent.id);
      //     console.log("Agent position: ", agent.position);
      //   }
      // }

      // Check if the agents array is empty
      if (agents.length == 0) {
        // Create new agents and add them to the agents array
        for (const agent of result.positions) {
          const newAgent = new Object3D(agent.id, [agent.x, agent.y, agent.z]);
          agents.push(newAgent);
        }
        // Log the agents array
        // console.log("First agents positions received:");
        // console.log("Agents in last row FIRST TIME");
        // agents
        //   .filter((e) => e.position[2] == 24)
        //   .forEach((e) => console.log(e.position));
      } else {
        // Update the positions of existing agents
        for (const agent of result.positions) {
          const current_agent = agents.find(
            (object3d) => object3d.id == agent.id
          );

          // Check if the agent exists in the agents array
          if (current_agent != undefined) {
            // Update the agent's position
            current_agent.position = [agent.x, agent.y, agent.z];
          }
        }
      }
    }
  } catch (error) {
    // Log any errors that occur during the request
    console.log(error);
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
      await getAgents();
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
  agentsVao,
  agentsBufferInfo,
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
  drawAgents(distance, agentsVao, agentsBufferInfo, viewProjectionMatrix);
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
      agentsVao,
      agentsBufferInfo,
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
  agentsVao,
  agentsBufferInfo,
  viewProjectionMatrix
) {
  // Bind the vertex array object for agents
  gl.bindVertexArray(agentsVao);

  // Iterate over the agents
  for (const agent of agents) {
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
    twgl.drawBufferInfo(gl, agentsBufferInfo);
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

function generateData(size, isDestination = false, isTrafficLight = false) {
  const color = isTrafficLight
    ? [0.0, 1.0, 0.0, 1.0] // Verde
    : isDestination
    ? [1.0, 0.5, 0.0, 1.0] // Naranja
    : [0.5, 0.5, 0.5, 1.0]; // Gris

  let arrays = {
    a_position: {
      numComponents: 3,
      data: [
        -0.5,
        0.0,
        -0.5, // Vértice inferior izquierdo
        0.5,
        0.0,
        -0.5, // Vértice inferior derecho
        0.5,
        0.0,
        0.5, // Vértice superior derecho
        -0.5,
        0.0,
        0.5, // Vértice superior izquierdo
      ].map((e) => size * e),
    },
    a_texCoord: {
      numComponents: 2,
      data: [
        0.0,
        0.0, // Coordenada de textura para el vértice inferior izquierdo
        1.0,
        0.0, // Coordenada de textura para el vértice inferior derecho
        1.0,
        1.0, // Coordenada de textura para el vértice superior derecho
        0.0,
        1.0, // Coordenada de textura para el vértice superior izquierdo
      ],
    },
    // a_color: {
    //   numComponents: 4,
    //   data: [
    //     ...color, // Color para el vértice inferior izquierdo
    //     ...color, // Color para el vértice inferior derecho
    //     ...color, // Color para el vértice superior derecho
    //     ...color, // Color para el vértice superior izquierdo
    //   ],
    // },
    a_normal: {
      numComponents: 3,
      data: [
        0.0,
        1.0,
        0.0, // Normal para el vértice inferior izquierdo
        0.0,
        1.0,
        0.0, // Normal para el vértice inferior derecho
        0.0,
        1.0,
        0.0, // Normal para el vértice superior derecho
        0.0,
        1.0,
        0.0, // Normal para el vértice superior izquierdo
      ],
    },
    indices: {
      numComponents: 3,
      data: [
        0,
        1,
        2, // Primer triángulo del cuadrado
        0,
        2,
        3, // Segundo triángulo del cuadrado
      ],
    },
  };

  return arrays;
}

// let arrays = {
//   a_position: {
//     numComponents: 3,
//     data: [
//       -0.5,
//       0.0,
//       -0.5, // Vértice inferior izquierdo
//       0.5,
//       0.0,
//       -0.5, // Vértice inferior derecho
//       0.5,
//       0.0,
//       0.5, // Vértice superior derecho
//       -0.5,
//       0.0,
//       -0.5, // Vértice inferior izquierdo
//       0.5,
//       0.0,
//       0.5, // Vértice superior derecho
//       -0.5,
//       0.0,
//       0.5, // Vértice superior izquierdo
//     ].map((e) => size * e),
//   },
//   a_texcoord: {
//     numComponents: 2,
//     data: [
//       0.0,
//       0.0, // Coordenada de textura para el vértice inferior izquierdo
//       1.0,
//       0.0, // Coordenada de textura para el vértice inferior derecho
//       1.0,
//       1.0, // Coordenada de textura para el vértice superior derecho
//       0.0,
//       0.0, // Coordenada de textura para el vértice inferior izquierdo
//       1.0,
//       1.0, // Coordenada de textura para el vértice superior derecho
//       0.0,
//       1.0, // Coordenada de textura para el vértice superior izquierdo
//     ],
//   },
//   // a_color: {
//   //   numComponents: 4,
//   //   data: [
//   //     ...color, // Color para el vértice inferior izquierdo
//   //     ...color, // Color para el vértice inferior derecho
//   //     ...color, // Color para el vértice superior derecho
//   //     ...color, // Color para el vértice superior izquierdo
//   //   ],
//   // },
//   a_normal: {
//     numComponents: 3,
//     data: [
//       0.0,
//       1.0,
//       0.0, // Normal para el vértice inferior izquierdo
//       0.0,
//       1.0,
//       0.0, // Normal para el vértice inferior derecho
//       0.0,
//       1.0,
//       0.0, // Normal para el vértice superior derecho
//       0.0,
//       1.0,
//       0.0, // Normal para el vértice inferior izquierdo
//       0.0,
//       1.0,
//       0.0, // Normal para el vértice superior derecho
//       0.0,
//       1.0,
//       0.0, // Normal para el vértice superior izquierdo
//     ],
//   },
// };

// let arrays = {
//   a_position: {
//     numComponents: 3,
//     data: [
//       -0.5,
//       0.0,
//       -0.5, // Vértice inferior izquierdo
//       0.5,
//       0.0,
//       -0.5, // Vértice inferior derecho
//       0.5,
//       0.0,
//       0.5, // Vértice superior derecho
//       -0.5,
//       0.0,
//       0.5, // Vértice superior izquierdo
//     ].map((e) => size * e),
//   },
//   a_texcoord: {
//     numComponents: 2,
//     data: [
//       0.0,
//       0.0, // Coordenada de textura para el vértice inferior izquierdo
//       1.0,
//       0.0, // Coordenada de textura para el vértice inferior derecho
//       1.0,
//       1.0, // Coordenada de textura para el vértice superior derecho
//       0.0,
//       1.0, // Coordenada de textura para el vértice superior izquierdo
//     ],
//   },
//   // a_color: {
//   //   numComponents: 4,
//   //   data: [
//   //     ...color, // Color para el vértice inferior izquierdo
//   //     ...color, // Color para el vértice inferior derecho
//   //     ...color, // Color para el vértice superior derecho
//   //     ...color, // Color para el vértice superior izquierdo
//   //   ],
//   // },
//   a_normal: {
//     numComponents: 3,
//     data: [
//       0.0,
//       1.0,
//       0.0, // Normal para el vértice inferior izquierdo
//       0.0,
//       1.0,
//       0.0, // Normal para el vértice inferior derecho
//       0.0,
//       1.0,
//       0.0, // Normal para el vértice superior derecho
//       0.0,
//       1.0,
//       0.0, // Normal para el vértice superior izquierdo
//     ],
//   },
//   indices: {
//     numComponents: 3,
//     data: [
//       0,
//       1,
//       2, // Primer triángulo del cuadrado
//       0,
//       2,
//       3, // Segundo triángulo del cuadrado
//     ],
//   },
// };

const obstacleData = {
  a_position: {
    numComponents: 3,
    data: [
      // Front Face
      -0.5,
      -0.5 + 0.5,
      0.5,
      0.5,
      -0.5 + 0.5,
      0.5,
      0.5,
      0.5 + 0.5,
      0.5,
      -0.5,
      0.5 + 0.5,
      0.5,

      // Back face
      -0.5,
      -0.5 + 0.5,
      -0.5,
      -0.5,
      0.5 + 0.5,
      -0.5,
      0.5,
      0.5 + 0.5,
      -0.5,
      0.5,
      -0.5 + 0.5,
      -0.5,

      // Top face
      -0.5,
      0.5 + 0.5,
      -0.5,
      -0.5,
      0.5 + 0.5,
      0.5,
      0.5,
      0.5 + 0.5,
      0.5,
      0.5,
      0.5 + 0.5,
      -0.5,

      // Bottom face
      -0.5,
      -0.5 + 0.5,
      -0.5,
      0.5,
      -0.5 + 0.5,
      -0.5,
      0.5,
      -0.5 + 0.5,
      0.5,
      -0.5,
      -0.5 + 0.5,
      0.5,

      // Right face
      0.5,
      -0.5 + 0.5,
      -0.5,
      0.5,
      0.5 + 0.5,
      -0.5,
      0.5,
      0.5 + 0.5,
      0.5,
      0.5,
      -0.5 + 0.5,
      0.5,

      // Left face
      -0.5,
      -0.5 + 0.5,
      -0.5,
      -0.5,
      -0.5 + 0.5,
      0.5,
      -0.5,
      0.5 + 0.5,
      0.5,
      -0.5,
      0.5 + 0.5,
      -0.5,
    ] /* .map((e) => size * e) */,
  },
  a_color: {
    numComponents: 4,
    data: [
      // Front face
      0.1,
      0.1,
      0.2,
      1, // v_1
      0.1,
      0.1,
      0.2,
      1, // v_1
      0.1,
      0.1,
      0.2,
      1, // v_1
      0.1,
      0.1,
      0.2,
      1, // v_1

      // Back Face
      0.1,
      0.1,
      0.2,
      1, // v_2
      0.1,
      0.1,
      0.2,
      1, // v_2
      0.1,
      0.1,
      0.2,
      1, // v_2
      0.1,
      0.1,
      0.2,
      1, // v_2

      // Top Face
      0.1,
      0.1,
      0.2,
      1, // v_3
      0.1,
      0.1,
      0.2,
      1, // v_3
      0.1,
      0.1,
      0.2,
      1, // v_3
      0.1,
      0.1,
      0.2,
      1, // v_3

      // Bottom Face
      0.1,
      0.1,
      0.2,
      1, // v_4
      0.1,
      0.1,
      0.2,
      1, // v_4
      0.1,
      0.1,
      0.2,
      1, // v_4
      0.1,
      0.1,
      0.2,
      1, // v_4

      // Right Face
      0.1,
      0.1,
      0.2,
      1, // v_5
      0.1,
      0.1,
      0.2,
      1, // v_5
      0.1,
      0.1,
      0.2,
      1, // v_5
      0.1,
      0.1,
      0.2,
      1, // v_5

      // Left Face
      0.1,
      0.1,
      0.2,
      1, // v_6
      0.1,
      0.1,
      0.2,
      1, // v_6
      0.1,
      0.1,
      0.2,
      1, // v_6
      0.1,
      0.1,
      0.2,
      1, // v_6
    ],
  },
  indices: {
    numComponents: 3,
    data: [
      0,
      1,
      2,
      0,
      2,
      3, // Front face
      4,
      5,
      6,
      4,
      6,
      7, // Back face
      8,
      9,
      10,
      8,
      10,
      11, // Top face
      12,
      13,
      14,
      12,
      14,
      15, // Bottom face
      16,
      17,
      18,
      16,
      18,
      19, // Right face
      20,
      21,
      22,
      20,
      22,
      23, // Left face
    ],
  },
};

function generateObstacleData(size) {
  let arrays = obstacleData;
  return arrays;
}

main();

// function generateData(size) {
//   let arrays = {
//     a_position: {
//       numComponents: 3,
//       data: [
//         // Front Face
//         -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5,

//         // Back face
//         -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, -0.5, -0.5,

//         // Top face (with UV mapping)
//         -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, -0.5,

//         // Bottom face
//         -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5,

//         // Right face
//         0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5,

//         // Left face
//         -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, -0.5,
//       ].map((e) => size * e),
//     },
//     a_texcoord: {
//       numComponents: 2,
//       data: [0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0],
//     },
//     // a_color: {
//     //   numComponents: 4,
//     //   data: [
//     //     // Front face
//     //     1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1,
//     //     // Back Face
//     //     0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1,
//     //     // Top Face
//     //     0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1,
//     //     // Bottom Face
//     //     1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1,
//     //     // Right Face
//     //     0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1,
//     //     // Left Face
//     //     1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1,
//     //   ],
//     // },
//     indices: {
//       numComponents: 3,
//       data: [
//         0,
//         1,
//         2,
//         0,
//         2,
//         3, // Front face
//         4,
//         5,
//         6,
//         4,
//         6,
//         7, // Back face
//         8,
//         9,
//         10,
//         8,
//         10,
//         11, // Top face
//         12,
//         13,
//         14,
//         12,
//         14,
//         15, // Bottom face
//         16,
//         17,
//         18,
//         16,
//         18,
//         19, // Right face
//         20,
//         21,
//         22,
//         20,
//         22,
//         23, // Left face
//       ],
//     },
//   };

//   return arrays;
// }

// function setupUI() {
//   // Create a new GUI instance
//   const gui = new GUI();

//   // Create a folder for the camera position
//   const posFolder = gui.addFolder("Position:");

//   // Add a slider for the x-axis
//   posFolder.add(cameraPosition, "x", -50, 160).onChange((value) => {
//     // Update the camera position when the slider value changes
//     cameraPosition.x = value;
//   });

//   // Add a slider for the y-axis
//   posFolder.add(cameraPosition, "y", -50, 160).onChange((value) => {
//     // Update the camera position when the slider value changes
//     cameraPosition.y = value;
//   });

//   // Add a slider for the z-axis
//   posFolder.add(cameraPosition, "z", -50, 160).onChange((value) => {
//     // Update the camera position when the slider value changes
//     cameraPosition.z = value;
//   });
// }

// function generateData(size) {
//   let arrays = {
//     a_position: {
//       numComponents: 3,
//       data: [
//         // Front Face
//         -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5,

//         // Back face
//         -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, -0.5, -0.5,

//         // Top face
//         -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, -0.5,

//         // Bottom face
//         -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5,

//         // Right face
//         0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5,

//         // Left face
//         -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, -0.5,
//       ].map((e) => size * e),
//     },
//     a_color: {
//       numComponents: 4,
//       data: [
//         // Front face
//         1,
//         0,
//         0,
//         1, // v_1
//         1,
//         0,
//         0,
//         1, // v_1
//         1,
//         0,
//         0,
//         1, // v_1
//         1,
//         0,
//         0,
//         1, // v_1
//         // Back Face
//         0,
//         1,
//         0,
//         1, // v_2
//         0,
//         1,
//         0,
//         1, // v_2
//         0,
//         1,
//         0,
//         1, // v_2
//         0,
//         1,
//         0,
//         1, // v_2
//         // Top Face
//         0,
//         0,
//         1,
//         1, // v_3
//         0,
//         0,
//         1,
//         1, // v_3
//         0,
//         0,
//         1,
//         1, // v_3
//         0,
//         0,
//         1,
//         1, // v_3
//         // Bottom Face
//         1,
//         1,
//         0,
//         1, // v_4
//         1,
//         1,
//         0,
//         1, // v_4
//         1,
//         1,
//         0,
//         1, // v_4
//         1,
//         1,
//         0,
//         1, // v_4
//         // Right Face
//         0,
//         1,
//         1,
//         1, // v_5
//         0,
//         1,
//         1,
//         1, // v_5
//         0,
//         1,
//         1,
//         1, // v_5
//         0,
//         1,
//         1,
//         1, // v_5
//         // Left Face
//         1,
//         0,
//         1,
//         1, // v_6
//         1,
//         0,
//         1,
//         1, // v_6
//         1,
//         0,
//         1,
//         1, // v_6
//         1,
//         0,
//         1,
//         1, // v_6
//       ],
//     },
//     indices: {
//       numComponents: 3,
//       data: [
//         0,
//         1,
//         2,
//         0,
//         2,
//         3, // Front face
//         4,
//         5,
//         6,
//         4,
//         6,
//         7, // Back face
//         8,
//         9,
//         10,
//         8,
//         10,
//         11, // Top face
//         12,
//         13,
//         14,
//         12,
//         14,
//         15, // Bottom face
//         16,
//         17,
//         18,
//         16,
//         18,
//         19, // Right face
//         20,
//         21,
//         22,
//         20,
//         22,
//         23, // Left face
//       ],
//     },
//   };

//   return arrays;
// }
