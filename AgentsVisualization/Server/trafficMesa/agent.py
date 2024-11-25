from mesa import Agent
from collections import deque

class Car(Agent):
    def __init__(self, unique_id, model, status: str, street_graph: dict, destination_coords: list[tuple[int, int]]): # route: list[tuple[tuple[int, int],tuple[int, int]]]
        super().__init__(unique_id, model)
        self.status = status # calculating_route, following_route, arrived
        self.route = []
        self.destination_coords = destination_coords
        self.color = "blue"
        self.street_graph = street_graph
        self.direction = (0, 0)


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
        dx = to_coord[0] - from_coord[0]
        dy = to_coord[1] - from_coord[1]
        
        if dx == 1 and dy == 0:
            return (0,1) 
        elif dx == -1 and dy == 0:
            return (0,-1) 
        elif dx == 0 and dy == 1:
            return (1,0) 
        elif dx == 0 and dy == -1:
            return (-1,0)


    def subsumption(self):
        if self.status == "calculating_route": # Calculating route
            self.route = self.bfs(self.street_graph, self.pos, self.random.choice(self.destination_coords))
            if self.route:
                self.status = "following_route"
                self.model.average_steps_to_destination = self.model.average_steps_to_destination + ((len(self.route) - self.model.average_steps_to_destination) / (self.model.total_car_number + 1))

        elif self.status == "following_route": # While following route
            if self.route:
                next_cell_contents = self.model.grid.get_cell_list_contents(self.route[0][0])
                is_car_agent = len([agent for agent in next_cell_contents if isinstance(agent, Car)]) > 0
                is_red_traffic_light = len([agent for agent in next_cell_contents if isinstance(agent, Traffic_Light) and agent.is_red]) > 0
                if is_car_agent or is_red_traffic_light:
                    # TODO: Implement way of checking the other lane while in traffic of in a red light
                    return 
                pos_to_move, direction = self.route.pop(0)
                self.model.grid.move_agent(self, pos_to_move)
                self.direction = direction

            else:
                self.status = "arrived"
                self.color = "white"
                self.model.schedule.remove(self)
                self.model.grid.remove_agent(self)
                self.model.total_cars_at_destination += 1
                self.model.car_number -= 1

    def step(self):
        self.subsumption()

# Delete the destination atributte from the class Road, it's neccesary a new class Destination
class Road(Agent):
    def __init__(self, unique_id, model, directions: list[str]):
        super().__init__(unique_id, model)
        self.directions = directions
        self.orientation = (1, 0)
        self.color = "gray"

    def step(self):
        pass

class Traffic_Light(Agent):
    def __init__(self, unique_id, model, directions: list[str], is_red: bool, time_to_change: int, color: str):
        super().__init__(unique_id, model)
        self.directions = directions
        self.is_red = is_red
        self.time_interval = time_to_change
        self.time_to_change = time_to_change
        self.color = color

    def step(self):
        if self.is_red == False and self.time_to_change < 1: # yellow to red
            self.color = "red"
            self.is_red = True
            self.time_to_change = self.time_interval

        elif self.is_red == True and self.time_to_change < 1: # red to green
            self.color = "green"
            self.is_red = False
            self.time_to_change = self.time_interval

        elif self.is_red == False and self.time_to_change < 3: # green to yellow
            self.color = "yellow"
        
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