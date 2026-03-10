#version 300 es
precision mediump float;

in vec2 vPos;

uniform mat4 uPMatrix2;
uniform sampler2D uSampler;
uniform float uSimpleStrength;  // 0 for rectilinear projection, .25 this is equivalent to stereographic!

out vec4 fragColor;


void main(void) {

    float vPosMag = dot(vPos,vPos);

    //to look up point on texture,
    // maybe faster to do more logic in vertex shader, but expect easier to do all in frag shader.
    // take point on screen, then get direction of point (3d point) using fisheye adjustment - same as cubemap fisheye shader.

    float simpleParabolicZCoord = 1.-uSimpleStrength*vPosMag;    //simple barrel distortion

    //fragColor = vec4( vec3(simpleParabolicZCoord), 1.0);    //shows radiating from centre of perspective as expected (vignette effect)


    vec3 pos3d = vec3(-vPos, simpleParabolicZCoord);

    //fragColor = vec4( vec3(10.)*pos3d, 1.0);    //show crossing at centre of perspective as expected.

    // apply inverse projection matrix (inverted?) to get point on texture.
    //vec4 pointToBeTransformed = vec4(pos3d.x, pos3d.y, 0.0, pos3d.z);   //guess. TODO just take smaller matrix uniform? 
    vec4 pointToBeTransformed = vec4(pos3d, 0.0);

    vec4 outputPoint = uPMatrix2 * pointToBeTransformed;

   // fragColor = vec4( vec3(10.)*outputPoint.xyz, 1.0);

    //NOTE could use projective texture, but for clarity just do manually.
    vec2 projectedPoint = outputPoint.xy / vec2(outputPoint.w); //?

    //fragColor = texture(uSampler, projectedPoint); 

    float vignette = 1. - .15*vPosMag;

    fragColor = vec4(vec3(vignette),1.)* texture(uSampler, vec2(0.5)+vec2(0.5)*projectedPoint);    //regular 2d texture has centre at 0.5
}