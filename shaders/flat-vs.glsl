#version 300 es
in vec3 aVertexPosition;
uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

out vec3 vColor;

void main(void) {
    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
    vColor = aVertexPosition;
}