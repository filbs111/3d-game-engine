var quadData = {
	vertices: [-1,-1,0, -1,1,0, 1,-1,0, 1,1,0],	//.map(x=>0.9*x),	//indent to check rendered at right place on screen.
	// normals: [0,0,1,0,0,1,0,0,1,0,0,1],	//TODO don't use this unless have to
	// uvcoords: [0,0,0,1,1,0,1,1],
	indices: [0,2,1,1,2,3]	//TODO indexed strip for efficiency
};

//brainless way to get rendering of left and right split view working for fisheye
var quadDataLR = {
	left:{
		vertices: [-1,-1,0, -1,1,0, 0,-1,0, 0,1,0],
		indices: quadData.indices
	},
	right: {
		vertices: [0,-1,0, 0,1,0, 1,-1,0, 1,1,0],
		indices: quadData.indices
	}
}
