#version 300 es
precision mediump float;

in vec2 vPos;
uniform samplerCube uSamplerCubeFisheye;
out vec4 fragColor;

uniform float uK;

void main(void) {

    //special mapping something like R = sin(theta) / ( k + cos(theta))
    // think this makes angle preserving when viewed from some arbitrary distance from screen - 
    // when k=1 gets stereographic, k=0 gets rectilinear.
    // similar to tan(k theta) (same at these extremes), but not quite!
    // using this in 3sphere project.
    // calculated there independently. here present inversion from just asking copilot! hope same. 
    // invert this to get
    // theta = acos( -k R / root( RR +1 )) - atan(1/R)

    float bodge = 1./(1.+uK);    //guess to get centre scaling consistent

    float fromCentreSq = dot(vPos,vPos);
    float fromCentre = sqrt(fromCentreSq);

    fromCentre*=bodge;
    fromCentreSq*=bodge*bodge;

    float ang = acos(-uK* fromCentre /sqrt (fromCentreSq+1.)) - atan(1./fromCentre);
    
    

    vec3 pos3d = vec3(normalize(vPos), 1./tan(ang));

    fragColor = texture(uSamplerCubeFisheye, -pos3d);
}