#version 300 es
in vec4 a_position;
in vec4 a_color;
in vec2 a_texCoord; 

uniform mat4 u_transforms;
uniform mat4 u_matrix;

out vec4 v_color;
out vec2 v_texCoord;

void main() {
    v_texCoord = a_texCoord;
    gl_Position = u_matrix * a_position;
    v_color = a_color;
}