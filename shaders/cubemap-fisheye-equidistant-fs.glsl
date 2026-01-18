#version 300 es
precision mediump float;
	
in vec2 vPos;
uniform samplerCube uSamplerCubeFisheye;
out vec4 fragColor;

void main(void) {
    
    float fromCentre = sqrt(dot(vPos,vPos));
    //take this as angle.
    //vec3 pos3d = vec3(vec2(sin(fromCentre))*normalize(vPos), cos(fromCentre));
        //equivalent to... 
    vec3 pos3d = vec3(normalize(vPos), 1./tan(fromCentre));

    
    fragColor = texture(uSamplerCubeFisheye, -pos3d);
}