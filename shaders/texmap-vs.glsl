#version 300 es
in vec3 aVertexPosition;
in vec3 aVertexNormal;
in vec2 aTextureCoord;
out vec2 vTextureCoord;
out vec3 vLight;
uniform mat4 uVMatrix;
uniform mat4 uMMatrix;
uniform mat4 uPMatrix;

uniform vec3 uLightDirection;

void main(void) {
    gl_Position = uPMatrix * uVMatrix*uMMatrix* vec4(aVertexPosition, 1.0);
    vTextureCoord = aTextureCoord;
    
    //NOTE this is wierd because model matrix includes scale!
    // NOTE normalizing vector maybe is wrong for non-unifoprmly scaled objects. TODO fix, or just use unscaled objects.
    vec4 transformedNormal = (uMMatrix * vec4(aVertexNormal, 0.0));
    float vLightScalar = 0.5+0.5*dot(normalize(transformedNormal.xyz), uLightDirection);
    vLight = vec3(vLightScalar);
}