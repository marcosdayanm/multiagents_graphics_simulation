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
    def __init__(self, place_cars_interval: int = 3):
        street_graph, grid, grid_info = build_graph('../map_files/2024_base.txt') # Function that reads the map file and returns the street graph which agents will use to navigate, the string grid and some additional information, and the grid_info dictionary which contains the destination coordinates in order to select them for the agents

        self.width = len(grid[0]) # map dimensions
        self.height = len(grid)
        self.grid = MultiGrid(self.width, self.height, torus=False) # inicializing the grid as a MultiGrid, allowing multiple agents to be on the same cell
        self.schedule = RandomActivation(self) # Random activation scheduler, which shuffles the order of the agents each step and executes its step in one thread

        self.place_cars_interval = place_cars_interval # Interval for placing cars
        self.grid_info = grid_info # contains the destination coordinates
        self.street_graph = street_graph # Graph representing the streets and connections between them

        # Variables that track metrics for the simulation for measuring its performance
        self.total_cars_at_destination = 0 
        self.total_car_number = 0
        self.current_car_number = 0
        self.average_steps_to_destination = 0

        self.id_counter = 0  # Counter for unique IDs

        # Iterating through the grid in order to inicialze the environment, in mesa environment is treated as an agent
        for y in range(self.height):
            for x in range(self.width):
                symbol = grid[y][x]
                mesa_y = self.height - 1 - y  # Adjust coordinate system to match mesa's, because mesa's y-axis is inverted respect Python matrix indices
                self.place_env_agent((x, mesa_y), symbol)

        self.running = True # Flag for the model's running state

        # control measure to ensure no IDs are repeated
        all_ids = [agent.unique_id for agent in self.schedule.agents]
        if len(all_ids) != len(set(all_ids)):
            print("Warning: Duplicate IDs detected!")
        else:
            print("All IDs are unique.")


    def step(self):
        '''Advance the model by one step.'''
        if self.schedule.steps % self.place_cars_interval == 0: # Determines the moment to place cars based on the interval defined
            self.place_cars()
        self.schedule.step()

        self.terminal_report() # Prints the metrics of the simulation on the terminal

    def terminal_report(self):
        '''Prints the metrics of the simulation on the terminal.'''
        print(f"\n\nREPORTING: \nTOTAL_CAR_NUMBER: {self.total_car_number} \nTOTAL_CARS_AT_DESTINATION: {self.total_cars_at_destination} \nCURRENT_CAR_NUMBER: {self.current_car_number} \nAVERAGE_STEPS_TO_DESTINATION: {self.average_steps_to_destination}")

    def place_cars(self):
        '''Place cars in each corner of the grid if it is not already taken by another car.'''
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
        '''Determines the valid moves for a car on a road based on the road's symbol.'''
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
        '''Determines the main direction for a car on a road based on the road's symbol.'''
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
        '''Place an environment agent in the grid based on the symbol.'''
        unique_id = f"{symbol}_{self.id_counter}"
        self.id_counter += 1

        if symbol in ["v", "^", ">", "<"]: # If the symbol is a road, create a road agent inicializing it with the corresponding parameters, and so on for the other agent types
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

        self.grid.place_agent(agent, pos) # Place the agent in the grid
        self.schedule.add(agent) # Add the agent to the scheduler so it can be activated and its step called every frame