# Marcos Dayan Mann A01782876
# José Manuel García Zumaya A01784238
# 20 noviembre 2024

from mesa import Agent
from collections import deque

class Car(Agent):
    def __init__(self, unique_id, model, status: str, street_graph: dict, destination_coords: list[tuple[int, int]]): # route: list[tuple[tuple[int, int],tuple[int, int]]]
        super().__init__(unique_id, model)
        self.status = status # calculating_route, following_route, arrived
        self.route = []
        self.destination_coords = destination_coords
        self.destination = self.random.choice(destination_coords)
        self.color = "blue"
        self.street_graph = street_graph
        self.direction = (0, 0)
        self.previous_cells_after_change = set()
        self.did_avoid_bottleneck_on_past = False


    def bfs(self, graph: dict[tuple[int, int], list[tuple[int, int]]], start: tuple[int, int], goal: tuple[int, int]) -> list[tuple[tuple[int, int], tuple[int, int]]]:
        """
        This method finds the shortest path between two points in a graph using the Breadth First Search algorithm.
        It starts from the goal coordinate, expanding all its neighbors and saving the path on the "parent" dictionary.
        """
        queue = deque()
        queue.append(start)
        visited = set()
        visited.add(start)
        parent = {}
        
        while queue:
            current = queue.popleft()
            if current == goal:
                # Rebuild the path once the goal is reached
                path = []
                while current != start:
                    path.append(current)
                    current = parent[current]
                path.reverse()

                # Adding the direction chance for car representation in WebGl
                path_with_directions = []
                previous = start
                for coord in path:
                    direction = self.get_direction(previous, coord)
                    path_with_directions.append((coord, direction))
                    previous = coord
                return path_with_directions

            for neighbor in graph.get(current, []):
                if neighbor not in visited:
                    visited.add(neighbor)
                    parent[neighbor] = current
                    queue.append(neighbor)
        return None  # Path not found
    

    def get_direction(self, from_coord: tuple[int, int], to_coord: tuple[int, int]) -> tuple[int, int]:
        """
        Determines the direction between two adjacent coordinates.
        Returns 'L', 'R', 'U', or 'D' for left, right, up, or down respectively.
        """
        dx = -1 if to_coord[0] - from_coord[0] < 0 else 1 if to_coord[0] - from_coord[0] > 0 else 0
        dy = -1 if to_coord[1] - from_coord[1] < 0 else 1 if to_coord[1] - from_coord[1] > 0 else 0


        return (dx, dy)

   

    def calculating_route(self):
        self.route = self.bfs(self.street_graph, self.pos, self.destination)
        if self.route:
            self.status = "following_route"
            self.model.average_steps_to_destination = self.model.average_steps_to_destination + ((len(self.route) - self.model.average_steps_to_destination) / (self.model.total_car_number + 1))


    def is_opposite_direction(self, new_direction: tuple[int, int]) -> bool:
        opposite = (-self.direction[0], -self.direction[1])
        return new_direction == opposite
        

    def handle_traffic_ahead(self, next_cell: tuple[int, int]):
        possible_moves = self.street_graph.get(self.pos, []) # possible moves in graph from current position in street

        possible_moves = [pos for pos in possible_moves if pos != next_cell and pos not in self.previous_cells_after_change] # taking out current next_cell and cells where we have been to prevent zig-zagging

        for move in possible_moves:
            move_contents = self.model.grid.get_cell_list_contents(move)
            is_move_free = not any( # statement to check that the cell we are evaluating to move is available
                (isinstance(agent, Car) or 
                (isinstance(agent, Destination) and move != self.destination))
                for agent in move_contents)
            
            is_move_red_light = any(isinstance(agent, Traffic_Light) and agent.is_red for agent in move_contents) # checking the free cell is not a red traffic light

            pos_roads = [agent for agent in self.model.grid.get_cell_list_contents(self.pos) if isinstance(agent, Road)]
            if not pos_roads:
                continue
            pos_road = pos_roads[0]
            
            new_direction = self.get_direction(self.pos, move) # recalculating the direction of the move so in mesa we can represent the car in the correct rotation
            illegal_move_to_traffic_light = pos_road.main_direction != new_direction and any(isinstance(agent, Traffic_Light) for agent in move_contents)
            if illegal_move_to_traffic_light:
                continue

            if is_move_free and not is_move_red_light:
                
                if not self.is_opposite_direction(new_direction):
                    provisional_route = self.bfs(self.street_graph, move, self.destination)
                    if provisional_route and (len(provisional_route) <= len(self.route)):
                        self.route = provisional_route
                    
                    if self.route and self.route[0][0] == move:
                        self.route.pop(0)
                    
                    self.model.grid.move_agent(self, move)
                    self.direction = new_direction
                    self.previous_cells_after_change.add(move)
                    return
                

        traffic_light = [agent for agent in self.model.grid.get_cell_list_contents(self.pos) if isinstance(agent, Traffic_Light)]
        if traffic_light and not traffic_light[0].is_red:
            self.avoid_bottleneck_on_traffic_light()




    def avoid_bottleneck_on_traffic_light(self):
        self.route.clear()
        self.status = "calculating_route"
        self.did_avoid_bottleneck_on_past = True

        overload_x, overload_y = 0, 0

        for _ in range(5):
            next_x, next_y = self.pos[0] + self.direction[0] + overload_x , self.pos[1] + self.direction[1] + overload_y
            road = [agent for agent in self.model.grid.get_cell_list_contents((next_x, next_y)) if isinstance(agent, Road)]
            if not road:
                return
            road = road[0]
            self.route.append(((next_x, next_y), road.main_direction))
            overload_x += road.main_direction[0]
            overload_y += road.main_direction[1]
        
        if self.route:
            self.model.grid.move_agent(self, self.route[0][0])
            self.direction = self.route[0][1]
            self.route.pop(0)


    def following_route(self):
        if not self.route or self.destination == self.pos or any(isinstance(agent, Destination) for agent in self.model.grid.get_cell_list_contents(self.pos)):
            self.status = "arrived"
            self.model.schedule.remove(self)
            self.model.grid.remove_agent(self)
            self.model.total_cars_at_destination += 1
            self.model.current_car_number -= 1
            return

        next_cell, direction = self.route[0]
        next_cell_contents = self.model.grid.get_cell_list_contents(next_cell)
        is_car_agent = any(isinstance(agent, Car) for agent in next_cell_contents)

        is_current_traffic_light = [agent for agent in self.model.grid.get_cell_list_contents(self.pos) if isinstance(agent, Traffic_Light)] 
        is_next_traffic_light = [agent for agent in next_cell_contents if isinstance(agent, Traffic_Light)]
        
        
        if is_current_traffic_light and is_next_traffic_light and not is_next_traffic_light[0].is_red:
            self.avoid_bottleneck_on_traffic_light()
        
        elif is_next_traffic_light and (is_next_traffic_light[0].is_yellow or is_next_traffic_light[0].is_red): # No other choice than waiting for the traffic light to turn green
            return

        elif self.status == "calculating_route" and len(self.route) > 0 and not is_car_agent:
            self.model.grid.move_agent(self, next_cell)
            self.direction = direction
            self.route.pop(0)
            return
 
        elif is_car_agent:
            self.handle_traffic_ahead(next_cell)
            if not self.route:
                print("Car without route")
        else:
            self.route.pop(0)
            self.model.grid.move_agent(self, next_cell)
            self.direction = direction


    def subsumption(self):
        if self.status == "calculating_route" and len(self.route) == 0 and self.pos != self.destination: # Calculating route
            self.calculating_route()
        # elif self.status == "following_route": # While following route
        else:
            self.following_route()

    def step(self):
        self.subsumption()

# Delete the destination atributte from the class Road, it's neccesary a new class Destination
class Road(Agent):
    def __init__(self, unique_id, model, orientation: tuple[int, int], directions: list[tuple[int, int]], main_direction: tuple[int, int]):
        super().__init__(unique_id, model)
        self.directions = directions
        self.main_direction = main_direction
        self.orientation = orientation
        self.color = "gray"

    def step(self):
        pass

class Traffic_Light(Agent):
    def __init__(self, unique_id, model, directions: list[str], is_red: bool, time_to_change: int, color: str):
        super().__init__(unique_id, model)
        self.directions = directions
        self.is_red = is_red
        self.is_yellow = False
        self.time_interval = time_to_change
        self.time_to_change = time_to_change
        self.color = color

    def step(self):
        if self.is_red == False and self.time_to_change < 1: # yellow to red
            self.color = "red"
            self.is_red = True
            self.is_yellow = False
            self.time_to_change = self.time_interval

        elif self.is_red == True and self.time_to_change < 1: # red to green
            self.color = "green"
            self.is_red = False
            self.time_to_change = self.time_interval

        elif self.is_red == False and self.time_to_change < 3: # green to yellow
            self.color = "yellow"
            self.is_yellow = True
        
        self.time_to_change -= 1

class Obstacle(Agent):
    """
    Obstacle agent. Just to add obstacles to the grid.
    """
    def __init__(self, unique_id, model):
        super().__init__(unique_id, model)
        self.color = "cadetblue"

    def step(self):
        pass

class Destination(Agent):
    def __init__(self, unique_id, model):
        super().__init__(unique_id, model)
        self.color = "orange"

    def step(self):
        pass