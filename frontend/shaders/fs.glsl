#version 300 es
precision highp float;

// Entradas desde el vertex shader
in vec3 v_normal;
in vec3 v_lightDirection;
in vec3 v_cameraDirection;
in vec4 v_color;
in vec2 v_texCoord;

// Uniformes de iluminación
uniform vec4 u_ambientLight;
uniform vec4 u_diffuseLight;
uniform vec4 u_specularLight;

// Uniformes del material
uniform vec4 u_ambientColor;
uniform vec4 u_diffuseColor;
uniform vec4 u_specularColor;
uniform float u_shininess;

// Uniformes de texturas y colores
uniform sampler2D u_texture;
uniform bool u_useTexture;
uniform bool u_useColor;
uniform vec4 u_color;

// Salida final del color
out vec4 outColor;

void main() {
    // Normalizar los vectores interpolados
    vec3 n_normal = normalize(v_normal);
    vec3 n_lightDirection = normalize(v_lightDirection);
    vec3 n_cameraDirection = normalize(v_cameraDirection);

    // Componente ambiental
    vec4 ambient = u_ambientLight * u_ambientColor;

    // Componente difusa
    float lambert = max(dot(n_normal, n_lightDirection), 0.0);
    vec4 diffuse = u_diffuseLight * u_diffuseColor * lambert;

    // Componente especular
    vec3 halfVector = normalize(n_lightDirection + n_cameraDirection);
    float specAngle = max(dot(n_normal, halfVector), 0.0);
    vec4 specular = u_specularLight * u_specularColor * pow(specAngle, u_shininess);

    // Color base del objeto
    vec4 baseColor;
    if (u_useTexture) {
        baseColor = texture(u_texture, v_texCoord);
    } else if (u_useColor) {
        baseColor = u_color;
    } else {
        baseColor = v_color;
    }

    // Combinar el color base con la iluminación
    outColor = baseColor * (ambient + diffuse) + specular;
}
// #version 300 es
// precision highp float;

// in vec4 v_color;
// in vec2 v_texCoord;

// uniform sampler2D u_texture;
// uniform bool u_useTexture;

// uniform bool u_useColor;
// uniform vec4 u_color;


// out vec4 outColor;

// void main() {

//     if (u_useTexture) {
//         outColor = texture(u_texture, v_texCoord);
//     } 
//     else if (u_useColor) {
//         outColor = u_color;
//     }
//     else {
//         outColor = v_color;
//     }
// }