#version 300 es
precision mediump float;

out vec4 fragColor;
in vec3 vLightTimesColor;

void main(void) {
    fragColor = vec4(pow(vLightTimesColor, vec3(0.455)),1.0);
}