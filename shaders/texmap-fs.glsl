#version 300 es
precision mediump float;
in vec2 vTextureCoord;
in float vLight;
uniform sampler2D uSampler;

out vec4 fragColor;

void main(void) {
    //fragColor = texture(uSampler, vTextureCoord);

    vec3 fc = texture(uSampler, vTextureCoord).xyz;
    vec3 preGamma = vec3(vLight)*fc;
    fragColor = vec4(pow(preGamma, vec3(0.455)),1.0);
}