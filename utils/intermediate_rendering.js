//stuff copied from 3sphere project (currently in main.js there) for rendering via intermediate view, not including cubemap rendering, which is in cubemap_rendering.js

var rttView={};

function setRttSize(view, width, height){	
	if (view.sizeX == width && view.sizeY == height){return;}	// avoid setting again if same numbers ( has speed impact)
																	//todo check for memory leak
	view.sizeX = width;
	view.sizeY = height;
		
	view.framebuffer.width = width;
	view.framebuffer.height = height;	
	
	gl.bindTexture(gl.TEXTURE_2D, view.texture);
	texImage2DWithLogs("after binding view texture", 
		gl.TEXTURE_2D, 0,
		gl.RGB10_A2, view.framebuffer.width, view.framebuffer.height, 0, 
		gl.RGBA, gl.UNSIGNED_INT_2_10_10_10_REV, null);

	gl.bindTexture(gl.TEXTURE_2D, view.depthTexture);
	texImage2DWithLogs("after binding depth texture",
		 gl.TEXTURE_2D, 0,
		 gl.DEPTH_COMPONENT24, view.framebuffer.width, view.framebuffer.height, 0,
		 gl.DEPTH_COMPONENT, gl.UNSIGNED_INT , null);	//can use gl.UNSIGNED_BYTE , gl.UNSIGNED_SHORT here but get depth fighting (though only on spaceship) gl.UNSIGNED_INT stops z-fighting, could use WEBGL_depth_texture UNSIGNED_INT_24_8_WEBGL .
	//note that possibly gl.UNSIGNED_INT might help z-fighting without needing to do custom depth writing.
	
	gl.bindTexture(gl.TEXTURE_2D, null);
	
	var renderbuffer = gl.createRenderbuffer();
	gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
	gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, view.framebuffer.width, view.framebuffer.height); // TODO what is difference gl.DEPTH_COMPONENT, gl.DEPTH_COMPONENT16 ?

//	gl.bindFramebuffer(gl.FRAMEBUFFER, view.framebuffer);
	
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, view.texture, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, view.depthTexture, 0);
	//gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);
	
	gl.bindRenderbuffer(gl.RENDERBUFFER, null);
//	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

function initTextureFramebuffer(view, useNearestFiltering, outsideRangeBehaviour) {
	var filterType = useNearestFiltering ? gl.NEAREST : gl.LINEAR;
	view.framebuffer = gl.createFramebuffer();

	outsideRangeBehaviour = outsideRangeBehaviour ?? gl.CLAMP_TO_EDGE;
		//want to use gl.CLAMP_TO_EDGE to fix problems with textures wrapping top-to-bottom on screen, 
		//but doesn't work currently for quad view (3 quads are totally of range and rely on repeat)
		//TODO shift quad views so can use CLAMP across the board

	view.texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, view.texture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, outsideRangeBehaviour);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, outsideRangeBehaviour);

	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filterType);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filterType);
	//gl.generateMipmap(gl.TEXTURE_2D);
	
	view.depthTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, view.depthTexture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, outsideRangeBehaviour);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, outsideRangeBehaviour);
	

	gl.bindFramebuffer(gl.FRAMEBUFFER, view.framebuffer);
	setRttSize( view, 512, 512);	//overwritten right away, so little point having here.
}