from mesa import Model
from mesa.time import RandomActivation
from mesa.space import MultiGrid
# from read_map import build_graph
# from agent import *
from traffic_base.read_map import build_graph
from traffic_base.agent import *
import json

class CityModel(Model):
    def __init__(self, N, place_cars_interval: int = 5):
        # street_graph, grid, grid_info = build_graph('../map_files/2022_base.txt')
        street_graph, grid, grid_info = build_graph('map_files/2024_base.txt')

        self.width = len(grid[0])
        self.height = len(grid)
        self.grid = MultiGrid(self.width, self.height, torus=False)
        self.schedule = RandomActivation(self)

        self.place_cars_interval = place_cars_interval
        self.grid_info = grid_info
        self.street_graph = street_graph

        # Stats
        self.total_cars_at_destination = 0
        self.total_car_number = 0
        self.car_number = 0
        self.average_steps_to_destination = 0

        self.id_counter = 0  # Counter for unique IDs

        for y in range(self.height):
            for x in range(self.width):
                symbol = grid[y][x]
                mesa_y = self.height - 1 - y  # Adjust coordinate system
                self.place_env_agent((x, mesa_y), symbol)

        self.num_agents = N
        self.running = True

        all_ids = [agent.unique_id for agent in self.schedule.agents]
        if len(all_ids) != len(set(all_ids)):
            print("Warning: Duplicate IDs detected!")
        else:
            print("All IDs are unique.")

    def step(self):
        '''Advance the model by one step.'''
        if self.schedule.steps % self.place_cars_interval == 0:
            self.place_cars()
        self.schedule.step()

    def place_cars(self):
        """
        Place cars in each corner of the grid.
        """
        for pos in [(0, 0), (0, self.height - 1), (self.width - 1, 0), (self.width - 1, self.height - 1)]:
            car = Car(f"c_{self.id_counter}", self, "calculating_route", self.street_graph, self.grid_info["destinations"])
            self.id_counter += 1
            self.grid.place_agent(car, pos)
            self.schedule.add(car)

            self.total_car_number += 1
            self.car_number += 1

    def place_env_agent(self, pos: tuple[int, int], symbol: str):
        """
        Place an environmental agent in the grid based on the symbol.
        """
        unique_id = f"{symbol}_{self.id_counter}"
        self.id_counter += 1

        if symbol in ["v", "^", ">", "<"]:
            agent = Road(unique_id, self, [1,0] if symbol in [">", "<"] else [0,1] , [symbol])

        elif symbol in ["S", "s"]:
            is_red = False if symbol == "S" else True
            agent = Traffic_Light(unique_id, self, [symbol], is_red, 10, "red" if is_red else "green")

        elif symbol == "#":
            agent = Obstacle(unique_id, self)

        elif symbol == "D":
            agent = Destination(unique_id, self)
            self.grid_info["destinations"].append(pos)

        else:
            print(f"Warning: Unrecognized symbol '{symbol}' at position {pos}")
            return

        self.grid.place_agent(agent, pos)
        self.schedule.add(agent)