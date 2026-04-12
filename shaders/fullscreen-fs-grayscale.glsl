#version 300 es
precision mediump float;

in vec2 vPos;

uniform sampler2D uSampler;

out vec4 fragColor;

void main(void) {	

    vec4 color = texture(uSampler, vPos);
    
    //float grayValue = ( color.x + color.y + color.z ) / 3.0;    //NOTE not a true grayscale - 
    float grayValue = dot(vec3(.3,.6,.1), color.xyz);    //NOTE not a true grayscale - 

    fragColor = vec4(vec3(grayValue) + vec3(.1,0.,0.) , 1.);    //add red just to check quad is being drawn
}