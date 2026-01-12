#version 300 es
precision mediump float;
	
in vec3 vPos;
uniform samplerCube uSamplerCube;
uniform vec3 uCentrePos;
out vec4 fragColor;

void main(void) {
    vec3 vPosOut = normalize(vPos);
    vPosOut += vec3(uCentrePos.x, -uCentrePos.y, -uCentrePos.z);
    
    fragColor = texture(uSamplerCube, vPosOut);
}