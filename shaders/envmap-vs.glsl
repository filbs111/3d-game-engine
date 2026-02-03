#version 300 es
in vec3 aVertexPosition;
in vec3 aVertexNormal;

uniform mat4 uVMatrix;
uniform mat4 uMMatrix;
uniform mat4 uPMatrix;

uniform vec3 uFlatColor;
out vec3 vLightTimesColor;
out vec3 vReflectedVec;  //don't need last component

void main(void) {

    vec4 worldCoord = uMMatrix * vec4(aVertexPosition, 1.0);

    gl_Position = uPMatrix * uVMatrix*worldCoord;

    //NOTE this is wierd because model matrix includes scale!
    // NOTE normalizing vector maybe is wrong for non-uniformly scaled objects. TODO fix, or just use unscaled objects.
    vec4 transformedNormal = (uMMatrix * vec4(aVertexNormal, 0.0));

    //diffuse component
    float light = 0.5+0.5*dot(normalize(transformedNormal), vec4(0.,1.,0.,0.));
    vLightTimesColor = uFlatColor * vec3(light);

    //reflected vector - use this to blend env map in frag shader.
    //take vector from eye to point in world frame, add 2n * dotProd
    //vec3 eyeToPoint = worldCoord.xyz - uVMatrix[3].xyz;
    vec3 eyeToPoint = worldCoord.xyz - inverse(uVMatrix)[3].xyz;    //TODO avoid inverse here - pass in 3vec as separate uniform

    vReflectedVec = eyeToPoint - 2.*transformedNormal.xyz*dot(transformedNormal.xyz, eyeToPoint);

    vReflectedVec.z = -vReflectedVec.z; //?? likely to be consistent with cube background happens to be
}