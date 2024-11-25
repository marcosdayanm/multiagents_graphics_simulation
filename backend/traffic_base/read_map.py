from collections import deque

def build_graph(grid_file_path: str): 
    if not grid_file_path:
        print("No se ha especificado un archivo de mapa")
        return None

    with open(grid_file_path, 'r', encoding='utf-8') as file:
        map_text = [line.rstrip('\n') for line in file]
    grid = [list(line) for line in map_text]

    rows = len(grid)
    cols = len(grid[0])

    graph = {}  # Adjacency list dictionary (node -> list of neighbors) for representing the graph
    grid_info = {
        "destinations": [],
    }

    # Representing the direction each arrow or symbol points to
    street_letters_direction = {
        '>': (1, 0),
        '<': (-1, 0),
        '^': (0, 1),
        'v': (0, -1),  # Inverting the direction of the arrow since the y-axis is inverted in the mesa grid
        'S': (0, 0),
        's': (0, 0),
        'D': (0, 0),
    }

    # Initializing the graph with each possible node on it, but without connections
    for y in range(rows):
        for x in range(cols):
            symbol = grid[y][x]
            mesa_y = rows - 1 - y
            position = (x, mesa_y)
            if symbol in ['>', '<', '^', 'v', 'S', 's', 'D']:
                graph[position] = []
                if symbol == 'D':
                    grid_info["destinations"].append(position)  # Store destination positions

    # Adding connections between the nodes
    for y in range(rows):
        for x in range(cols):
            symbol = grid[y][x]
            mesa_y = rows - 1 - y
            position = (x, mesa_y)
            if symbol in ['>', '<', '^', 'v', 'S', 's']: # From a street, we can move to any adjacent cell that does not have an arrow pointing towards us
                for dir_x, dir_y in [(-1, 0), (1, 0), (0, -1), (0, 1)]:  # Check all neighbor cells
                    neigh_x, neigh_y = x + dir_x, y + dir_y

                    if not (0 <= neigh_x < cols and 0 <= neigh_y < rows):
                        continue  # Neighbor out of bounds
                    
                    neighbor_symbol = grid[neigh_y][neigh_x]
                    if neighbor_symbol not in ['>', '<', '^', 'v', 'S', 's', 'D']:
                        continue  # Skip symbols not relevant for the street graph

                    mesa_neigh_y = rows - 1 - neigh_y
                    neighbor_position = (neigh_x, mesa_neigh_y)
                    neigh_direction_x, neigh_direction_y = street_letters_direction.get(neighbor_symbol, (0, 0))

                    if not (neigh_x + neigh_direction_x == x and mesa_neigh_y + neigh_direction_y == mesa_y):
                        # If the neighbor arrow is not pointing towards us
                        graph[position].append(neighbor_position)

            elif symbol == 'D':
                for dir_x, dir_y in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                    neigh_x, neigh_y = x + dir_x, y + dir_y
                    if not (0 <= neigh_x < cols and 0 <= neigh_y < rows):
                        continue

                    neighbor_symbol = grid[neigh_y][neigh_x]
                    if neighbor_symbol in ['>', '<', '^', 'v', 'S', 's']: # Adding the destination as a neighbor of the street or traffic light
                        mesa_neigh_y = rows - 1 - neigh_y
                        neighbor_position = (neigh_x, mesa_neigh_y)
                        graph[neighbor_position].append(position)

    return graph, grid, grid_info

def bfs(graph, start, goal):
    queue = deque()
    queue.append(start)
    visited = set()
    visited.add(start)
    parent = {}
    while queue:
        current = queue.popleft()
        if current == goal:
            # Rebuild the path
            path = []
            while current != start:
                path.append(current)
                current = parent[current]
            path.reverse()
            return path
        for neighbor in graph.get(current, []):
            if neighbor not in visited:
                visited.add(neighbor)
                parent[neighbor] = current
                queue.append(neighbor)
    return None  # No path found

if __name__ == "__main__":
    # Build the graph
    graph, grid, grid_info = build_graph("city_files/2022_base.txt")
    print(grid_info)

    start = (0, 0)
    goal = (5, 4)

    # Find the path
    path = bfs(graph, start, goal)

    # Display the result
    if path:
        print("Camino encontrado:")
        for pos in path:
            print(pos)
    else:
        print(f"No se encontró un camino desde {start} hasta {goal}")