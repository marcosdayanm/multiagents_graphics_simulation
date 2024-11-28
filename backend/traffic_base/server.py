# Marcos Dayan Mann A01782876
# José Manuel García Zumaya A01784238
# 20 noviembre 2024
# This file runs a mesa server for visualizing and building the traffic base model.

from agent import *
from model import CityModel
from mesa.visualization import CanvasGrid, BarChartModule
from mesa.visualization import ModularServer

# Agent graphic visualization function deoending on the agent type
def agent_portrayal(agent):
    if agent is None: return
    
    portrayal = {"Shape": "rect",
                 "Filled": "true",
                 "Color": agent.color,
                 "Layer": 1,
                 "w": 1,
                 "h": 1
                 }

    if (isinstance(agent, Road)):
        portrayal["Layer"] = 0
    
    if (isinstance(agent, Destination)):
        portrayal["Layer"] = 0

    if (isinstance(agent, Traffic_Light)):
        portrayal["w"] = 0.8
        portrayal["h"] = 0.8
        portrayal["Layer"] = 0

    if (isinstance(agent, Obstacle)):
        portrayal["w"] = 0.8
        portrayal["h"] = 0.8
        portrayal["Layer"] = 0

    return portrayal

width = 0
height = 0

with open('../map_files/2024_base.txt') as baseFile: # Getting the map dimensions
    lines = baseFile.readlines()
    width = len(lines[0])-1
    height = len(lines)

model_params = {"place_cars_interval": 1}  # Interval for placing cars

print(width, height)
grid = CanvasGrid(agent_portrayal, width, height, 500, 500)

server = ModularServer(CityModel, [grid], "Traffic Base", model_params)
                       
server.port = 8522 # The default
server.launch()
