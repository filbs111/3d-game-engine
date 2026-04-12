#version 300 es
in vec3 aVertexPosition;
out vec2 vPos;

void main(void) {
    //gl_Position = vec4( aVertexPosition + vec3(-1.,-1.,1.) , 1.0);
    gl_Position = vec4( aVertexPosition , 1.0);

    vPos = aVertexPosition.xy*vec2(.5) + vec2(.5);  //fills the screen
}