#version 300 es
in vec3 aVertexPosition;
in vec2 aTextureCoord;
out vec2 vTextureCoord;
uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

void main(void) {
    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
    vTextureCoord = aTextureCoord;
}