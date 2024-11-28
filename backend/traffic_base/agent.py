# Marcos Dayan Mann A01782876
# José Manuel García Zumaya A01784238
# 20 noviembre 2024

from mesa import Agent
from collections import deque

class Car(Agent):
    '''
    Car agent. Represents a car in the grid.
    Attributes:
    - status: string representing the status of the car. Can be "calculating_route", "following_route", "avoiding_bottleneck" or "arrived".
    - route: List of tuples that contain coordinates that the car will follow to reach its destination, and the direction it will take to reach that coordinate.
    - destination_coords: list of possible destination coordinates.
    - destination: tuple representing the destination of the car, it is randomly selected from all destination_coords.
    - color: string representing the color of the car on mesa's server.
    - street_graph: dictionary representing the streets and connections between them.
    - direction: tuple representing the direction the car is facing.
    - previous_cells_after_change: set of cells the car has been to after recalculating the route.
    - did_avoid_bottleneck_on_past: boolean flag to monitor if used the avoid bottleneck function on traffic lights.
    '''
    def __init__(self, unique_id, model, status: str, street_graph: dict, destination_coords: list[tuple[int, int]]):
        super().__init__(unique_id, model)
        self.status = status 
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
        # Inicializing auxiliar Data Structures for the BFS algorithm
        queue = deque()
        queue.append(start)
        visited = set()
        visited.add(start)
        parent = {}
            
            
        corners = [ # Define the map corners
            (0, 0), 
            (0, self.model.height - 1), 
            (self.model.width - 1, 0), 
            (self.model.width - 1, self.model.height - 1)
        ]
        
        while queue: # While there are nodes to visit
            current = queue.popleft() # Get the first node in the queue
            if current == goal:
                # Rebuild the path once the goal is reached
                path = []
                while current != start: # Rebuilding the path from the goal to the start
                    path.append(current)
                    current = parent[current] # Going back to the parent node that led to the current node
                path.reverse() # Reversing the path so the start is the first element in the path list for every car

                # Adding the direction chance for car representation in WebGl
                path_with_directions = [] 
                previous = start
                for coord in path: 
                    direction = self.get_direction(previous, coord) # Getting the direction between the previous and current coordinate
                    path_with_directions.append((coord, direction))
                    previous = coord
                return path_with_directions # Returning the path with the directions it face on every step

            neighbors = [
                            neighbor for neighbor in graph.get(current, []) 
                            if neighbor not in visited and neighbor not in corners
                        ] # Get the neighbors of the current node that have not been visited and are not corners

            for neighbor in neighbors: # For every neighbor of the current node
                visited.add(neighbor)
                parent[neighbor] = current
                queue.append(neighbor)
        return None  # Path not found
    

    def get_direction(self, from_coord: tuple[int, int], to_coord: tuple[int, int]) -> tuple[int, int]:
        ''' Determines the direction between two adjacent coordinates by calculating the difference between coordinates to understand where did the car move.'''
        dx = -1 if to_coord[0] - from_coord[0] < 0 else 1 if to_coord[0] - from_coord[0] > 0 else 0
        dy = -1 if to_coord[1] - from_coord[1] < 0 else 1 if to_coord[1] - from_coord[1] > 0 else 0

        if dx == 0 and dy == 0:
            return self.direction
        return (dx, dy)

   

    def calculating_route(self):
        '''Calculates the route the car will follow to reach its destination using the BFS algorithm and changes the status of the car to "following_route"'''
        self.route = self.bfs(self.street_graph, self.pos, self.destination)
        if self.route:
            self.status = "following_route"
            self.model.average_steps_to_destination = self.model.average_steps_to_destination + ((len(self.route) - self.model.average_steps_to_destination) / (self.model.total_car_number + 1)) # Updating the average steps to destination metric with a moving average formula


    def is_opposite_direction(self, new_direction: tuple[int, int]) -> bool:
        '''Determines if the new direction is the opposite of the current direction of the car.'''
        opposite = (-self.direction[0], -self.direction[1])
        return new_direction == opposite
        

    def handle_traffic_ahead(self, next_cell: tuple[int, int]):
        '''Handles the traffic ahead of the car by checking the possible moves and avoiding bottlenecks on traffic lights.'''

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

            if is_move_free and not is_move_red_light: # if the move is free and there is no red light, we move to that cell
                if not self.is_opposite_direction(new_direction):
                    provisional_route = self.bfs(self.street_graph, move, self.destination) # recalculating the route to the destination
                    if provisional_route and (len(provisional_route) <= len(self.route)):  # if the new route is shorter or equal to the current route, we move to the new cell
                        self.route = provisional_route
                    
                    if self.route and self.route[0][0] == move: # if the route contains the move cell, we delete it so in the next step we don't move to the same cell
                        self.route.pop(0)
                    
                    self.model.grid.move_agent(self, move) # moving the car to the new cell
                    self.direction = new_direction # updating the direction of the car
                    self.previous_cells_after_change.add(move) # adding the cell to the previous cells set to prevent zig-zagging
                    return
                

        # If there is no possible move, we check if the car is on a traffic light and if it is red, we avoid the bottleneck
        traffic_light = [agent for agent in self.model.grid.get_cell_list_contents(self.pos) if isinstance(agent, Traffic_Light)]
        if traffic_light and not traffic_light[0].is_red:
            self.avoid_bottleneck_on_traffic_light()




    def avoid_bottleneck_on_traffic_light(self):
        '''Avoids the bottleneck on a traffic light by moving the car to the next cells in the road and preventing it to close to other cars'''
        self.route.clear() # Clearing the route to avoid the bottleneck
        self.status = "avoiding_bottleneck"
        self.did_avoid_bottleneck_on_past = True

        overload_x, overload_y = 0, 0

        for _ in range(5): # Moving the car to the next 5 cells in the road if possible and calculating the new route rom there
            next_x, next_y = self.pos[0] + self.direction[0] + overload_x , self.pos[1] + self.direction[1] + overload_y
            road = [agent for agent in self.model.grid.get_cell_list_contents((next_x, next_y)) if isinstance(agent, Road)]
            if not road:
                return
            road = road[0]
            self.route.append(((next_x, next_y), road.main_direction))
            overload_x += road.main_direction[0]
            overload_y += road.main_direction[1]
        
        if self.route: # Making the first move
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

        elif self.status == "avoiding_bottleneck" and len(self.route) > 0 and not is_car_agent:
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

class Road(Agent):
    ''' 
    Road agent. Represents a road in the grid.
    Attributes:
    - orientation: tuple representing the orientation of the road.
    - directions: list of tuples representing the directions the road can take.
    - main_direction: tuple representing the main direction the road is facing.
    - color: string representing the color of the road on mesa's server
    '''
    def __init__(self, unique_id, model, orientation: tuple[int, int], directions: list[tuple[int, int]], main_direction: tuple[int, int]):
        super().__init__(unique_id, model)
        self.directions = directions
        self.main_direction = main_direction
        self.orientation = orientation
        self.color = "gray"

    def step(self):
        pass

class Traffic_Light(Agent):
    '''
    Traffic light agent. Represents a traffic light in the grid.
    Attributes:
    - directions: list of strings representing the directions the traffic light is facing.
    - is_red: boolean flag to determine if the traffic light is red.
    - is_yellow: boolean flag to determine if the traffic light is yellow.
    - time_interval: int representing the time interval the traffic light takes to change.
    - time_to_change: int representing the time left to change the traffic light.
    - color: string representing the color of the traffic light on mesa's server.
    '''
    def __init__(self, unique_id, model, directions: list[str], is_red: bool, time_to_change: int, color: str):
        super().__init__(unique_id, model)
        self.directions = directions
        self.is_red = is_red
        self.is_yellow = False
        self.time_interval = time_to_change
        self.time_to_change = time_to_change
        self.color = color

    def step(self):
        '''Changes the color of the traffic light based on the time interval and the current timer'''
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
    Obstacle agent. Represents an obstacle in the grid.
    Attributes:
    - color: string representing the color of the obstacle on mesa's server.
    """
    def __init__(self, unique_id, model):
        super().__init__(unique_id, model)
        self.color = "cadetblue"

    def step(self):
        pass

class Destination(Agent):
    '''
    Destination agent. Represents a destination in the grid.
    Attributes:
    - color: string representing the color of the destination on mesa's server.
    '''
    def __init__(self, unique_id, model):
        super().__init__(unique_id, model)
        self.color = "orange"

    def step(self):
        pass