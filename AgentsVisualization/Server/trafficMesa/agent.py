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


    def find_path(self, graph, start, goal):
        queue = deque()
        queue.append(start)
        visited = set()
        visited.add(start)
        parent = {}
        while queue:
            current = queue.popleft()
            if current == goal:
                # Reconstruir el camino
                path = []
                while current != start:
                    path.append(current)
                    current = parent[current]
                # path.append(start)
                path.reverse()
                return path
            for neighbor in graph.get(current, []):
                if neighbor not in visited:
                    visited.add(neighbor)
                    parent[neighbor] = current
                    queue.append(neighbor)
        return None  # No se encontró camino


    def subsumption(self):
        if self.status == "calculating_route": # Calculating route
            self.route = self.find_path(self.street_graph, self.pos, self.random.choice(self.destination_coords))
            if self.route:
                self.status = "following_route"

        elif self.status == "following_route": # While following route
            if self.route:
                next_cell_contents = self.model.grid.get_cell_list_contents(self.route[0])
                is_car_agent = len([agent for agent in next_cell_contents if isinstance(agent, Car)]) > 0
                is_red_traffic_light = len([agent for agent in next_cell_contents if isinstance(agent, Traffic_Light) and agent.is_red]) > 0
                if is_car_agent or is_red_traffic_light:
                    return
                
                self.model.grid.move_agent(self, self.route.pop(0))
            else:
                self.status = "arrived"
                self.color = "white"
                self.model.schedule.remove(self)
                self.model.grid.remove_agent(self)

        ...

    def step(self):
        self.subsumption()

# Delete the destination atributte from the class Road, it's neccesary a new class Destination
class Road(Agent):
    def __init__(self, unique_id, model, directions: list[str]):
        super().__init__(unique_id, model)
        self.directions = directions
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