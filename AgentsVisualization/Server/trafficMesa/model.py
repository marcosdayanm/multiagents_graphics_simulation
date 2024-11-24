from mesa import Model
from mesa.time import RandomActivation
from mesa.space import MultiGrid
from read_map import build_graph
from agent import *
import json


class CityModel(Model):
    def __init__(self, N, place_cars_interval: int = 5):

        street_graph, grid, grid_info = build_graph('city_files/2022_base.txt')

        self.width = len(grid[0])
        self.height = len(grid)
        self.grid = MultiGrid(self.width, self.height, torus = False) 
        self.schedule = RandomActivation(self)

        self.place_cars_interval = place_cars_interval
        self.grid_info = grid_info
        self.street_graph = street_graph

        for y in range(self.height):
            for x in range(self.width):
                symbol = grid[y][x]
                mesa_y = self.height - 1 - y
                self.place_env_agent((x, mesa_y), symbol)

        self.num_agents = N
        self.running = True

    def step(self):
        '''Advance the model by one step.'''
        if self.schedule.steps % self.place_cars_interval == 0:
            self.place_cars()
        self.schedule.step()


    def place_cars(self):
        """
        Place cars in each corner of the grid
        """
        for pos in [(0,0), (0, self.height - 1), (self.width - 1, 0), (self.width - 1, self.height - 1)]: # grid corners
            car = Car(f"c_{pos[0] * self.width + pos[1]}", self, "calculating_route", self.street_graph, self.grid_info["destinations"])
            self.grid.place_agent(car, pos)
            self.schedule.add(car)



    def place_env_agent(self, pos: tuple[int, int], symbol: str):
        """
        
        """
        if symbol in ["v", "^", ">", "<"]:
            agent = Road(f"r_{pos[0] * self.width + pos[1]}", self, [symbol])
            
        elif symbol in ["S", "s"]:
            is_red = False if symbol == "S" else True
            agent = Traffic_Light(f"tl_{pos[0] * self.width + pos[1]}", self, [symbol], is_red, 10, "red" if is_red else "green")

        elif symbol == "#":
            agent = Obstacle(f"ob_{pos[0] * self.width + pos[1]}", self)

        elif symbol == "D":
            agent = Destination(f"d_{pos[0] * self.width + pos[1]}", self)
            self.grid_info["destinations"].append(pos)

        else:
            return

        self.grid.place_agent(agent, pos)
        self.schedule.add(agent)