var cmapPMatrix = mat4.create();
mat4.perspective(90, 1, camParams.near, camParams.far, cmapPMatrix); //cubemap projection matrix

var cubemapView={};
var cubemapSize = 1024;	//noticable pixellation. (unskewed cubemap)
//var cubemapSize = 2048;		//large, guess poor perf on lower end machines.
function initCubemapFramebuffer(view){
    var framebuffers = [];
	view.framebuffers = framebuffers;
	
	view.cubemapTexture = gl.createTexture();
	
	gl.activeTexture(gl.TEXTURE1);	//use texture 1 always for cubemap
	gl.bindTexture(gl.TEXTURE_CUBE_MAP, view.cubemapTexture);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

	var faces = [gl.TEXTURE_CUBE_MAP_POSITIVE_X,
				 gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
				 gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
				 gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
				 gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
				 gl.TEXTURE_CUBE_MAP_NEGATIVE_Z];
	
	for (var i = 0; i < faces.length; i++)
	{
		var face = faces[i];
			
		var framebuffer = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
		framebuffer.width = cubemapSize;
		framebuffer.height = cubemapSize;
		framebuffers[i]=framebuffer;
		
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(face, 0, gl.RGBA, cubemapSize, cubemapSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
	
		var renderbuffer = gl.createRenderbuffer();
		gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
		gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, cubemapSize, cubemapSize);
				
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, face, view.cubemapTexture, 0);
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);
	}
	
	gl.bindRenderbuffer(gl.RENDERBUFFER, null);
	//gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);	//this gets rid of errors being logged to console. 
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

function updateCubemap(unmirroredCameraMat, eyeMat, neckMat, upperTorsoMat, torsoMatrix, boxRotation){

    gl.clearColor(1,0,1,1); //magenta (just to check whether these views end up screen...)

	//DRAW CUBEMAP
    mat4.set(cmapPMatrix, pMatrix);
    
    for (var ii=0;ii<6;ii++){
        var framebuffer = cubemapView.framebuffers[ii];
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.viewport(0, 0, framebuffer.width, framebuffer.height);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
        //drawWorldScene(ii); //pass in cubemap camera face id (-1 = non cubemap).

        var copiedMat = mat4.create(unmirroredCameraMat);

        rotateCameraForFace(copiedMat, ii);

        //if (ii!=0){continue;}

        drawSingleScene(copiedMat, true, eyeMat, neckMat, upperTorsoMat, torsoMatrix, boxRotation);
        gl.clear(gl.DEPTH_BUFFER_BIT);
        drawSingleScene(copiedMat, false, eyeMat, neckMat, upperTorsoMat, torsoMatrix, boxRotation);    
	}
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
}

//TODO replace these with mat4.rotateX etc!
//
function rotateCameraForFace(mat, ii){
	var piBy2= Math.PI/2;
	var xVec = vec3.create([1,0,0]);
	var yVec = vec3.create([0,1,0]);
	var zVec = vec3.create([0,0,1]);

    mat4.inverse(mat);  //add inverse from code copied from vr project...

    switch(ii){
        case 0:
            mat4.rotate(mat, piBy2, yVec);
            break;
        case 1:
			mat4.rotate(mat, -piBy2, yVec);
            break;
        case 2:
			mat4.rotate(mat, -piBy2, xVec);
			mat4.rotate(mat, Math.PI, zVec);
            break;
        case 3:
			mat4.rotate(mat, piBy2, xVec);
			mat4.rotate(mat, Math.PI, zVec);
            break;
        case 4:
			mat4.rotate(mat, Math.PI, yVec);
            break;
        case 5:
            break;
    }

    mat4.inverse(mat);
}

function renderViewUsingCmap(){
    var activeShaderProgram = 
        document.getElementById("fisheyeselection_simple").checked ?            shaderPrograms.fisheyeCubemap:
        document.getElementById("fisheyeselection_stereographic").checked ?     shaderPrograms.fisheyeStereographic:
        document.getElementById("fisheyeselection_equidistant").checked ?       shaderPrograms.fisheyeEquidistant:
        document.getElementById("fisheyeselection_thoby").checked ?             shaderPrograms.fisheyeThoby:
        document.getElementById("fisheyeselection_equisolid").checked ?         shaderPrograms.fisheyeEquisolid:
        document.getElementById("fisheyeselection_orthographic").checked ?      shaderPrograms.fisheyeOrthographic:
        document.getElementById("fisheyeselection_tanktheta").checked ?         shaderPrograms.fisheyeTanktheta:
                                                                                shaderPrograms.fisheyeSpecial;

    gl.useProgram(activeShaderProgram);
    enableDisableAttributes(activeShaderProgram);
        //?? which uniform for cubemap framebuffers

    if (document.getElementById("fisheyeselection_simple").checked){
        var ss = parseFloat(document.getElementById("simple_strength").value);
        gl.uniform1f(activeShaderProgram.uniforms.uSimpleStrength, ss);
    }

    if (document.getElementById("fisheyeselection_thoby").checked){
        var k2 = parseFloat(document.getElementById("thobyk2").value);
        gl.uniform1f(activeShaderProgram.uniforms.uK2, k2);
    }

    if (document.getElementById("fisheyeselection_tanktheta").checked){
        var k = parseFloat(document.getElementById("tanktheta_k").value);
        gl.uniform1f(activeShaderProgram.uniforms.uK, k);
    }

    if (document.getElementById("fisheyeselection_special").checked){
        var k = parseFloat(document.getElementById("special_k").value);
        gl.uniform1f(activeShaderProgram.uniforms.uK, k);
    }

    var zoom = parseFloat(document.getElementById("camerazoom").value);    //larger number = more zoomed out

    var ratio = gl.viewportWidth/gl.viewportHeight;
    gl.uniform2f(activeShaderProgram.uniforms.uScaleXy, ratio*zoom, zoom);   //TODO apply zoom factor, (inverted?) screen dimens
    gl.uniform2f(activeShaderProgram.uniforms.uOffsetXy, 0,-0.33);

	gl.disable(gl.CULL_FACE);   //?? bodge to try to get rendering to work!!!

    drawObjectFromBuffers(quadBuffers, activeShaderProgram);

    gl.enable(gl.CULL_FACE);

    //NOTE copypasted from VR project which projects cubemap onto a triangulated spherical surface (eg a full sphere) and views that 
    // from the inside with standard rectilinear projection. (put the camera at centre of the sphere for rectilinear 
    // projection of world, put at opposite surface for stereographic projection. Intermediate positions are angle preserving mapping 
    // for viewer of screen at different distance (typically further than would be required for rectilinear projection to be correct, 
    // and steroegraphic projection is angle preserving for viewer at infinte distance from screen.
    // Rendering using triangulated surface makes shaders simple, but means more polys, and quality depends on how many.
    //For this project, attempt to just use fullscreen quad to draw to screen, and do fisheye projection in shader.
    // this has some cost in the fragment shader depending on fisheye mapping used - the generalised angle preserving mapping is used
    // in 3-sphere project and forulation is relatively complicated, and currently has some precision issues at 90 deg from straight on,
    // so sometimes a circle where pix colours are wrong is seen. (doesn't matter if limit FOV to within forward hemisphere though)
    // Maybe later should implement using triangulated surface.
}
