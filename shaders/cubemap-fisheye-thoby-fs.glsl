#version 300 es
precision mediump float;

in vec2 vPos;
uniform samplerCube uSamplerCubeFisheye;
out vec4 fragColor;

uniform float uK2;  //when =0.5 is equisolid, when 1 is orthographic

void main(void) {

    //basically for things where position on screen is proportional to sine(k2 * angle)
    //where angle is from straight ahead in the world picture is taken of.
    //from https://wiki.panotools.org/Fisheye_Projection
    // thoby has value k2 which when =0.5 is equisolid, when 1 is orthographic
    // suspect k2 -> 0 equivalent to equidistant but maths here blow up
    // seems to also be described by "PTGui 11 fisheye" with k<0

    //y = something * sin(k2 * a)
    // where y is fromCentre.
    // reverse this 
    // a = asin(y/2) /k2

    //guess what something could be to keep consistent angular resolution in middle of screen.
    // guess something like 1/k2

    float fromCentre = sqrt(dot(vPos,vPos));
    
    float ang = (1./uK2) * asin(uK2* fromCentre);


    vec3 pos3d = vec3(normalize(vPos), 1./tan(ang));

    
    fragColor = texture(uSamplerCubeFisheye, -pos3d);
}