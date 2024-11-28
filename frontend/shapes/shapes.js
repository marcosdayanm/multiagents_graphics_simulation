// Function to rotate the texture coordinates of a shape and give the appearance of
// different orientations of the shape.
async function rotateTexCoords(a_texCoord_data, rotation_right) {
  // Asegurar que la lista tenga un número de elementos divisible por 2
  if (a_texCoord_data.length % 2 !== 0) {
    console.error("El tamaño de a_texCoord_data debe ser divisible por 2");
    return a_texCoord_data;
  }

  // Calcular el número real de posiciones a rotar
  const numCoords = a_texCoord_data.length / 2; // Número de pares
  const rotationSteps = (rotation_right * 2) % a_texCoord_data.length; // Ajustar por tamaño de la lista

  if (rotationSteps > 0) {
    // Realizar la rotación hacia la derecha
    // console.log("Rotando", rotationSteps, "posiciones a la derecha");
    const rotatedData = [
      ...a_texCoord_data.slice(-rotationSteps), // Elementos al final
      ...a_texCoord_data.slice(0, -rotationSteps), // Elementos al inicio
    ];
    return rotatedData;
  }

  // Si no hay rotación, devolver la lista original
  return a_texCoord_data;
}

export async function generateRoadData(size, orientation) {
  let a_texCoord_data = [
    0.0,
    0.0, // Coordenada de textura para el vértice inferior izquierdo
    1.0,
    0.0, // Coordenada de textura para el vértice inferior derecho
    1.0,
    1.0, // Coordenada de textura para el vértice superior derecho
    0.0,
    1.0, // Coordenada de textura para el vértice superior izquierdo
  ];

  console.log("Orientation", orientation);

  // The orientation is defined by a list of 3 elements,
  // where the first element is the number is the number of rotations to "left",
  // the second element is the position in y-axis, since the texture is in 2d we ignore
  // this value, and the third element is the rotations to "right". (x, y, z), in WebGL
  // y-axis is the vertical axis.

  // So the number indicate the number of 90 degrees rotations to the left or right
  // of the texture.

  // We can ignore the rotation left since the original values of the texture are already "left"
  // so we only use the rotation right.
  let rotation_right = orientation[2];

  a_texCoord_data = await rotateTexCoords(a_texCoord_data, rotation_right);

  let arrays = {
    a_position: {
      numComponents: 3,
      data: [
        -0.5,
        0.0,
        -0.5, // Vértice inferior izquierdo
        0.5,
        0.0,
        -0.5, // Vértice inferior derecho
        0.5,
        0.0,
        0.5, // Vértice superior derecho
        -0.5,
        0.0,
        0.5, // Vértice superior izquierdo
      ].map((e) => size * e),
    },
    a_texCoord: {
      numComponents: 2,
      data: a_texCoord_data,
    },
    // a_color: {
    //   numComponents: 4,
    //   data: [
    //     ...color, // Color para el vértice inferior izquierdo
    //     ...color, // Color para el vértice inferior derecho
    //     ...color, // Color para el vértice superior derecho
    //     ...color, // Color para el vértice superior izquierdo
    //   ],
    // },
    a_normal: {
      numComponents: 3,
      data: [
        0.0,
        1.0,
        0.0, // Normal para el vértice inferior izquierdo
        0.0,
        1.0,
        0.0, // Normal para el vértice inferior derecho
        0.0,
        1.0,
        0.0, // Normal para el vértice superior derecho
        0.0,
        1.0,
        0.0, // Normal para el vértice superior izquierdo
      ],
    },
    indices: {
      numComponents: 3,
      data: [
        0,
        1,
        2, // Primer triángulo del cuadrado
        0,
        2,
        3, // Segundo triángulo del cuadrado
      ],
    },
  };

  return arrays;
}

export function generateData(
  size,
  isDestination = false,
  isTrafficLight = false
) {
  const color = isTrafficLight
    ? [0.0, 1.0, 0.0, 1.0] // Verde
    : isDestination
    ? [1.0, 0.5, 0.0, 1.0] // Naranja
    : [0.5, 0.5, 0.5, 1.0]; // Gris

  let arrays = {
    a_position: {
      numComponents: 3,
      data: [
        -0.5,
        0.0,
        -0.5, // Vértice inferior izquierdo
        0.5,
        0.0,
        -0.5, // Vértice inferior derecho
        0.5,
        0.0,
        0.5, // Vértice superior derecho
        -0.5,
        0.0,
        0.5, // Vértice superior izquierdo
      ].map((e) => size * e),
    },
    a_texCoord: {
      numComponents: 2,
      data: [
        0.0,
        0.0, // Coordenada de textura para el vértice inferior izquierdo
        1.0,
        0.0, // Coordenada de textura para el vértice inferior derecho
        1.0,
        1.0, // Coordenada de textura para el vértice superior derecho
        0.0,
        1.0, // Coordenada de textura para el vértice superior izquierdo
      ],
    },
    a_color: {
      numComponents: 4,
      data: [
        ...color, // Color para el vértice inferior izquierdo
        ...color, // Color para el vértice inferior derecho
        ...color, // Color para el vértice superior derecho
        ...color, // Color para el vértice superior izquierdo
      ],
    },
    a_normal: {
      numComponents: 3,
      data: [
        0.0,
        1.0,
        0.0, // Normal para el vértice inferior izquierdo
        0.0,
        1.0,
        0.0, // Normal para el vértice inferior derecho
        0.0,
        1.0,
        0.0, // Normal para el vértice superior derecho
        0.0,
        1.0,
        0.0, // Normal para el vértice superior izquierdo
      ],
    },
    indices: {
      numComponents: 3,
      data: [
        0,
        1,
        2, // Primer triángulo del cuadrado
        0,
        2,
        3, // Segundo triángulo del cuadrado
      ],
    },
  };

  return arrays;
}

export function generateObstacleData(size) {
  let arrays = {
    a_position: {
      numComponents: 3,
      data: [
        // Front Face
        -0.5,
        -0.5 + 0.5,
        0.5,
        0.5,
        -0.5 + 0.5,
        0.5,
        0.5,
        0.5 + 0.5,
        0.5,
        -0.5,
        0.5 + 0.5,
        0.5,

        // Back face
        -0.5,
        -0.5 + 0.5,
        -0.5,
        -0.5,
        0.5 + 0.5,
        -0.5,
        0.5,
        0.5 + 0.5,
        -0.5,
        0.5,
        -0.5 + 0.5,
        -0.5,

        // Top face
        -0.5,
        0.5 + 0.5,
        -0.5,
        -0.5,
        0.5 + 0.5,
        0.5,
        0.5,
        0.5 + 0.5,
        0.5,
        0.5,
        0.5 + 0.5,
        -0.5,

        // Bottom face
        -0.5,
        -0.5 + 0.5,
        -0.5,
        0.5,
        -0.5 + 0.5,
        -0.5,
        0.5,
        -0.5 + 0.5,
        0.5,
        -0.5,
        -0.5 + 0.5,
        0.5,

        // Right face
        0.5,
        -0.5 + 0.5,
        -0.5,
        0.5,
        0.5 + 0.5,
        -0.5,
        0.5,
        0.5 + 0.5,
        0.5,
        0.5,
        -0.5 + 0.5,
        0.5,

        // Left face
        -0.5,
        -0.5 + 0.5,
        -0.5,
        -0.5,
        -0.5 + 0.5,
        0.5,
        -0.5,
        0.5 + 0.5,
        0.5,
        -0.5,
        0.5 + 0.5,
        -0.5,
      ].map((e) => size * e),
    },
    a_normal: {
      numComponents: 3,
      data: [
        // Front face
        0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,

        // Back face
        0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,

        // Top face
        0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,

        // Bottom face
        0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,

        // Right face
        1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,

        // Left face
        -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
      ],
    },
    a_color: {
      numComponents: 4,
      data: [
        // Assign the same color as before
        ...Array(24)
          .fill(0.2)
          .flatMap((val) => [val, val, val, 1]),
      ],
    },
    indices: {
      numComponents: 3,
      data: [
        0,
        1,
        2,
        0,
        2,
        3, // Front face
        4,
        5,
        6,
        4,
        6,
        7, // Back face
        8,
        9,
        10,
        8,
        10,
        11, // Top face
        12,
        13,
        14,
        12,
        14,
        15, // Bottom face
        16,
        17,
        18,
        16,
        18,
        19, // Right face
        20,
        21,
        22,
        20,
        22,
        23, // Left face
      ],
    },
  };

  return arrays;
}
// export function generateObstacleData(size) {
//   let arrays = {
//     a_position: {
//       numComponents: 3,
//       data: [
//         // Front Face
//         -0.5,
//         -0.5 + 0.5,
//         0.5,
//         0.5,
//         -0.5 + 0.5,
//         0.5,
//         0.5,
//         0.5 + 0.5,
//         0.5,
//         -0.5,
//         0.5 + 0.5,
//         0.5,

//         // Back face
//         -0.5,
//         -0.5 + 0.5,
//         -0.5,
//         -0.5,
//         0.5 + 0.5,
//         -0.5,
//         0.5,
//         0.5 + 0.5,
//         -0.5,
//         0.5,
//         -0.5 + 0.5,
//         -0.5,

//         // Top face
//         -0.5,
//         0.5 + 0.5,
//         -0.5,
//         -0.5,
//         0.5 + 0.5,
//         0.5,
//         0.5,
//         0.5 + 0.5,
//         0.5,
//         0.5,
//         0.5 + 0.5,
//         -0.5,

//         // Bottom face
//         -0.5,
//         -0.5 + 0.5,
//         -0.5,
//         0.5,
//         -0.5 + 0.5,
//         -0.5,
//         0.5,
//         -0.5 + 0.5,
//         0.5,
//         -0.5,
//         -0.5 + 0.5,
//         0.5,

//         // Right face
//         0.5,
//         -0.5 + 0.5,
//         -0.5,
//         0.5,
//         0.5 + 0.5,
//         -0.5,
//         0.5,
//         0.5 + 0.5,
//         0.5,
//         0.5,
//         -0.5 + 0.5,
//         0.5,

//         // Left face
//         -0.5,
//         -0.5 + 0.5,
//         -0.5,
//         -0.5,
//         -0.5 + 0.5,
//         0.5,
//         -0.5,
//         0.5 + 0.5,
//         0.5,
//         -0.5,
//         0.5 + 0.5,
//         -0.5,
//       ] /* .map((e) => size * e) */,
//     },
//     a_color: {
//       numComponents: 4,
//       data: [
//         // Front face
//         0.2,
//         0.2,
//         0.2,
//         1, // v_1
//         0.2,
//         0.2,
//         0.2,
//         1, // v_1
//         0.2,
//         0.2,
//         0.2,
//         1, // v_1
//         0.2,
//         0.2,
//         0.2,
//         1, // v_1

//         // Back Face
//         0.2,
//         0.2,
//         0.2,
//         1, // v_2
//         0.2,
//         0.2,
//         0.2,
//         1, // v_2
//         0.2,
//         0.2,
//         0.2,
//         1, // v_2
//         0.2,
//         0.2,
//         0.2,
//         1, // v_2

//         // Top Face
//         0.2,
//         0.2,
//         0.2,
//         1, // v_3
//         0.2,
//         0.2,
//         0.2,
//         1, // v_3
//         0.2,
//         0.2,
//         0.2,
//         1, // v_3
//         0.2,
//         0.2,
//         0.2,
//         1, // v_3

//         // Bottom Face
//         0.2,
//         0.2,
//         0.2,
//         1, // v_4
//         0.2,
//         0.2,
//         0.2,
//         1, // v_4
//         0.2,
//         0.2,
//         0.2,
//         1, // v_4
//         0.2,
//         0.2,
//         0.2,
//         1, // v_4

//         // Right Face
//         0.2,
//         0.2,
//         0.2,
//         1, // v_5
//         0.2,
//         0.2,
//         0.2,
//         1, // v_5
//         0.2,
//         0.2,
//         0.2,
//         1, // v_5
//         0.2,
//         0.2,
//         0.2,
//         1, // v_5

//         // Left Face
//         0.2,
//         0.2,
//         0.2,
//         1, // v_6
//         0.2,
//         0.2,
//         0.2,
//         1, // v_6
//         0.2,
//         0.2,
//         0.2,
//         1, // v_6
//         0.2,
//         0.2,
//         0.2,
//         1, // v_6
//       ],
//     },
//     indices: {
//       numComponents: 3,
//       data: [
//         0,
//         1,
//         2,
//         0,
//         2,
//         3, // Front face
//         4,
//         5,
//         6,
//         4,
//         6,
//         7, // Back face
//         8,
//         9,
//         10,
//         8,
//         10,
//         11, // Top face
//         12,
//         13,
//         14,
//         12,
//         14,
//         15, // Bottom face
//         16,
//         17,
//         18,
//         16,
//         18,
//         19, // Right face
//         20,
//         21,
//         22,
//         20,
//         22,
//         23, // Left face
//       ],
//     },
//   };
//   return arrays;
// }

export function generateTrafficLightData(
  size,
  is_red = false,
  is_yellow = false
) {
  // Determinar el color según los booleanos
  const color = is_red
    ? [1.0, 0.0, 0.0, 1.0] // Rojo
    : is_yellow
    ? [1.0, 1.0, 0.0, 1.0] // Amarillo
    : [0.0, 1.0, 0.0, 1.0]; // Verde por defecto

  let arrays = {
    a_position: {
      numComponents: 3,
      data: [
        -0.5,
        0.0,
        -0.5, // Vértice inferior izquierdo
        0.5,
        0.0,
        -0.5, // Vértice inferior derecho
        0.5,
        0.0,
        0.5, // Vértice superior derecho
        -0.5,
        0.0,
        0.5, // Vértice superior izquierdo
      ].map((e) => size * e),
    },
    a_texCoord: {
      numComponents: 2,
      data: [
        0.0,
        0.0, // Coordenada de textura para el vértice inferior izquierdo
        1.0,
        0.0, // Coordenada de textura para el vértice inferior derecho
        1.0,
        1.0, // Coordenada de textura para el vértice superior derecho
        0.0,
        1.0, // Coordenada de textura para el vértice superior izquierdo
      ],
    },
    a_color: {
      numComponents: 4,
      data: [
        ...color, // Color para el vértice inferior izquierdo
        ...color, // Color para el vértice inferior derecho
        ...color, // Color para el vértice superior derecho
        ...color, // Color para el vértice superior izquierdo
      ],
    },
    a_normal: {
      numComponents: 3,
      data: [
        0.0,
        1.0,
        0.0, // Normal para el vértice inferior izquierdo
        0.0,
        1.0,
        0.0, // Normal para el vértice inferior derecho
        0.0,
        1.0,
        0.0, // Normal para el vértice superior derecho
        0.0,
        1.0,
        0.0, // Normal para el vértice superior izquierdo
      ],
    },
    indices: {
      numComponents: 3,
      data: [
        0,
        1,
        2, // Primer triángulo del cuadrado
        0,
        2,
        3, // Segundo triángulo del cuadrado
      ],
    },
  };

  return arrays;
}
