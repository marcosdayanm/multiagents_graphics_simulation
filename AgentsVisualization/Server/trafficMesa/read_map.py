from collections import deque

def build_graph(grid_file_path: str): 
    with open(grid_file_path, 'r', encoding='utf-8') as file:
        map_text = [line.rstrip('\n') for line in file]
    grid = [list(line) for line in map_text]

    graph = {} # Adjacency list dictionary (node -> list of neighbors) for representing the graph
    grid_info = {
        "destinations": [],
    }
    rows = len(grid)
    cols = len(grid[0])

    # representing the direction each arrow or symbol points to
    direction_of_arrows = {
        '>': (1, 0),
        '<': (-1, 0),
        '^': (0, -1),
        'v': (0, 1),
        'S': (0, 0),
        's': (0, 0),
        'D': (0, 0),
    }
    # Here we are inicializing the graph with each possible node on it, but without connections
    for y in range(rows):
        for x in range(cols):
            symbol = grid[y][x]
            if symbol in ['>', '<', '^', 'v', 'S', 's', 'D']:
                graph[(x, y)] = []

    # Now we are going to add the connections between the nodes
    for y in range(rows):
        for x in range(cols):
            symbol = grid[y][x]
            if symbol in ['>', '<', '^', 'v', 'S', 's']: # From a street, we can move to any adjacent cell that does not have an arrow pointing towards us

                for dir_x, dir_y in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                    neigh_x, neigh_y = x + dir_x, y + dir_y

                    if not (0 <= neigh_x < cols and 0 <= neigh_y < rows): continue # Neighbor out of bounds

                    neighbor_symbol = grid[neigh_y][neigh_x]
                    if neighbor_symbol not in ['>', '<', '^', 'v', 'S', 's', 'D']: continue # Symbol that we don't care for the street graph

                    neigh_direction_x, neigh_direction_y = direction_of_arrows.get(neighbor_symbol, (0, 0))
                    if not (neigh_x + neigh_direction_x == x and neigh_y + neigh_direction_y == y): # If the neighbor arrow is not pointing towards us
                        graph[(x, y)].append((neigh_x, neigh_y))
        
            elif symbol == 'D':
                # Los destinos pueden ser alcanzados desde calles adir_yacentes
                for dir_x, dir_y in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                    neigh_x, neigh_y = x + dir_x, y + dir_y
                    if not (0 <= neigh_x < cols and 0 <= neigh_y < rows): continue

                    neighbor_symbol = grid[neigh_y][neigh_x]
                    if neighbor_symbol in ['>', '<', '^', 'v', 'S', 's']: # Adding the destination as a neighbor of the street or traffic light
                        graph[(neigh_x, neigh_y)].append((x, y))
    
    return graph, grid, grid_info




def find_path(graph, start, goal):
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
            path.append(start)
            path.reverse()
            return path
        for neighbor in graph.get(current, []):
            if neighbor not in visited:
                visited.add(neighbor)
                parent[neighbor] = current
                queue.append(neighbor)
    return None  # No se encontró camino


if __name__ == "__main__":
    # Construir el grafo
    graph, _, grid_info = build_graph("city_files/2022_base.txt")
    print(grid_info)
    start = (0, 0)

    # goal = (2, 9)
    goal = (3, 2)

    # Encontrar el camino
    path = find_path(graph, start, goal)

    # Mostrar el resultado
    if path:
        print("Camino encontrado:")
        for pos in path:
            print(pos)
    else:
        print("No se encontró un camino desde el inicio hasta el destino.")
