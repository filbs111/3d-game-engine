#version 300 es
precision mediump float;
	
in vec2 vPos;
uniform samplerCube uSamplerCubeFisheye;
out vec4 fragColor;

void main(void) {
    //simple - reproduce rectilinear projection

    vec3 pos3d = vec3(vPos, 1.0);
    
    fragColor = texture(uSamplerCubeFisheye, -pos3d);
}