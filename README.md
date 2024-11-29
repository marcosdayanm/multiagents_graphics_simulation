# Movilidad Urbana

**Marcos Dayan A01782876**  
**José Manuel García Zumaya A01784238**

## Problema

El problema a la movilidad urbana de hace unas décadas se resolvió construyendo autopistas, vías de alta velocidad, carreteras, y calles urbanas con cierta capacidad proyectada en la época. Cada vez es más común moverse con un vehículo motorizado ya sea particular o público, por lo que el tránsito y la concurrencia en las vías aumenta cada año de manera exponencial, aumentando la contaminación generada por los vehículos, el tráfico, y saturando las vías.

## Solución propuesta

Ante esta problemática que no se detendrá y cada año aumentará, es urgente buscar soluciones innovadoras que ayuden a disminuir el tráfico y hagan una movilidad más sostenible. Proponemos abordar este desafío con la implementación de una simulación de multiagentes que represente gráficamente el tráfico actual dominado por los automóviles. Esta herramienta permitirá analizar y comprender mejor la situación presente, y en el futuro, será posible modelar diferentes métodos de transporte innovadores sobre croquis reales de ciudades que se podrán alimentar a la simulación. De esta manera, se podrán diseñar estrategias y probarlas en tiempo real con condiciones similares a las del entrono, para mejorar la movilidad urbana en México.

## Tecnologías usadas para el entorno de simulación

- Mesa v2.4.0
- Flask v3.1.0
- Vite v5.3.4
- TWGL v5.5.4
- lil-gui: v0.19.2

## Diseño de los agentes

### Coche (Car)

#### Diseño del Agente

##### Objetivos

- Alcanzar el destino asignado en el menor tiempo posible.
- Reducir la congestión vehicular interactuando de manera eficiente con otros coches y semáforos.
- Contribuir al flujo óptimo del tráfico en la simulación urbana.

##### Capacidades Efectoras

- Movimiento: Desplazarse en la cuadrícula siguiendo una ruta.
- Cambio de Dirección: Adaptar su orientación segpun se mueva.
- Recálculo de Ruta: Modificar su trayectoria en tiempo real para evitar cuellos de botella o en caso de estar en un bloqueo.
- Interacción con el Entorno:
  - Evitar otros coches.
  - Respetar semáforos.
  - Entrar a su destino.

##### Percepción

- Entorno Local:
  - Estado de las celdas adyacentes, contenido de las celdas: coches, semáforos, calles, destinos.
  - Registro de celdas visitadas para prevenir regresar a esa celda
  - Estado del semáforo en la posición actual y en las celdas vecinas.
- Entorno global:
  - Estructura del grafo de calles para calcular la ruta más óptima al destino.
  - Coordenadas de su destino.

##### Proactividad

- Calcula la ruta más corta hacia su destino al iniciar la simulación o al detectar bloqueos.
- Identifica posibles bloqueos semáforos o tráfico y toma decisiones anticipadas para evitarlos y esperar a que se desbloquee para avanzar.
- Usa estrategias como movimientos temporales y recálculo de rutas para no perjudicar el flujo de los demás coches

##### Reactividad

- Responde de manera dinámica coches bloqueando su camino.
- Toma acciones dependiendo el estado de los semáforos.
- Recalcula la ruta nuevamente cuando lo considera necesario con un criterio para ser eficiente en recursos.

##### Métricas de desempeño

- Pasos promedio para que un coche llegue al destino.
- Cantidad total de coches generados.
- Cantidad de coches en la calle.
- Cantidad total de coches que llegan a su destino.

##### Restricciones

- Un agente debe respetar las reglas de tráfico, evitar choques y respetar semáforos.
- Un agente no puede ir en reversa ni moverse en sentido contrario al sentido de las calles.
- La generación de coches desde las esquinas no debe se ser interrumpida. En ese caso, la simulación se detendrá

#### PEAS

##### P

- Minimizar el tiempo total para llegar al destino.
- Reducir la congestión vehicular evitando bloqueos en semáforos y carreteras.
- Mantener un flujo continuo de tráfico.
- Cumplir con la ruta hacia el destino asignado respetando las reglas del sistema (como luces rojas en semáforos).

##### E

- Calles: Representadas como nodos y conexiones en el grafo street_graph.
- Semáforos: Controlan el flujo de los coches (rojo, amarillo, verde).
- Otros agentes: Interactúan dinámicamente con el agente.
- Destinos: Puntos de destino asignados para los agentes.

##### A

- Movimiento en la cuadrícula del modelo.
- Cambio de dirección.
- Recalculo de rutas (modificación interna de su comportamiento para evitar congestión).

##### S

- Percepción de contenido de las celdas adyacentes (otros coches, semáforos, destinos, calles).
- Estado actual del semáforo en la posición del agente.
- Información del grafo de calles (street_graph) para calcular rutas.

#### Arquitectura de Subsunción

**Entre mayor el número, mayor la prioridad**

##### Calcular Ruta

Generar la ruta inicial o recalcular en caso de necesitar ajustes debido a cambios en el entorno.

##### Seguir la Ruta

Moverse en la cuadrícula siguiendo la ruta más corta hacia el destino.

##### Evitar Congestión

Identificar bloqueos por otros coches o semáforos y recalcular rutas o usar estrategias para evitar cuellos de botella y cerrarsele a otros coches, siendo conscientes del entorno y contribuyendo a un mejor flujo de vehículos aunque se sacrifique ligeramente seguir la ruta religiosamente

### Próximamente otros agentes....

## Conclusiones

### Marcos Dayan

La implementación de esta simulación de movilidad urbana no solo permitió desarrollar un sistema multiagente eficiente, sino que también representó un gran desafío en cuanto al diseño de los agentes, elección e implementación de algoritmos para que puedan completar sus objetivos de la manera más eficiente y la representación gráfica en tiempo real de lo que pasa en la simulación. En el ámbito de los agentes, el reto principal fue diseñar una lógica permita a los agentes tomar decisiones dinámicas e inteligentes, calcular la ruta más eficiente para llegar a su destino y recalcular rutas en tiempo real para evitar bloqueos en semáforos, optimizando el flujo vehicular. Por otro lado, en la parte gráfica con WebGL, los principales obstáculos fueron la iluminación y la visualización dinámica de los agentes y el entorno, los cuales se resolvieron empleando operaciones de matrices, modelos de iluminación como el de Phong, y usando librerías como twgl para la construcción de los shaders y todo el flujo del cálculo de las transformaciones de los elementos de la escena.

Estas herramientas no solo son valiosas para analizar y mejorar la movilidad urbana, sino que también tienes aplicaciones en una variedad de entornos simulados. Estuve pensando mucho durante el periodo del bloque en cómo lo aplicaría en áreas como el diseño de flujos de trabajo eficientes en fábricas, la optimización de cadenas de suministro, cocinas industriales, líneas de producción, o incluso el manejo logístico de un aeropuerto. Este tipo de simulaciones pueden ahorrar millones de pesos al prever problemas y mejorar procesos en tiempo real. Además, su flexibilidad permite modelar escenarios complejos como cocinas industriales, líneas de producción, o incluso el manejo logístico de un aeropuerto, demostrando su impacto y relevancia en diversas industrias.

### José Manuel

Trabajar en esta simulación fue una experiencia enriquecedora que me permitió aprender y reforzar conocimientos en diversos temas. En primer lugar, pude volver a practicar conceptos fundamentales de Python, ya que hacía tiempo que no utilizaba el lenguaje. Aprendí sobre el manejo de listas, la creación de un servidor con Flask, el uso de clases y otros aspectos clave. Además, trabajar con la librería Mesa fue fundamental para comprender conceptos relacionados con agentes y modelos, lo cual amplió mi perspectiva sobre simulaciones basadas en agentes.

Para esta implementación, comenzamos identificando los agentes necesarios y definiendo los atributos que cada uno debía tener para cumplir con los requerimientos del proyecto. Posteriormente, diseñamos el modelo y determinamos los atributos necesarios para implementarlo de manera eficiente. Trabajamos simultáneamente en el backend (con Mesa) y en el frontend (usando WebGL). Personalmente, me enfoqué en la parte de WebGL, lo que resultó en un aprendizaje significativo, ya que pude aplicar conceptos como transformaciones, manejo de figuras, vértices y vectores. Aunque al principio fue un desafío comprender cada uno de estos conceptos, finalmente logré cumplir con los requisitos, como orientar calles, colocar edificios, rotar los coches y manejar el cambio de color de los semáforos, entre otros.

En general, este proyecto fue un bloque de aprendizaje profundo y desafiante, pero muy gratificante.
