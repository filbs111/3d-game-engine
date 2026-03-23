#version 300 es
precision mediump float;

in vec2 vPos;

uniform mat4 uPMatrix2;
uniform sampler2D uSampler;
uniform float uSimpleStrength;  // 0 for rectilinear projection, .25 this is equivalent to stereographic!

//uniform vec2 uInvSize;

out vec4 fragColor;

// Fragment shader snippet
float getBayerValue(int x, int y) {
    // 4x4 Bayer matrix, values range from 0 to 15
    const int bayer[16] = int[16](
         0,  8,  2, 10,
        12,  4, 14,  6,
         3, 11,  1,  9,
        15,  7, 13,  5
    );
    
    // Clamp x and y to [0,3] in case of wraparound
    x = x % 4;
    y = y % 4;
    return float(bayer[y * 4 + x]); // / 16.0;
}

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

    vec4 MIDv4 = vec4(vec3(vignette),1.)* texture(uSampler, vec2(0.5)+vec2(0.5)*projectedPoint);    //regular 2d texture has centre at 0.5



    //translate to params used in copied dither shader 
    vec2 vTextureCoord = vPos;
    vec2 uInvSize = vec2( 0.0025, 0.0025);  //TODO pass in appropriate vals given window size



    
    //vec4 adjusted = MIDv4;

    //dithering is a fun retro effect that makes shoddiness look intentional!
    //alternatively might use this with greater bit depth than final screen in order to reduce banding effects

    //suppose we have 8 colors (per channel) then using a 4x4 grid can expand each into 17 brightness levels, but 
    //brightest possible using colours 0, 1 (all 1) = dimmest using colours 1,2 (all 1), so actually we have 7*16 + 1 
    // = 113 possible brightnesses representable.

    // color0  color1 ............  color7
    // 0..15, 16..31,               112
    // so 113 colours representable.
    // colour we get is - take quantised number from 0 to 112.
    // add the threshold number 0 to 15.
    // multiply by 8/128 so and floor it so 128 -> 8

    //8 color dither
    // vec4 quantised = floor(MIDv4*113.);
    // ivec2 pixel = ivec2(vTextureCoord/uInvSize) % 4;
    // float threshold = getBayerValue(pixel.x, pixel.y);
    // vec4 adjusted = quantised + vec4(threshold);    //TODO what is happening to alpha chan? is it ignored?
    // vec4 quantised2 = floor(adjusted/16.)/7.;

    //16 color
    // vec4 quantised = floor(MIDv4*113.);
    // ivec2 pixel = ivec2(vTextureCoord/uInvSize) % 4;
    // float threshold = getBayerValue(pixel.x, pixel.y);
    // vec4 adjusted = quantised + vec4(threshold);    //TODO what is happening to alpha chan? is it ignored?
    // vec4 quantised2 = floor(adjusted/16.)/7.;

    //256 color - if input is higher detail, might reduce banding.
    vec4 quantised = floor(MIDv4*4081.);
    ivec2 pixel = ivec2(vTextureCoord/uInvSize) % 4;
    float threshold = getBayerValue(pixel.x, pixel.y);
    vec4 adjusted = quantised + vec4(threshold);    //TODO what is happening to alpha chan? is it ignored?
    vec4 quantised2 = floor(adjusted/16.)/255.;

    //4 color
    // vec4 quantised = floor(MIDv4*49.);
    // ivec2 pixel = ivec2(vTextureCoord/uInvSize) % 4;
    // float threshold = getBayerValue(pixel.x, pixel.y);
    // vec4 adjusted = quantised + vec4(threshold);    //TODO what is happening to alpha chan? is it ignored?
    // vec4 quantised2 = floor(adjusted/16.)/3.;
    
    //2 color
    // vec4 quantised = floor(MIDv4*17.);
    // ivec2 pixel = ivec2(vTextureCoord/uInvSize) % 4;
    // float threshold = getBayerValue(pixel.x, pixel.y);
    // vec4 adjusted = quantised + vec4(threshold);    //TODO what is happening to alpha chan? is it ignored?
    // vec4 quantised2 = floor(adjusted/16.);
    

    //easiest - just quantise. say have 4 colours levels
    //vec4 quantised = floor(adjusted*5.)/4.;
    //vec4 quantised = floor(adjusted*6.)/8.;

    //vec4 quantised = floor(adjusted*16.)/16.;  //amiga style 
    //vec4 quantised = floor(adjusted*16.99)/16.;

    //TODO dither
    //TODO account for gamma? (is input texture here linear or sRGB?)

    fragColor = quantised2;
}