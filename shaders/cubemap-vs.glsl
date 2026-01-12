#version 300 es

in vec3 aVertexPosition;
uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
out vec3 vPos;

void main(void) {
    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
    vPos = aVertexPosition; // + uCentrePos;
}

//copied shader from webgl-reflections project.
//probably can cancel out sign switch in vs,fs

//and then copied from screenspace-techniques-test project!