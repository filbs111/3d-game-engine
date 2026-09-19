#version 300 es
precision mediump float;

out vec4 fragColor;
in vec3 vLightTimesColor;
in vec4 uWorldPos; //use vec4 for convenience, but really only interested in 1st 3 components

void main(void) {
    //NOTE this doesn't work well when blocks ~ pixel size. Works well with FXAA for large blocks on screen though.
    // TODO smooth given size of pixel in world space - to do properly could do by dx, dy, or avoid smoothing in normal direction.

    float blockSize = 2.;   //2m

    vec4 chequer4v = floor(uWorldPos/blockSize);

    float sumOfComponents = dot(chequer4v.xyz, vec3(1.));

    float chequer = mod(sumOfComponents, 2.);

    vec3 chequerColor = vec3(.8 + .2*chequer);

    vec3 preGammaColor = chequerColor * vLightTimesColor;

    fragColor = vec4(pow(preGammaColor, vec3(0.455)),1.0);
}