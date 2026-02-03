#version 300 es
precision mediump float;
	
in vec3 vReflectedVec;
in vec3 vLightTimesColor;
uniform samplerCube uSamplerCube;
out vec4 fragColor;

void main(void) {

    vec3 diffuse = vLightTimesColor;
    
    vec4 texSample = texture(uSamplerCube, vReflectedVec);

    vec3 preGamma = diffuse + .02*pow(texSample.xyz, vec3(2.2));   //what space is texture in?

    fragColor = vec4(pow(preGamma, vec3(0.455)),1.0);
}