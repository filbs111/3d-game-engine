#version 300 es
precision mediump float;
	
in vec2 vPos;
uniform samplerCube uSamplerCubeFisheye;
out vec4 fragColor;

void main(void) {
    float fisheyeMultiplier = 0.2;
        // 0 for rectilinear projection
        // .25 this is equivalent to stereographic!

    float simpleParabolicZCoord = 1.-fisheyeMultiplier*dot(vPos,vPos);    //simple barrel distortion

    vec3 pos3d = vec3(vPos, simpleParabolicZCoord);

    fragColor = texture(uSamplerCubeFisheye, -pos3d);
}