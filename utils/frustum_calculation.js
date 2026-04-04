//want to calculate a projection matrix for minimal sized intermediate rectilinear renders.
// for single view, perhaps later also for double or quad views, though maybe not much point for smaller FOVs.
// should account for perspective shift (eg with centre of perspective 3rd way down screen)
// support barrel distortion first - pincusion distortion would require more work

function fisheyeCornerDirection(inputCorner, simpleStrength){
    var sumsq = inputCorner[0]*inputCorner[0] +  inputCorner[1]*inputCorner[1];
    var simpleParabolicZcoord = 1.-simpleStrength*sumsq;
    var unnormalised = [inputCorner[0], inputCorner[1], simpleParabolicZcoord];
    
    return unnormalised;
    //var mag = Math.sqrt(sumsq + simpleParabolicZcoord*simpleParabolicZcoord);
    //return unnormalised.map(xx=>xx/mag); 
}

function calculateProjectionMatrixForIntermediateView(screenWidth, screenHeight, simpleStrength, centreOfPerspectiveShiftDown, projMat){
    //TODO generalise this using a fisheye strength function to support different fisheye projections? 

    //TODO what are the projection matrix parameters? 
    // suspect most straightforward to calculate a normal perspective matrix and shift perspective, and tilt it down (if centre of perspective shifted up).
    // simplifying to do in fewer ops is optional. 

    // basically, find directions of corners of the screen - same maths as in cubemap to find direction to sample from cubemap for the screen quad corners.
    // then find a forwards direction in which rate of separation of the upper and lower corners is equal. put rectangular near and far planes perpendicular to 
    // this direction.

    //TODO define these earlier (defined elsewhere globally)
    var camParams = {
        near:0.05,
        far:20000
    };

    // centreOfPerspectiveShiftDown = 0;     

    //calculate fisheye screen corner vectors. 
    var topCornerDirectionVec = fisheyeCornerDirection([screenWidth, screenHeight * ( centreOfPerspectiveShiftDown - 1)], simpleStrength);
    var bottomCornerDirectionVec = fisheyeCornerDirection([screenWidth, screenHeight * ( centreOfPerspectiveShiftDown + 1 )], simpleStrength);


    //bodge input to calculation - switching tilt appears to work... 
    var topCornerDirectionVecBodge = fisheyeCornerDirection([screenWidth, screenHeight * ( -centreOfPerspectiveShiftDown - 1)], simpleStrength);
    var bottomCornerDirectionVecBodge = fisheyeCornerDirection([screenWidth, screenHeight * ( -centreOfPerspectiveShiftDown + 1 )], simpleStrength);
    //make a perspective matrix using general method. check result matches custom method here.
    var topCornerDirectionVec2 = fisheyeCornerDirection([-screenWidth, screenHeight * ( -centreOfPerspectiveShiftDown - 1)], simpleStrength);
    var bottomCornerDirectionVec2 = fisheyeCornerDirection([-screenWidth, screenHeight * ( -centreOfPerspectiveShiftDown + 1 )], simpleStrength);

    var projMatGeneralMethod = calculateProjMatFromCorners2(topCornerDirectionVecBodge, topCornerDirectionVec2, bottomCornerDirectionVecBodge, bottomCornerDirectionVec2, camParams.near, camParams.far);

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


    

    mat4.perspective(vFov, intermediateAspect, camParams.near, camParams.far, projMat); 
    //projMat[9]=intermediatePerspShift / 2;  // /2 is guess. is it needed? or sohould this be a fraction of intermediateFy

    projMat[9]= 0.5* intermediatePerspShift / intermediateFy;

    mat4.rotateX(projMat, cameraPitch);

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

    // console.log({
    //     projMat,
    //     projMatGeneralMethod
    // });

    //temp - try just use general method - makes depth buf wacky, but x,y looks almost OK. 
    if (document.getElementById("otherprojmat").checked){
        mat4.set(projMatGeneralMethod, projMat);
    }
}


function calculateLeftRightPanelProjMatrices(screenWidth, screenHeight, simpleStrength, centreOfPerspectiveShiftDown){
    //TODO define these earlier (defined elsewhere globally)
    var camParams = {
        near:0.05,
        far:20000
    };

    //bodge input to calculation - switching tilt appears to work... 
    var topCornerDirectionVecBodge = fisheyeCornerDirection([screenWidth, screenHeight * ( -centreOfPerspectiveShiftDown - 1)], simpleStrength);
    var bottomCornerDirectionVecBodge = fisheyeCornerDirection([screenWidth, screenHeight * ( -centreOfPerspectiveShiftDown + 1 )], simpleStrength);
    //make a perspective matrix using general method. check result matches custom method here.
    var topCornerDirectionVec2 = fisheyeCornerDirection([-screenWidth, screenHeight * ( -centreOfPerspectiveShiftDown - 1)], simpleStrength);
    var bottomCornerDirectionVec2 = fisheyeCornerDirection([-screenWidth, screenHeight * ( -centreOfPerspectiveShiftDown + 1 )], simpleStrength);

    //var projMatGeneralMethod = calculateProjMatFromCorners2(topCornerDirectionVecBodge, topCornerDirectionVec2, bottomCornerDirectionVecBodge, bottomCornerDirectionVec2, camParams.near, camParams.far);

    //make a perspective matrix using general method. check result matches custom method here.
    var topMid = fisheyeCornerDirection([0, screenHeight * ( -centreOfPerspectiveShiftDown - 1)], simpleStrength);
    var bottomMid = fisheyeCornerDirection([0, screenHeight * ( -centreOfPerspectiveShiftDown + 1 )], simpleStrength);

    //NOTE these 2 proje matrices are very similar - calculation mostly repeated.
    var projMatLeft = calculateProjMatFromCorners2(topCornerDirectionVecBodge, topMid, bottomCornerDirectionVecBodge, bottomMid, camParams.near, camParams.far);
    var projMatRight = calculateProjMatFromCorners2(topMid, topCornerDirectionVec2, bottomMid, bottomCornerDirectionVec2, camParams.near, camParams.far);

    return {
        projMatLeft,
        projMatRight
    }
}


function dotProd3(aa,bb){
    return aa[0]*bb[0] + aa[1]*bb[1] + aa[2]*bb[2];
}

function dotProd2(aa,bb){
    return aa[0]*bb[0] + aa[1]*bb[1];
}


calculateProjectionMatrixForIntermediateView(0.8, 0.45, 0.1, -0.333, mat4.create());




function figureOutGlmatrixProjMatrixStuff(){
    //make a general function to calculate a projection matrix given corner points/directions.
    // proj matrix applied to corner direction should output something expected.
    //  projMat * (corner 1) = (1,1,1,1)
    //  projMat * (corner 2) = (-1,1,1,1), etc.
    // can this be expressed as matrix? 

    // eg projMat * cornersmat = (1,1,1,1,
    //                            -1,1,1,1, ... ? 
    // and if so, how should near plane work ? 

    var testProjMat = mat4.create();
    var far = 100;
    var near = 0.1;
    var aspect = 2;
    var vFov = 2* (Math.atan(1) * 180/Math.PI);    //should be 90 deg
    console.log("calculated vFOV = " + vFov);

    mat4.perspective(vFov, aspect, near, far, testProjMat); 

    console.log(testProjMat);

    //mat4.transpose(testProjMat);  //??

    //create some test vector and transform it. given this vFov and aspect have some expectation about what will map to back plane corners etc 

    var cornersAtDistance1 = [
        [-2,-1, 1, 1],
        [2,-1, 1, 1],
        [-2,1, 1, 1],
        [2,1, 1, 1]
    ];

    var farCorners = cornersAtDistance1.map(x => {
        x = x.map(xx => xx*far);
        //x[2]*=-1;
        x[3]=-1;    // -1 seems to get the right result! (or should z be negative?)
        return x;
    });

    var nearCorners = cornersAtDistance1.map(x => {
        x = x.map(xx => xx*near);
        //x[2]*=-1;
        x[3]=-1;
        return x;
    });

    var allCorners = [nearCorners, farCorners].flat();

    var transformedCorners = allCorners.map(corner => {
        var cornerVec = vec4.create(corner);
        mat4.multiplyVec4(testProjMat, cornerVec);
        //is this as expected?
        return cornerVec;
    });

    var threeVecCoords = transformedCorners.map(corner => {
        return corner.slice(0,3).map(x=>x/corner[3]);
    });


    console.log({transformedCorners, threeVecCoords});

    var transformedCorners2 = allCorners.map(corner => {
        var cornerVec = vec4.create(corner);
        var cornerVec = myMultiplyVecByMatrix(testProjMat, cornerVec);
        return cornerVec;
    });

    console.log(transformedCorners2);
}

function calculateProjMatFromCorners(){
    //attempt to find a perspective matrix - ie similar to what glMatrix produces, but which when applied to particular corners, yields desired results.
    // suppose we know corner directions, these are in +ve z direction, and we want resulting depth map z to be for this direction.
    // we can scale corner directions for far plane to have z component = far distance, and for near plane to have z component = near distance. 
    
    var near = 0.1;
    var far = 100;
    var fx = 2;
    var fy = 1;

    //NOTE this is for regular symmetric frustum. TODO use for arbitrary

    var farCorners = mat4.create([
        -fx*far, -fy*far, far, -1,
        fx*far, -fy*far, far, -1,
        -fx*far, fy*far, far, -1,
        fx*far, fy*far, far, -1
    ]);

    var nearCorners = mat4.create([
        -fx*near, -fy*near, near, -1,
        fx*near, -fy*near, near, -1,
        -fx*near, fy*near, near, -1,
        fx*near, fy*near, near, -1
    ]);


    var transformedCornersFar = mat4.create([
        -far, -far, -far, -far,
        far, -far, -far, -far,
        -far, far, -far, -far,
        far, far, -far, -far
    ]);

    var transformedCornersNear = mat4.create([
        -near, -near, -near, -near,
        near, -near, -near, -near,
        -near, near, -near, -near,
        near, near, -near, -near
    ]);

    //just plugging in far points didn't work - guess because not linearly independent (all in same plane)
    // picking a selection of near and far gets expected result.
    // TODO use this to reproduce existing code to calculate for single intermediate view.
    // TODO try this for perspective transformed near, far planes, use for 2-panel intermediate view.

    

    //0,1,2 of far, 0 of near
    //seems to work. perhaps choosing other points would work better.
    // var cornerSelection = mat4.create([
    //     -fx*far, -fy*far, far, -1,
    //     fx*far, -fy*far, far, -1,
    //     -fx*far, fy*far, far, -1,
    //     -fx*near, -fy*near, near, -1,
    // ]);
    // var transformedCornerSelection = mat4.create([
    //     -far, -far, -far, -far,
    //     far, -far, -far, -far,
    //     -far, far, -far, -far,
    //     -near, -near, near, -near,
    // ]);

    // 1,2 of far, 0,3 of near
    var cornerSelection = mat4.create([
        fx*far, -fy*far, far, -1,
        -fx*far, fy*far, far, -1,
        -fx*near, -fy*near, near, -1,
        fx*near, fy*near, near, -1
    ]);
    var transformedCornerSelection = mat4.create([
        far, -far, -far, -far,
        -far, far, -far, -far,
        -near, -near, near, -near,
        near, near, near, -near
    ]);


    var corners = cornerSelection;
    var transformedCorners = transformedCornerSelection;


    // transformed = projection * corners.
    // => transformed * invCorners = projection? 

    var inverseCorners = mat4.create(corners);
    mat4.inverse(inverseCorners);

    var projMat = mat4.create(transformedCorners);
    mat4.multiply(projMat, inverseCorners);

    console.log({
        corners,
        transformedCorners,
        inverseCorners,
        projMat
    });
}



function calculateProjMatFromCorners2(c1,c2,c3,c4, near, far){
    //attempt to find a perspective matrix - ie similar to what glMatrix produces, but which when applied to particular corners, yields desired results.
    // suppose we know corner directions, these are in +ve z direction, and we want resulting depth map z to be for this direction.
    // we can scale corner directions for far plane to have z component = far distance, and for near plane to have z component = near distance. 
   
    // suspect should make cross section of constant w be rhombus. 
    // to do this might find normal to faces of frustum bounding top, bottom and sides of view.
    // cross top and bottom normals to find vector pointing to side, cross sides to find vector pointing up/down. cross the side and up/down vecs to get 
    // a direction normal to rhombus cross sections (constant w).

    var upDownDirections = [crossProd(c1,c2), crossProd(c3,c4)];
    var sideDirections = [crossProd(c1,c3), crossProd(c2,c4)];
    var upDownCross = crossProd(upDownDirections[0], upDownDirections[1]);
    var sideCross = crossProd(sideDirections[0], sideDirections[1]);
    var totalCross = crossProd(upDownCross, sideCross);

    var totalCrossSq = dotProd3(totalCross,totalCross);
    var totalCrossMag = Math.sqrt(totalCrossSq);
    var totalCrossNormalised = totalCross.map(x=>x/totalCrossMag);

    // to get near and far points for near and far planes along this new direction,
    // dot input point direction with totalCross direction, and divide by this
    
    //var cornerDirections = [c1,c2,c3,c4];
    var cornerDirections = [c3,c4,c1,c2];   //switched to get result consistent(ish) with previous proj matrix
//    var cornerDirections = [c1,c3,c2,c4]
    

    //var zEquals1Directions = cornerDirections.map(x=> x.map(xx=>xx/x[2]));
    
    var zPrimeEquals1Directions = cornerDirections.map(x => 
    {
        var dot = dotProd3(x, totalCrossNormalised);
        return x.map(xx=>xx/dot);
    });
    
    zEquals1Directions = zPrimeEquals1Directions;

    var cornerSelection = mat4.create([
        zEquals1Directions[1].map(xx=>xx*far),
        zEquals1Directions[2].map(xx=>xx*far),
        zEquals1Directions[0].map(xx=>xx*near),
        zEquals1Directions[3].map(xx=>xx*near),
    ].map(x=>{
        //x[2]*=-1;
        x.push(-1); return x;}).flat());

    var transformedCornerSelection = mat4.create([
        far, -far, -far, -far,
        -far, far, -far, -far,
        -near, -near, near, -near,
        near, near, near, -near
    ]);

    //switch signs???
    // var transformedCornerSelection = mat4.create([
    //     far, -far, far, -far,
    //     -far, far, far, -far,
    //     -near, -near, -near, -near,
    //     near, near, -near, -near
    // ]);


    var corners = cornerSelection;
    var transformedCorners = transformedCornerSelection;

    // transformed = projection * corners.
    // => transformed * invCorners = projection? 

    var inverseCorners = mat4.create(corners);
    mat4.inverse(inverseCorners);

    var projMat = mat4.create(transformedCorners);
    mat4.multiply(projMat, inverseCorners);

    // console.log({
    //     corners,
    //     transformedCorners,
    //     inverseCorners,
    //     projMat
    // });

    return projMat;
}


function myMultiplyVecByMatrix(someMat4, someVec4){
    //this achieves same result as mat4.multiplyVec4(someMat4, someVec4); (though glMatrix overwrites input mat)

    var output = vec4.create([0,0,0,0]);

    for (var ii=0;ii<4;ii++){
        for (var jj=0;jj<4;jj++){
            output[ii] += someMat4[ii+4*jj]*someVec4[jj];
        }
    }
    return output;
}

function crossProd(vec1, vec2){
    return [
        vec1[1]*vec2[2] - vec1[2]*vec2[1],
        vec1[2]*vec2[0] - vec1[0]*vec2[2],
        vec1[0]*vec2[1] - vec1[1]*vec2[0],
    ];
}