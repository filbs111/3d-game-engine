#version 300 es
precision mediump float;
in vec2 vTextureCoord;
in float vLight;
uniform sampler2D uSampler;
uniform sampler2D uSampler2;

out vec4 fragColor;

void main(void) {
    //fragColor = texture(uSampler, vTextureCoord);

    vec3 fc = texture(uSampler, vTextureCoord).xyz;
    vec3 fc2 = texture(uSampler2, vTextureCoord*vec2(128)).xyz; //NOTE scaling will be wierd if other tex is non square.

    vec3 preGamma = vec3(vLight)*fc*fc2;
    fragColor = vec4(pow(preGamma, vec3(0.455)),1.0);
}