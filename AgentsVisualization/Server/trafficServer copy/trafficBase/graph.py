class GraphRoadMatrix:
    """
    Class to model the road as an adjacency list graph.
    """

    def __init__(self, width, height, grid):
        """
        Initialize the graph.
        Args:
            width (int): Width of the grid.
            height (int): Height of the grid.
            grid (MultiGrid): The grid from the Mesa model.
        """
        self.width = width
        self.height = height
        self.grid = grid
        self.graph = self.create_graph()

    def create_graph(self):
        """
        Create the adjacency list for the graph.
        Returns:
            dict: The graph as an adjacency list.
        """
        graph = {}

        for x in range(self.width):
            for y in range(self.height):
                cell_contents = self.grid.get_cell_list_contents((x, y))
                if any(isinstance(agent, (Road, Traffic_Light)) for agent in cell_contents):
                    graph[(x, y)] = self.get_neighbors(x, y)

        return graph

    def get_neighbors(self, x, y):
        """
        Get all valid neighbors for a given cell.
        Args:
            x (int): X-coordinate of the cell.
            y (int): Y-coordinate of the cell.
        Returns:
            list: List of neighboring nodes.
        """
        neighbors = []
        moore_neighbors = [
            (0, 1), (1, 0), (0, -1), (-1, 0),  # Orthogonal
            (1, 1), (1, -1), (-1, 1), (-1, -1)  # Diagonal
        ]

        for dx, dy in moore_neighbors:
            nx, ny = x + dx, y + dy

            # Check if the neighbor is within bounds
            if 0 <= nx < self.width and 0 <= ny < self.height:
                neighbor_contents = self.grid.get_cell_list_contents((nx, ny))
                if any(isinstance(agent, (Road, Traffic_Light)) for agent in neighbor_contents):
                    neighbors.append((nx, ny))

        return neighbors