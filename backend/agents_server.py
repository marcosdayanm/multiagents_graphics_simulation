# Marcos Dayan Mann A01782876
# José Manuel García Zumaya A01784238
# 20 noviembre 2024

from flask import Flask, request, jsonify
from traffic_base.model import CityModel
from traffic_base.agent import Road, Traffic_Light, Obstacle, Destination, Car
from flask_cors import CORS, cross_origin
import requests

# Size of the board:
number_agents = 10
width = 28
height = 28
randomModel = None
currentStep = 0

# This application will be used to interact with Unity
app = Flask("Traffic example")

# This route will be used to send the parameters of the simulation to the server.
# The servers expects a POST request with the parameters in a form.
@app.route('/init', methods=['POST'])
@cross_origin(origins="*")  # Permitir solicitudes desde cualquier origen
def initModel():
    global currentStep, randomModel, number_agents, width, height
    
    # print("Request received", request.json)  # Muestra el JSON recibido

    if request.method == 'POST':
        # Acceder a los datos JSON
        data = request.json
        number_agents_str = data.get('NAgents')

        if number_agents_str is None:
            return {"error": "number_agents is required"}, 400

        try:
            number_agents = int(number_agents_str)
        except ValueError:
            return {"error": "number_agents must be a valid integer"}, 400

        print("Number of agents:", number_agents)
        currentStep = 0

        # Crear el modelo utilizando los parámetros
        randomModel = CityModel(2)
        
        width = randomModel.width
        height = randomModel.height

        # Devolver un mensaje indicando éxito
        return jsonify({"message": "Parameters received, model initiated.", "width": width, "height": height})
    


@app.route('/getCars', methods=['GET'])
@cross_origin(origins="*")  # Permitir solicitudes desde cualquier origen
def getCars():
    global randomModel

    if request.method == 'GET':
        # Lista para almacenar las posiciones de los agentes de tipo Car
        car_positions = []
        seen_ids = set()
        
        # Iterar sobre la grilla del modelo
        for cell_contents, (x, z) in randomModel.grid.coord_iter():
            for agent in cell_contents:
                if isinstance(agent, Car):
                    if agent.unique_id not in seen_ids:
                        seen_ids.add(agent.unique_id)
                        car_positions.append({
                            "id": str(agent.unique_id),
                            "position": {
                                "x": x,
                                "y": 1,  # Altura constante para WebGL
                                "z": z
                            },
                            "orientation": {
                                "x": agent.direction[0],
                                "y": 0,
                                "z": agent.direction[1]
                            }
                        })
                        
        # print("Car positions:", car_positions)
        return jsonify({'positions': car_positions})

# This route will be used to get the positions of the agents
@app.route('/getRoad', methods=['GET'])
@cross_origin(origins="*")  # Permitir solicitudes desde cualquier origen
def getAgents():
    global randomModel
          # Orientations:
        # (1, 0, 0) -> Right
        # (-1, 0, 0) -> Left
        # (0, 0, 1) -> Up
        # (0, 0, -1) -> Down

    if request.method == 'GET':
        # Lista para almacenar las posiciones de los agentes de tipo Road
        road_positions = []
        seen_ids = set()  # Conjunto para rastrear IDs únicos

        # Iterar sobre la grilla del modelo
        for cell_contents, (x, z) in randomModel.grid.coord_iter():
            for agent in cell_contents:  # Itera sobre todos los agentes en la celda
                if isinstance(agent, Road):  # Filtra por agentes de tipo Road
                    if agent.unique_id not in seen_ids:  # Verifica si ya fue agregado
                        seen_ids.add(agent.unique_id)  # Marca este ID como visto
                        road_positions.append({
                            "id": str(agent.unique_id),
                            "position": {
                                "x": x,
                                "y": 1,  # Altura constante para WebGL
                                "z": z
                            },
                            "orientation": {
                                "x": agent.orientation[0],
                                "y": 0,
                                "z": agent.orientation[1]
                            }
                        })

        # Log para depuración
        # print("Road positions:", road_positions)

        # Devolver la lista de posiciones en formato JSON
        return jsonify({'positions': road_positions})


@app.route('/getBuildings', methods=['GET'])
@cross_origin(origins="*")  # Permitir solicitudes desde cualquier origen
def getBuildings():
    global randomModel

    if request.method == 'GET':
        building_positions = []
        
        for cell_contents, (x, y) in randomModel.grid.coord_iter():
            for agent in cell_contents:
                if isinstance(agent, Obstacle):
                    building_positions.append({
                        "id": str(agent.unique_id),
                        "x": x,
                        "y": 1,
                        "z": y
                    })
        
        return jsonify({'positions': building_positions})

@app.route('/getDestinations', methods=['GET'])
@cross_origin(origins="*")  # Permitir solicitudes desde
def getDestinations():
    global randomModel

    if request.method == 'GET':
        destination_positions = []
        
        for cell_contents, (x, y) in randomModel.grid.coord_iter():
            for agent in cell_contents:
                if isinstance(agent, Destination):
                    destination_positions.append({
                        "id": str(agent.unique_id),
                        "x": x,
                        "y": 1,
                        "z": y
                    })
        
        return jsonify({'positions': destination_positions})
    
@app.route('/getTrafficLights', methods=['GET'])
@cross_origin(origins="*")  # Permitir solicitudes desde cualquier origen
def getTrafficLights():
    global randomModel

    if request.method == 'GET':
        trafficLightPositions = []
        for cell_contents, (x, z) in randomModel.grid.coord_iter():
            for agent in cell_contents:
                if isinstance(agent, Traffic_Light):
                    trafficLightPositions.append({
                        "id": str(agent.unique_id),
                        "x": x,
                        "y": 1,
                        "z": z,
                        "is_red": agent.is_red,
                        "is_yellow": agent.is_yellow,
                    })

        return jsonify({'positions':trafficLightPositions})
# This route will be used to get the positions of the obstacles
@app.route('/getObstacles', methods=['GET'])
@cross_origin(origins="*")  # Permitir solicitudes desde cualquier origen
def getObstacles():
    global randomModel

    if request.method == 'GET':
        # Get the positions of the obstacles and return them to Unity in JSON format.
        # Same as before, the positions are sent as a list of dictionaries, where each dictionary has the id and position of an obstacle.
        obstaclePositions = [{"id": str(a.unique_id), "x": x, "y":1, "z":z} for a, (x, z) in randomModel.grid.coord_iter() if isinstance(a, Obstacle)]

        return jsonify({'positions':obstaclePositions})

# This route will be used to update the model
@app.route('/update', methods=['GET'])
@cross_origin(origins="*")  # Permitir solicitudes desde cualquier origen
def updateModel():
    global currentStep, randomModel
    if request.method == 'GET':
        # Update the model and return a message to Unity saying that the model was updated successfully
        randomModel.step()
        currentStep += 1
        print("Model updated to step", currentStep)
        return jsonify({'message':f'Model updated to step {currentStep}.', 'currentStep':currentStep})

if __name__=='__main__':
    # Run the flask server in port 8585
    app.run(host="localhost", port=8585, debug=True)