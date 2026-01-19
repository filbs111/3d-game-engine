#version 300 es
precision mediump float;
	
in vec2 vPos;
uniform samplerCube uSamplerCubeFisheye;
uniform float uSimpleStrength;  // 0 for rectilinear projection, .25 this is equivalent to stereographic!

out vec4 fragColor;


void main(void) {
    float simpleParabolicZCoord = 1.-uSimpleStrength*dot(vPos,vPos);    //simple barrel distortion

    vec3 pos3d = vec3(vPos, simpleParabolicZCoord);

    fragColor = texture(uSamplerCubeFisheye, -pos3d);
}