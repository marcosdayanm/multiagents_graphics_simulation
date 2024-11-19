# Back (Mesa Flask)

**Marcos Dayan A01782876**  
**José Manuel García Zumaya A01784238**

## Diseño de los agentes

### Coche (Car)

1. Atributos
   1. status: str
      1. calculating_route
      1. following_route
      1. arrived
   1. route: list[pair: int, pair: int]
   1. destination_coords: pair: int
1. Métodos
   1. calculate_route (Búsqueda con costo uniforme) -> list[pair: int, pair: int]

### Calle (Road)

1. Atributos
   1. directions: list[str]
   1. is_destination: bool
1. Métodos

### Semáforo (Traffic_Light)

1. Atributos
   1. directions: list[str]
   1. is_red: boolean
   1. status_count: int
1. Métodos

### Obstáculo (Obstacle)

1. Atributos
1. Métodos

## Model

### Funciones

1. read_map -> list[list[Agent]]

# Front (WebGL)
