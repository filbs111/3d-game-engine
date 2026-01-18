#version 300 es

in vec3 aVertexPosition;

uniform vec2 uScaleXy;
uniform vec2 uOffsetXy;

out vec2 vPos;

void main(void) {
    gl_Position = vec4(aVertexPosition.xy, 0., 1);

    //gl_Position = vec4(aVertexPosition + vec3(0.,0.,-1.), 1.0);

    vPos = uScaleXy * (uOffsetXy + aVertexPosition.xy);
}