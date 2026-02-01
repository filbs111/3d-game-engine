#version 300 es
in vec3 aVertexPosition;
in vec3 aVertexNormal;

uniform mat4 uVMatrix;
uniform mat4 uMMatrix;
uniform mat4 uPMatrix;

uniform vec3 uFlatColor;
out vec3 vLightTimesColor;

void main(void) {
    gl_Position = uPMatrix * uVMatrix*uMMatrix * vec4(aVertexPosition, 1.0);

    //NOTE this is wierd because model matrix includes scale!
    // NOTE normalizing vector maybe is wrong for non-uniformly scaled objects. TODO fix, or just use unscaled objects.
    vec4 transformedNormal = (uMMatrix * vec4(aVertexNormal, 0.0));
    float light = 0.5+0.5*dot(normalize(transformedNormal), vec4(0.,1.,0.,0.));
    
    vLightTimesColor = uFlatColor * vec3(light);
}