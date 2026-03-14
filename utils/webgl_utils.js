
var gl;	//context
var screenAspect;
var canvas;
var canvascontainer;

//mostly from view-source:http://learningwebgl.com/lessons/lesson01/index.html
function initGL(){
	try {
		gl = canvas.getContext("webgl2",{antialias:false});
		resizecanvas();
	} catch (e) {
	}
	if (!gl) {
		alert("Could not initialise WebGL, sorry :-(");
	}
}
function resizecanvas(){
	var overResolutionFactor=1;	//main reason to cause bad perf to check optimisations. 6 is what it takes for bad framerate on gtx 1080!!
	var screenWidth = overResolutionFactor*window.innerWidth;
	var screenHeight = overResolutionFactor*window.innerHeight;
	if (canvas.width != screenWidth || canvas.height != screenHeight){
		canvas.width = screenWidth;
		canvas.height = screenHeight;
		gl.viewportWidth = screenWidth;
		gl.viewportHeight = screenHeight;	//?? need to set both these things?? 
	}
	screenAspect = gl.viewportWidth/gl.viewportHeight;
	
	// Set canvas to match parent size
	canvas.style.width = '100%';
	canvas.style.height = '100%';

	canvascontainer.style.width=window.innerWidth+"px";
	canvascontainer.style.height=window.innerHeight+"px";
}