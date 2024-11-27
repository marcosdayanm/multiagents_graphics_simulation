import {
  CarObject,
  TrafficLightObject,
  RoadObject,
  DestinationObject,
  ObstacleObject,
} from "./type_objects.js";

const agent_server_uri = "http://localhost:8585/";

export async function initAgentsModel(data) {
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
      let GlobalWidth = result.width;
      let GlobalHeight = result.height;
      console.log(result.message);

      // Return the correct object
      return { GlobalHeight, GlobalWidth };
    }

    // Handle the case where response is not ok
    return { GlobalHeight: 0, GlobalWidth: 0 };
  } catch (error) {
    // Log any errors that occur during the request
    console.log("Error initializing agents model:", error);
    // Return the fallback object
    return { GlobalHeight: 0, GlobalWidth: 0 };
  }
}

export async function getRoad(agents) {
  try {
    // Send a GET request to the agent server to retrieve the road positions
    let response = await fetch(agent_server_uri + "getRoad");

    // Check if the response was successful
    if (response.ok) {
      // Parse the response as JSON
      let result = await response.json();

      // console.log("Road positions: ", result.positions);

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

export async function getCars(cars) {
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
          const currentCar = cars.find((carObject) => carObject.id === car.id);

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
