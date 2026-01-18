#version 300 es
precision mediump float;
	
in vec2 vPos;
uniform samplerCube uSamplerCubeFisheye;
out vec4 fragColor;

void main(void) {
    
    float fromCentre = sqrt(dot(vPos,vPos));

    fromCentre*=0.5;    //not sure why. to make consistent with other mappings in centre.

    //take this as angle.

    //= y=tan(a/2) , where y is distance from centre.
    //reverse this. 
    // a =2atan(y)
    // IIRC this has a simpler formulation

    float ang = 2. * atan(fromCentre);


    //vec3 pos3d = vec3(normalize(vPos)*sin(ang), cos(ang));
    vec3 pos3d = vec3(normalize(vPos), 1./tan(ang));     //proportional to above

    
    fragColor = texture(uSamplerCubeFisheye, -pos3d);
}