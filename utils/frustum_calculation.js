//want to calculate a projection matrix for minimal sized intermediate rectilinear renders.
// for single view, perhaps later also for double or quad views, though maybe not much point for smaller FOVs.
// should account for perspective shift (eg with centre of perspective 3rd way down screen)
// support barrel distortion first - pincusion distortion would require more work

function calculateProjectionMatrixForIntermediateView(screenWidth, screenHeight, simpleStrength, centreOfPerspectiveShiftDown, projMat){
    //TODO generalise this using a fisheye strength function to support different fisheye projections? 

    //TODO what are the projection matrix parameters? 
    // suspect most straightforward to calculate a normal perspective matrix and shift perspective, and tilt it down (if centre of perspective shifted up).
    // simplifying to do in fewer ops is optional. 

    // basically, find directions of corners of the screen - same maths as in cubemap to find direction to sample from cubemap for the screen quad corners.
    // then find a forwards direction in which rate of separation of the upper and lower corners is equal. put rectangular near and far planes perpendicular to 
    // this direction.

    function fisheyeCornerDirection(inputCorner){
        var sumsq = inputCorner[0]*inputCorner[0] +  inputCorner[1]*inputCorner[1];
        var simpleParabolicZcoord = 1.-simpleStrength*sumsq;
        var unnormalised = [inputCorner[0], inputCorner[1], simpleParabolicZcoord];
        
        return unnormalised;
        //var mag = Math.sqrt(sumsq + simpleParabolicZcoord*simpleParabolicZcoord);
        //return unnormalised.map(xx=>xx/mag); 
    }

    //calculate fisheye screen corner vectors. 
    var topCornerDirectionVec = fisheyeCornerDirection([screenWidth, screenHeight * ( centreOfPerspectiveShiftDown + 1)]);
    var bottomCornerDirectionVec = fisheyeCornerDirection([screenWidth, screenHeight * ( centreOfPerspectiveShiftDown - 1 )]);


    // "forwards" direction is [0, fwd_y, fwd_z]
    // scale the two corner directions so that x components same (1),

    var scaledCornerTop = topCornerDirectionVec.map(xx => xx/topCornerDirectionVec[0]);
    var scaledCornerBottom = bottomCornerDirectionVec.map(xx => xx/bottomCornerDirectionVec[0]);
        //these scaled corners form 4 frustum edges, (2 top and 2 bottom- +/- x for left, right) = ends of all four should form a rectangle
        //NOTE don't need all values in these vecs, but retaining for now for clarity.

    // "forward" direction is perpendicular to yz line between these 2.
    var xyzDifference = [0, scaledCornerTop[1]-scaledCornerBottom[1], scaledCornerTop[2]-scaledCornerBottom[2]];
    var forwardDirection = [0, -xyzDifference[2], xyzDifference[1]];

    var forwardMag = Math.sqrt(dotProd3(forwardDirection, forwardDirection));
    var normalisedForwardDirection = forwardDirection.map(xx=>xx/forwardMag);

    var upDirection = [0, xyzDifference[1], xyzDifference[2]];  
        //something like that! 
        //TODO normalise? 

    var cameraPitch = Math.atan(forwardDirection[1], forwardDirection[2]);


    //check width (for fx of intermediate camera) calculated for both top and bottom directions matches
    var widthCalculatedForTop = 1/ dotProd3(scaledCornerTop, normalisedForwardDirection);   //NOTE don't need to normalise forward direction for this. can just use unnormalised and mag here.
    var widthCalculatedForBottom = 1/ dotProd3(scaledCornerBottom, normalisedForwardDirection);
    var intermediateFx = widthCalculatedForTop;

    //expect height calculated to be different - from this can calculate fy and perspective shift of intermediate camera.
    var heightCalculatedForTop = dotProd3(scaledCornerTop, upDirection)/dotProd3(scaledCornerTop, forwardDirection);   //NOTE could reuse this for above calc
    var heightCalculatedForBottom = dotProd3(scaledCornerBottom, upDirection)/dotProd3(scaledCornerBottom, forwardDirection); //""
    var intermediateFy = 0.5*(heightCalculatedForTop -heightCalculatedForBottom);
    var intermediatePerspShift = heightCalculatedForTop + heightCalculatedForBottom;    //*0.5?

    //create perspective matrix by measuring width of this frustum, check top and bottom width matches.
    //var projMat = mat4.create();
    var vFov= (180/Math.PI)*2*Math.atan(intermediateFy);  //unfortunate to convert to angles, but nice to reuse glmatrix perspective matrix func for clarity
    var intermediateAspect = intermediateFx/intermediateFy;


    //TODO define these earlier (defined elsewhere globally)
    var camParams = {
        near:0.1,
        far:20000
    };


    mat4.perspective(vFov, intermediateAspect, camParams.near, camParams.far, projMat); 
    //projMat[9]=intermediatePerspShift / 2;  // /2 is guess. is it needed? or sohould this be a fraction of intermediateFy

    projMat[9]= 0.5* intermediatePerspShift / intermediateFy;
    //projMat[9]= intermediatePerspShift / intermediateFy;

    // , pitch it.
    // and just use for straight to screen render, check looks about right, then draw to intermediate view and map by fisheye shader using similar matrix (inverse?)

    mat4.rotateX(projMat, intermediateViewCameraPitchMultiplier*cameraPitch);

    //print these to see if looks halfway sensible..
    // console.log({
    //     scaledCornerTop,
    //     scaledCornerBottom,
    //     forwardDirection,
    //     upDirection,
    //     cameraPitch,
    //     widthCalculatedForTop,
    //     widthCalculatedForBottom,
    //     heightCalculatedForTop,
    //     heightCalculatedForBottom,
    //     intermediateFx,
    //     intermediateFy,
    //     intermediateAspect,
    //     intermediatePerspShift,
    //     projMat
    // });
}

var intermediateViewCameraPitchMultiplier = -1;

function dotProd3(aa,bb){
    return aa[0]*bb[0] + aa[1]*bb[1] + aa[2]*bb[2];
}



calculateProjectionMatrixForIntermediateView(0.8, 0.45, 0.1, -0.333, mat4.create());

