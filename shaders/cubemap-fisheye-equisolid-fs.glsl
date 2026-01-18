#version 300 es
precision mediump float;
	
in vec2 vPos;
uniform samplerCube uSamplerCubeFisheye;
out vec4 fragColor;

void main(void) {
    
    float fromCentre = sqrt(dot(vPos,vPos));
    
    //y = 2sin(a/2)
    // where y is fromCentre.
    // reverse this 
    // a = 2asin(y/2)
    float ang = 2. * asin(fromCentre/2.);

    //vec3 pos3d = vec3(normalize(vPos)*, 1./tan(ang));
    vec3 pos3d = vec3(normalize(vPos), 1./tan(ang));    //proportional to above

    
    fragColor = texture(uSamplerCubeFisheye, -pos3d);
}