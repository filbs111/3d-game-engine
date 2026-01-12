#version 300 es
in vec3 aVertexPosition;
in vec3 aVertexNormal;
in vec2 aTextureCoord;
out vec2 vTextureCoord;
out float vLight;
uniform mat4 uVMatrix;
uniform mat4 uMMatrix;
uniform mat4 uPMatrix;

void main(void) {
    gl_Position = uPMatrix * uVMatrix*uMMatrix* vec4(aVertexPosition, 1.0);
    vTextureCoord = aTextureCoord;
    
    //NOTE this is wierd because model matrix includes scale!
    // NOTE normalizing vector maybe is wrong for non-unifoprmly scaled objects. TODO fix, or just use unscaled objects.
    vec4 transformedNormal = (uMMatrix * vec4(aVertexNormal, 0.0));
    vLight = 0.5+0.5*dot(normalize(transformedNormal), vec4(0.,1.,0.,0.));
}