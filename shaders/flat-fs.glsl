#version 300 es
precision mediump float;

out vec4 fragColor;
in vec3 vColor;

void main(void) {
   // fragColor = vec4(1.0,0.0,0.0,1.0);

    vec3 shiftedColor = vColor*vec3(0.5) + vec3(0.5);

    fragColor = vec4(shiftedColor,1.0);
}