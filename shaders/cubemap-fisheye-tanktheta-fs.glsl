#version 300 es
precision mediump float;

in vec2 vPos;
uniform samplerCube uSamplerCubeFisheye;
out vec4 fragColor;

uniform float uK;

void main(void) {

    //basically for things where position on screen is proportional to tan(k * angle)
    //where angle is from straight ahead in the world picture is taken of.
    //from https://wiki.panotools.org/Fisheye_Projection
    // when k=0.5 acts like stereographic. when 1 is rectilinear

    //y = something * tan(k * a)
    // where y is fromCentre.
    // reverse this 
    // a = atan(y/2) /k

    //guess what something could be to keep consistent angular resolution in middle of screen.
    // guess something like 1/k

    float fromCentre = sqrt(dot(vPos,vPos));
    
    float ang = (1./uK) * atan(uK* fromCentre);

    vec3 pos3d = vec3(normalize(vPos), 1./tan(ang));

    
    fragColor = texture(uSamplerCubeFisheye, -pos3d);
}