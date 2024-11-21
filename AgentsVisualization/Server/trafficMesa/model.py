from mesa import Model
from mesa.time import RandomActivation
from mesa.space import MultiGrid
from read_map import build_graph
from agent import *
import json


class CityModel(Model):
    def __init__(self, N):

        street_graph, grid, grid_info = build_graph('city_files/2022_base.txt')

        self.width = len(grid[0])
        self.height = len(grid)
        self.grid = MultiGrid(self.width, self.height, torus = False) 
        self.schedule = RandomActivation(self)

        for y in range(self.height):
            for x in range(self.width):
                symbol = grid[y][x]
                place_agent((x, y), symbol, self, grid_info)

        self.num_agents = N
        self.running = True

    def step(self):
        '''Advance the model by one step.'''
        self.schedule.step()



def place_agent(pos: tuple[int, int], symbol: str, model: CityModel, grid_info: dict):
    """
    
    """
    if symbol in ["v", "^", ">", "<"]:
        agent = Road(f"r_{pos[0] * model.width + pos[1]}", model, [symbol])
        
    elif symbol in ["S", "s"]:
        is_red = False if symbol == "S" else True
        agent = Traffic_Light(f"tl_{pos[0] * model.width + pos[1]}", model, [symbol], is_red, 10, "red" if is_red else "green")

    elif symbol == "#":
        agent = Obstacle(f"ob_{pos[0] * model.width + pos[1]}", model)

    elif symbol == "D":
        agent = Destination(f"d_{pos[0] * model.width + pos[1]}", model)
        grid_info["destinations"].append(pos)

    else:
        return

    model.grid.place_agent(agent, pos)
    model.schedule.add(agent)