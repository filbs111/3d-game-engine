#version 300 es
in vec3 aVertexPosition;
in vec2 aTextureCoord;
in vec3 aVertexColor;
in vec3 aVertexNormal;

uniform mat4 uVMatrix;
uniform mat4 uMMatrix;
uniform mat4 uPMatrix;

uniform vec3 uFlatColor;

out vec2 vTextureCoord;
out vec3 vLight;

void main(void) {

    vec4 worldCoord = uMMatrix * vec4(aVertexPosition, 1.0);

    gl_Position = uPMatrix * uVMatrix*worldCoord;
    vTextureCoord = aTextureCoord;

    //NOTE this is wierd because model matrix includes scale!
    // NOTE normalizing vector maybe is wrong for non-uniformly scaled objects. TODO fix, or just use unscaled objects.
    vec4 transformedNormal = normalize(uMMatrix * vec4(aVertexNormal, 0.0));

    //diffuse component
    float baselineBrightness = 0.05;
    float halfColorRange = .5*(1. - baselineBrightness);
    float colorMiddle = baselineBrightness + halfColorRange;

    float light = colorMiddle+halfColorRange*dot(normalize(transformedNormal), vec4(0.,1.,0.,0.));
    vLight = uFlatColor*aVertexColor * vec3(light);   //TODO use vert color just for ambient?
}
