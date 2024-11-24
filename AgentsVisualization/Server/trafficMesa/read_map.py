from collections import deque

def build_graph(grid_file_path: str): 
    with open(grid_file_path, 'r', encoding='utf-8') as file:
        map_text = [line.rstrip('\n') for line in file]
    grid = [list(line) for line in map_text]

    rows = len(grid)
    cols = len(grid[0])

    graph = {} # Adjacency list dictionary (node -> list of neighbors) for representing the graph
    grid_info = {
        "destinations": [],
    }

    # representing the direction each arrow or symbol points to
    street_letters_direction = {
        '>': (1, 0),
        '<': (-1, 0),
        '^': (0, 1),
        'v': (0, -1), # Inverting the direction of the arrow since the y-axis is inverted in the mesa grid
        'S': (0, 0),
        's': (0, 0),
        'D': (0, 0),
    }
    # Here we are inicializing the graph with each possible node on it, but without connections
    for y in range(rows):
        for x in range(cols):
            symbol = grid[y][x]
            mesa_y = rows - 1 - y  
            position = (x, mesa_y)
            if symbol in ['>', '<', '^', 'v', 'S', 's', 'D']:
                graph[position] = []
                if symbol == 'D':
                    grid_info["destinations"].append(position)  # Store destination positions

    # Now we are going to add the connections between the nodes
    for y in range(rows):
        for x in range(cols):
            symbol = grid[y][x]
            mesa_y = rows - 1 - y  
            position = (x, mesa_y)
            if symbol in ['>', '<', '^', 'v', 'S', 's']: # From a street, we can move to any adjacent cell that does not have an arrow pointing towards us

                for dir_x, dir_y in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                    neigh_x, neigh_y = x + dir_x, y + dir_y

                    if not (0 <= neigh_x < cols and 0 <= neigh_y < rows): continue # Neighbor out of bounds
                    neighbor_symbol = grid[neigh_y][neigh_x]
                    if neighbor_symbol not in ['>', '<', '^', 'v', 'S', 's', 'D']: continue # Symbol that we don't care for the street graph

                    mesa_neigh_y = rows - 1 - neigh_y
                    neighbor_position = (neigh_x, mesa_neigh_y)
                    neigh_direction_x, neigh_direction_y = street_letters_direction.get(neighbor_symbol, (0, 0))

                    if not (neigh_x + neigh_direction_x == x and mesa_neigh_y + neigh_direction_y == mesa_y): # If the neighbor arrow is not pointing towards us
                        graph[position].append(neighbor_position)
        
            elif symbol == 'D':
                # Los destinos pueden ser alcanzados desde calles adir_yacentes
                for dir_x, dir_y in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                    neigh_x, neigh_y = x + dir_x, y + dir_y
                    if not (0 <= neigh_x < cols and 0 <= neigh_y < rows): continue

                    neighbor_symbol = grid[neigh_y][neigh_x]

                    if neighbor_symbol in ['>', '<', '^', 'v', 'S', 's']: # Adding the destination as a neighbor of the street or traffic light
                        mesa_neigh_y = rows - 1 - neigh_y
                        neighbor_position = (neigh_x, mesa_neigh_y)
                        graph[neighbor_position].append(position)
    
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
    graph, grid, grid_info = build_graph("city_files/2022_base.txt")
    
    # for line in grid:
    #     for cell in line:
    #         print(cell, end="")
    #     print()

    print(grid_info)
    
    # las coordenadas ya tienen su origen en la esquina inferior izquierda porque ya hicimos los ajustes de mesa
    start = (0, 0)
    # goal = (2, 9)
    # goal = (3, 2)
    goal = (5, 4)

    # Encontrar el camino
    path = find_path(graph, start, goal)

    # Mostrar el resultado
    if path:
        print("Camino encontrado:")
        for pos in path:
            print(pos)
    else:
        print(f"No se encontró un camino desde {start} hasta {goal}")
