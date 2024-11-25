# Model class for the traffic simulation
import mesa
from mesa.time import RandomActivation
from mesa.space import MultiGrid
from traffic_base.read_map import build_graph
from traffic_base.agent import Road, Traffic_Light, Obstacle, Destination
import json

class CityModel(mesa.Model):
    def __init__(self, N):
        super().__init__()

        print("Init model called")

        street_graph, grid, grid_info = build_graph('map_files/2021_base.txt')

        self.width = int(len(grid[0]))
        self.height = int(len(grid))
        self.grid = MultiGrid(self.width, self.height, torus=False) 
        self.schedule = RandomActivation(self)
        self.grid_info = grid_info  # Store grid_info as an attribute

        self.id_counter = 0  # Contador de IDs únicas

        for y in range(self.height):
            for x in range(self.width):
                symbol = grid[y][x]
                self.placeAgent((x, y), symbol)  # Use the new method

        self.num_agents = N
        self.running = True
        
        all_ids = [agent.unique_id for agent in self.schedule.agents]
        if len(all_ids) != len(set(all_ids)):
            print("Warning: Duplicate IDs detected!")
        else:
            print("All IDs are unique.")
        print("Init model finished")

    def step(self):
        '''Advance the model by one step.'''
        self.schedule.step()
    
    def placeAgent(self, pos: tuple[int, int], symbol: str):
        """
        Create and place an agent in the grid based on the given symbol.

        Args:
            pos (tuple[int, int]): Coordinates (x, y) in the grid.
            symbol (str): Character representing the type of agent.
        """
        unique_id = f"{symbol}_{self.id_counter}"  # Generar ID única
        self.id_counter += 1  # Incrementar el contador de IDs

        if symbol in ["v", "^", ">", "<"]:
            agent = Road(unique_id, self, [symbol])
        
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
        

# class CityModel(mesa.Model):
#     def __init__(self, N):
#         super().__init__()
        
#         print("Init model called")

#         street_graph, grid, grid_info = build_graph('map_files/2022_base.txt')

#         self.width = int(len(grid[0]))
#         self.height = int(len(grid))
#         self.grid = MultiGrid(self.width, self.height, torus=False) 
#         self.schedule = RandomActivation(self)
#         self.grid_info = grid_info  # Store grid_info as an attribute

#         for y in range(self.height):
#             for x in range(self.width):
#                 symbol = grid[y][x]
#                 self.placeAgent((x, y), symbol)  # Use the new method

#         self.num_agents = N
#         self.running = True
        
#         print("Init model finished")

#     def step(self):
#         '''Advance the model by one step.'''
#         self.schedule.step()

#     def placeAgent(self, pos: tuple[int, int], symbol: str):
#         """
#         Create and place an agent in the grid based on the given symbol.

#         Args:
#             pos (tuple[int, int]): Coordinates (x, y) in the grid.
#             symbol (str): Character representing the type of agent.
#         """
#         if symbol in ["v", "^", ">", "<"]:
#             agent = Road(f"r_{pos[0] * self.width + pos[1]}", self, [symbol])
        
#         elif symbol in ["S", "s"]:
#             is_red = False if symbol == "S" else True
#             agent = Traffic_Light(f"tl_{pos[0] * self.width + pos[1]}", self, [symbol], is_red, 10, "red" if is_red else "green")

#         elif symbol == "#":
#             agent = Obstacle(f"ob_{pos[0] * self.width + pos[1]}", self)

#         elif symbol == "D":
#             agent = Destination(f"d_{pos[0] * self.width + pos[1]}", self)
#             self.grid_info["destinations"].append(pos)

#         else:
#             print(f"Warning: Unrecognized symbol '{symbol}' at position {pos}")
#             return
        
#         # Cuando agregues agentes a la grilla
#         # print(f"Placing agent: {type(agent)} at position {pos}")
#         self.grid.place_agent(agent, pos)
#         # print(f"Agent of type {type(agent).__name__} placed at {pos}")
#         self.schedule.add(agent)
        
# from mesa import Model
# from mesa.time import RandomActivation
# from mesa.space import MultiGrid
# from traffic_base.read_map import build_graph
# from traffic_base.agent import *
# import json


# class CityModel(Model):
#     def __init__(self, N):
        
#         super().__init__()
        
#         print("Init model called")

#         street_graph, grid, grid_info = build_graph('../map_files/2022_base.txt')

#         self.width = len(grid[0])
#         self.height = len(grid)
#         self.grid = MultiGrid(self.width, self.height, torus = False) 
#         self.schedule = RandomActivation(self)

#         for y in range(self.height):
#             for x in range(self.width):
#                 symbol = grid[y][x]
#                 place_agent((x, y), symbol, self, grid_info)

#         self.num_agents = N
#         self.running = True
        
#         print("Init model finished")

#     def step(self):
#         '''Advance the model by one step.'''
#         self.schedule.step()



# def place_agent(pos: tuple[int, int], symbol: str, model: CityModel, grid_info: dict):
#     """
    
#     """
#     if symbol in ["v", "^", ">", "<"]:
#         agent = Road(f"r_{pos[0] * model.width + pos[1]}", model, [symbol])
        
#     elif symbol in ["S", "s"]:
#         is_red = False if symbol == "S" else True
#         agent = Traffic_Light(f"tl_{pos[0] * model.width + pos[1]}", model, [symbol], is_red, 10, "red" if is_red else "green")

#     elif symbol == "#":
#         agent = Obstacle(f"ob_{pos[0] * model.width + pos[1]}", model)

#     elif symbol == "D":
#         agent = Destination(f"d_{pos[0] * model.width + pos[1]}", model)
#         grid_info["destinations"].append(pos)

#     else:
#         return

#     model.grid.place_agent(agent, pos)
#     print("Agent of type", type(agent), "placed at", pos)
#     model.schedule.add(agent)