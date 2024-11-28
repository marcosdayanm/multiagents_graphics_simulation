#version 300 es

// Atributos
in vec4 a_position;
in vec3 a_normal;
in vec4 a_color;
in vec2 a_texCoord;

// Uniformes de transformación
uniform mat4 u_world;
uniform mat4 u_worldViewProjection;
uniform vec3 u_lightWorldPosition;
uniform vec3 u_viewWorldPosition;

// Salidas hacia el fragment shader
out vec3 v_normal;
out vec3 v_lightDirection;
out vec3 v_cameraDirection;
out vec4 v_color;
out vec2 v_texCoord;

void main() {
    // Posición transformada
    gl_Position = u_worldViewProjection * a_position;

    // Normal transformada
    v_normal = mat3(u_world) * a_normal;

    // Calcular direcciones para la luz y la cámara
    vec3 transformedPosition = (u_world * a_position).xyz;
    v_lightDirection = u_lightWorldPosition - transformedPosition;
    v_cameraDirection = u_viewWorldPosition - transformedPosition;

    // Pasar color y coordenadas de textura
    v_color = a_color;
    v_texCoord = a_texCoord;
}
// #version 300 es
// in vec4 a_position;
// in vec4 a_color;
// in vec2 a_texCoord; 

// uniform mat4 u_transforms;
// uniform mat4 u_matrix;

// out vec4 v_color;
// out vec2 v_texCoord;

// void main() {
//     v_texCoord = a_texCoord;
//     gl_Position = u_matrix * a_position;
//     v_color = a_color;
// }