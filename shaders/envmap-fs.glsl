#version 300 es
precision mediump float;
	
in vec3 vReflectedVec;
in vec3 vLightTimesColor;
in vec3 vNormal;
uniform samplerCube uSamplerCube;
out vec4 fragColor;

void main(void) {

    vec3 diffuse = vLightTimesColor;
    
    vec4 texSample = texture(uSamplerCube, vReflectedVec);

    //guess that env map encodes true brightness in some way. make some guess. TODO cmake drawing of skybox consistent with this.
    // TODO check below. right way around? TODO check for constants
    vec3 linearSample = pow(texSample.xyz, vec3(2.2));
    //vec3 unExponentialedSample = vec3(1.0) - exp( vec3(1.0) -linearSample );  //opposite direction transformation like that. 

    vec3 unExponentialedSample = -log(vec3(1.1) - linearSample);    // 1.1 instead of 1 is a guess bodge to avoid wierd bright coloured highlights. 
        //Guess happened because max val of channel becomes infinite light

    //toCamera dot normal = - refelctedVec dot normal
    float fresnelEffect = pow( 1. - dot(normalize(vReflectedVec), normalize(vNormal)) , 5.);
    float specularFraction = mix( 0.01, 0.6, fresnelEffect);  //from some default specular reflection amount for viewing head on to 100% for glancing angle

    //specularFraction=1.;    //override for diffuse only (0), or specular only (1)

    vec3 preGamma = mix(diffuse, linearSample, specularFraction);
    // vec3 preGamma = vec3(specularFraction);

    //vec3 preGamma = diffuse + .005*unExponentialedSample;   //what space is texture in?

    fragColor = vec4(pow(preGamma, vec3(0.455)),1.0);
}