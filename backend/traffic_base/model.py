# Marcos Dayan Mann A01782876
# José Manuel García Zumaya A01784238
# 20 noviembre 2024

from mesa import Model
from mesa.time import RandomActivation
from mesa.space import MultiGrid
from read_map import build_graph
from agent import *
import json

class CityModel(Model):
    def __init__(self, N, place_cars_interval: int = 2):
        street_graph, grid, grid_info = build_graph('../map_files/2022_base.txt')

        print(f"Street graph (3,19) destino: {street_graph[(3,19)]}")
        print(f"Street graph (3,18) antes de destino: {street_graph[(3,18)]}")

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
        self.current_car_number = 0
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

        print(f"\n\nREPORTING: \nTOTAL_CAR_NUMBER: {self.total_car_number} \nTOTAL_CARS_AT_DESTINATION: {self.total_cars_at_destination} \nCURRENT_CAR_NUMBER: {self.current_car_number} \nAVERAGE_STEPS_TO_DESTINATION: {self.average_steps_to_destination}")

    def place_cars(self):
        """
        Place cars in each corner of the grid.
        """
        for pos in [(0, 0), (0, self.height - 1), (self.width - 1, 0), (self.width - 1, self.height - 1)]:
            cell_contents = self.grid.get_cell_list_contents(pos)
            is_taken = any(isinstance(agent, Car) for agent in cell_contents)
            if is_taken:
                continue
            car = Car(f"c_{self.id_counter}", self, "calculating_route", self.street_graph, self.grid_info["destinations"])
            self.id_counter += 1
            self.grid.place_agent(car, pos)
            self.schedule.add(car)

            self.total_car_number += 1
            self.current_car_number += 1

    def determine_valid_moves_on_road(self, symbol: str):
        if symbol.lower() == "v":
            return [(-1,0), (1,0), (0,-1)] # left, right, down
        elif symbol == "^":
            return [(-1,0), (1,0), (0,1)] # left, right, up
        elif symbol == ">":
            return [(0,-1), (1,0), (0,1)] # up, right, down
        elif symbol == "<":
            return [(-1,0), (0,-1), (0,1)] # left, up, down
        else:
            return []
        
    def determine_main_direction_on_road(self, symbol: str):
        if symbol.lower() == "v":
            return (0,-1)
        elif symbol == "^":
            return (0,1)
        elif symbol == ">":
            return (1,0)
        elif symbol == "<":
            return (-1,0)
        else:
            return (0,0)

    def place_env_agent(self, pos: tuple[int, int], symbol: str):
        """
        Place an environmental agent in the grid based on the symbol.
        """
        unique_id = f"{symbol}_{self.id_counter}"
        self.id_counter += 1

        if symbol in ["v", "^", ">", "<"]:
            agent = Road(unique_id, self, (0,1) if symbol in [">", "<"] else (1,0), self.determine_valid_moves_on_road(symbol), self.determine_main_direction_on_road(symbol))

        elif symbol in ["S", "s"]:
            is_red = False if symbol == "S" else True
            agent = Traffic_Light(unique_id, self, [symbol], is_red, 15, "red" if is_red else "green")

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