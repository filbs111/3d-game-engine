#version 300 es
precision mediump float;
	
in vec2 vPos;
uniform samplerCube uSamplerCubeFisheye;
out vec4 fragColor;

void main(void) {
    //float simpleParabolicZCoord = 1.;   //reproduce rectilinear projection

    float simpleParabolicZCoord = 1.-0.15*dot(vPos,vPos);    //simple barrel distortion

    vec3 pos3d = vec3(vPos, simpleParabolicZCoord);

    fragColor = texture(uSamplerCubeFisheye, -pos3d);
}