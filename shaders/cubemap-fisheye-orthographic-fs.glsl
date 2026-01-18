#version 300 es
precision mediump float;
	
in vec2 vPos;
uniform samplerCube uSamplerCubeFisheye;
out vec4 fragColor;

void main(void) {
    
    float fromCentreSq = dot(vPos,vPos);

    //fromCentre = sin(ang), z component = cos(ang)

    float zComponent = sqrt(1. - fromCentreSq);
 
    vec3 pos3d = vec3(vPos, zComponent);
    
    fragColor = texture(uSamplerCubeFisheye, -pos3d);
}