#version 300 es
precision mediump float;
	
in vec2 vPos;
uniform samplerCube uSamplerCubeFisheye;
uniform float uSimpleStrength;  // 0 for rectilinear projection, .25 this is equivalent to stereographic!

out vec4 fragColor;


void main(void) {

    float vPosMag = dot(vPos,vPos);

    float simpleParabolicZCoord = 1.-uSimpleStrength*vPosMag;    //simple barrel distortion

    vec3 pos3d = vec3(vPos, simpleParabolicZCoord);

    float vignette = 1. - .15*vPosMag;

    fragColor = vec4(vec3(vignette),1.)*texture(uSamplerCubeFisheye, -pos3d);
}