from mesa import Agent

class Car(Agent):
    def __init__(self, unique_id, model, status: str, route: list[tuple[tuple[int],tuple[int]]], destination_coords: tuple[int]):
        super().__init__(unique_id, model)
        self.status = status # calculating_route, following_route, arrived
        self.route = route
        self.destination_coords = destination_coords
        self.color = "blue"


    def pathfinding_heuristic(self, a, b):
        """
        Method to calculate the euclidean distance to compare between its options as an heuristic for the pathfinding algorithm
        """
        return abs(a[0] - b[0]) + abs(a[1] - b[1])

    def calculate_route(self):
        all_neighbors = self.model.grid.get_neighborhood(
            self.pos,
            moore=True,
            include_center=False
        )

    def move(self):     
        self.model.grid.move_to_empty(self)

    def step(self):
        self.move()

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