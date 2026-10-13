function lineSphereCollision(rayStart, rayEnd, sphereCentre, sphereRad){
    var noCollision = {fractionAlongRay:Number.MAX_VALUE};

    var sphereRadSquared = sphereRad*sphereRad;
    var rayVec = vectorDifference(rayEnd, rayStart);
    var rayLengthSquared = dotProduct(rayVec, rayVec);

    var rayStartToSphereCentre = vectorDifference(sphereCentre, rayStart);
    var rayCrossToSphere = crossProduct(rayVec, rayStartToSphereCentre);   //TODO use distributive property to get from rayStart, rayEnd, sphereCentre without vector difference? faster?

    var moveBackDistSq = sphereRadSquared - dotProduct(rayCrossToSphere,rayCrossToSphere)/rayLengthSquared;

    if (moveBackDistSq<=0){
        return noCollision;
    }

    var rayLength = Math.sqrt(rayLengthSquared);

    var moveDistanceToLevelWithSphere = dotProduct(rayVec, rayStartToSphereCentre) / rayLength;

    var moveDistanceToSphereSurf = moveDistanceToLevelWithSphere - Math.sqrt(moveBackDistSq);

    var fractionAlongRay = moveDistanceToSphereSurf / rayLength;

    if (fractionAlongRay<0 || fractionAlongRay>1){
        return noCollision;
    }

    var collisionPos = rayStart.map((xx,ii)=> xx + rayVec[ii]*fractionAlongRay);

    // console.log({
    //     sphereRadSquared,
    //     rayStartToSphereCentre,
    //     rayCrossToSphere,
    //     rayLengthSquared,
    //     rayLength,
    //     moveBackDistSq,
    //     moveDistanceToLevelWithSphere,
    //     moveDistanceToSphereSurf,
    //     fractionAlongRay,
    //     collisionPos
    // });

    return {
        fractionAlongRay,
        collisionPos
    };
}

function lineCylinderCollision(rayStart, rayEnd, capsuleStartSphereCentre, capsuleEndSphereCentre, sphereRad){
    var noCollision = {fractionAlongRay:Number.MAX_VALUE};

    var sphereRadSquared = sphereRad*sphereRad;
    
    var rayVec = vectorDifference(rayEnd, rayStart);
    var capsuleVec = vectorDifference(capsuleEndSphereCentre, capsuleStartSphereCentre);
    var rayCrossLine = crossProduct(rayVec, capsuleVec);

    //normalised direction to line at closest approach is this divided by the length of both lines
    //to get distance to closest approach, dot any vector from ray to line with this direction.
    var rayToLineVec = vectorDifference(rayStart, capsuleStartSphereCentre);
    var dotted = dotProduct(rayCrossLine, rayToLineVec);
    var capsuleVecLenSq = dotProduct(capsuleVec,capsuleVec);
    //divide by lengths
    var bothLengthsSquared = dotProduct(rayVec,rayVec)*capsuleVecLenSq;
    if (dotted/bothLengthsSquared > sphereRadSquared){
        return noCollision;
    }
    //else extended line collides with extended cylinder. should work out whether collision point is ray between start and end and on cylinder between start and end


    // do in most straightforward way. TODO try to optimise
    //"flatten" ray ends onto plane by subtracting part in direction of line.
    // and subtract position of line flattened onto this plane
    // can do this by instead flattening ray ends minus a line point
    // result is two points on a plane joined by ray projected onto the plane, which can test vs a circle on plane at the origin. FWIW equivalent to a sphere at the origin - maybe can reuse sphere collision code.
    
    var rayStartMinusLine = vectorDifference(rayStart, capsuleStartSphereCentre);
    var rayEndMinusLine = vectorDifference(rayEnd, capsuleStartSphereCentre);

    var dotStart = dotProduct(rayStartMinusLine, capsuleVec);
    var toSubtractStart = capsuleVec.map(xx=> xx*dotStart/capsuleVecLenSq);
    var flattendStart = vectorDifference(rayStartMinusLine, toSubtractStart);

    var dotEnd = dotProduct(rayEndMinusLine, capsuleVec);
    var toSubtractEnd = capsuleVec.map(xx=> xx*dotEnd/capsuleVecLenSq);
    var flattendEnd = vectorDifference(rayEndMinusLine, toSubtractEnd);

    //reuse sphere test code. (TODO optimise)
    var lineCollisionHackResult = lineSphereCollision(flattendStart, flattendEnd, [0,0,0], sphereRad);

    //redundant test, but maybe  useful for perf.
    if (lineCollisionHackResult.fractionAlongRay>1){
        return noCollision;
    }

    var alongLineVec = rayVec.map(xx=>xx*lineCollisionHackResult.fractionAlongRay);
    
    var howFarAlongLineFromRayStartToCollision = dotProduct(alongLineVec, capsuleVec)/capsuleVecLenSq;   //fraction of capsule lengths from ray start to ray collision

    var rayStartToLineStart = vectorDifference(capsuleStartSphereCentre, rayStart);
    var howFarAlongLineFromRayStartToCapsuleStart = dotProduct(rayStartToLineStart, capsuleVec)/capsuleVecLenSq;  // Math.sqrt(capsuleVecLenSq * dotProd3(rayStartToLineStart,rayStartToLineStart));
    var howFarAlongLine = howFarAlongLineFromRayStartToCollision - howFarAlongLineFromRayStartToCapsuleStart;

    // console.log({howFarAlongLine,howFarAlongLineFromRayStartToCapsuleStart,howFarAlongLineFromRayStartToCollision});

    if ( (howFarAlongLine<0) || (howFarAlongLine > 1) ){
        return noCollision;
    }

    var cylinderCollisionPos = vectorSum(rayStart, alongLineVec);

    lineCollisionHackResult.collisionPos = vectorSum(rayStart, alongLineVec);

    return lineCollisionHackResult;
}

function lineCapsuleCollision(rayStart, rayEnd, capsuleStartSphereCentre, capsuleEndSphereCentre, sphereRad){
    //NOTE some calculations in these methods will be repeated. TODO inline/deduplicate?

    //check collision with both sphere capsule end caps
    var collisionWithStartSphere = lineSphereCollision(rayStart, rayEnd, capsuleStartSphereCentre, sphereRad);
    var collisionWithEndSphere = lineSphereCollision(rayStart, rayEnd, capsuleEndSphereCentre, sphereRad);

    //check collision with cylinder
    var collisionWithCylinder = lineCylinderCollision(rayStart, rayEnd, capsuleStartSphereCentre, capsuleEndSphereCentre, sphereRad);

    //return earliest collision.
    var collisionResult = collisionWithStartSphere;
    if (collisionResult.fractionAlongRay>collisionWithEndSphere.fractionAlongRay){collisionResult=collisionWithEndSphere}
    if (collisionResult.fractionAlongRay>collisionWithCylinder.fractionAlongRay){collisionResult=collisionWithCylinder}

    // console.log({
    //     collisionWithStartSphere,
    //     collisionWithEndSphere,
    //     collisionWithCylinder
    // });

    return collisionResult;
}

function coarseLineFatTriangleCollision(rayStart, rayEnd, triangleCorners, sphereRad){
    //check whether bounding box collides with ray.
    // can use in conjunction with BVH, can precalculate

    var boundingBoxLimits = [0,1,2].map(ii => {
        var valsForThisComponent = triangleCorners.map(cc => cc[ii]);
        return [Math.min, Math.max].map(ff => ff.apply(null, valsForThisComponent));
    });
    
    //could do something better here (ray vs box expanded by sphereRad), but simple alternative should do to discard ray vs most triangles
    // just wrap the bounding box in a sphere, test infinte extended ray
    // TODO check start, end if using a short ray, or perhaps for short rays just wrap whole ray in AABB so simple ray AABB vs triangle AABB test
    var boxHalfDimensions = [0,1,2].map(ii=> (boundingBoxLimits[ii][1] - boundingBoxLimits[ii][0])/2);
    var boxCentre = [0,1,2].map(ii=> (boundingBoxLimits[ii][1] + boundingBoxLimits[ii][0])/2);
    var boundingSphereRadSq = boxHalfDimensions.reduce((sum, current) => sum+current*current, 0);
    var totalRad = Math.sqrt(boundingSphereRadSq) + sphereRad;

    //console.log({boundingBoxLimits, boxHalfDimensions, boxCentre, totalRad});

    //what is closest approach of extended line to sphere?
    var ray = vectorDifference(rayStart, rayEnd);
    var toSphere = vectorDifference(rayStart, boxCentre);
    var crossRayWithToSphere = crossProduct(ray, toSphere);    //what if these are parallel? does this still work?
    var crossAgain = crossProduct(crossRayWithToSphere, ray);  //vector between sphere and point of closest approach of ray to sphere
    var lenSqToNormalise = dotProduct(crossAgain, crossAgain);
    if (lenSqToNormalise == 0){
        return true;    //guess special case
    }
    var dotted = dotProduct(crossAgain, toSphere);
    return dotted*dotted < lenSqToNormalise*totalRad*totalRad;
}

function lineFatTriangleCollision(rayStart, rayEnd, triangleCorners, sphereRad){

    if (!coarseLineFatTriangleCollision(rayStart, rayEnd, triangleCorners, sphereRad)){
        return {fractionAlongRay:Number.MAX_VALUE};    //no collision 
    }

    //collision of ray with triangle bloated by a sphere, equivalent to spherecast with triangle.
    // intermediate results eg cross products likely reusable.
    // TODO more efficient version, use tests to compare functionality to this more obviously correct but inefficient version

    //check collision with both sphere capsule end caps
    var collisionWithCorners = triangleCorners.map(corner => {return lineSphereCollision(rayStart, rayEnd, corner, sphereRad)});

    var collisionWithCylinders = triangleCorners.map( (corner, ii) => {
        var otherCornerIdx = (ii+1)%3;
        var otherCorner = triangleCorners[otherCornerIdx];
        return lineCylinderCollision(rayStart, rayEnd, corner, otherCorner, sphereRad);
    });

    //collision with flat part.
    //if collides with near face then doesn't collide with anything else.
    //similarly, if doesn't collide with near face and does collide with cylinders then doesn't collide with corners

    var edges = [
        vectorDifference(triangleCorners[0],triangleCorners[1]),
        vectorDifference(triangleCorners[1],triangleCorners[2]),
        vectorDifference(triangleCorners[2],triangleCorners[0])];

    var surfNormal = crossProduct(edges[0], edges[2]);
    var edgeOutwardNormals = edges.map( edge => crossProduct(edge, surfNormal));   //TODO check sign - outward or inward?
    
    var surfNormalLen = Math.sqrt(dotProduct(surfNormal,surfNormal));

    var normalisedNormal = surfNormal.map(xx=>xx/surfNormalLen);

    var rayStartInNormalDirection = dotProduct(normalisedNormal, rayStart);
    var rayEndInNormalDirection = dotProduct(normalisedNormal, rayEnd);

    var triangleInNormalDirection = dotProduct(normalisedNormal, triangleCorners[0]);

    var toRayStartInNormalDirection = rayStartInNormalDirection - triangleInNormalDirection;

    if (Math.abs(toRayStartInNormalDirection) > sphereRad){
        //if not true then starting from between planes parallel to triangle shifted in either direction, so will only hit face AFTER going through triangle edge cylinder 

        var sign = Math.sign(toRayStartInNormalDirection);

        var relevanTriangleFaceInNormalDirection = triangleInNormalDirection + sign*sphereRad;

        var triToRayStart = rayStartInNormalDirection - relevanTriangleFaceInNormalDirection;
        var triToRayEnd = rayEndInNormalDirection - relevanTriangleFaceInNormalDirection;
        //weight start and end position
        var fractionAlongRay = triToRayStart / (triToRayStart - triToRayEnd);
        var collisionPos = vectorSum( rayStart.map(xx=> xx*(1-fractionAlongRay)) , rayEnd.map(xx=> xx*fractionAlongRay));

        //check collisionPos inside triangle using edgeOutwardNormals - if all same sign then goes through - either all +ve or all -ve
        //this is a straightfoward intuitive test, but alternative might be to check "wrapping direction" of ray vs triangle edge. maybe can reuse more calculations for edge shared by 2 tris....
        var edgeTestResult = 0;
        for (var ii=0;ii<3;ii++){
            var edgeInEdgeDirection = dotProduct(triangleCorners[ii], edgeOutwardNormals[ii]);    //this could be precomputed (store edge direction not as normalised?)
            var collisionPointInEdgeDirection = dotProduct(collisionPos, edgeOutwardNormals[ii]);
            var difference = edgeInEdgeDirection - collisionPointInEdgeDirection;
            edgeTestResult += Math.sign(difference);
        }

        if (Math.abs(edgeTestResult) == 3){
            return {
                fractionAlongRay,
                collisionPos
            };
        }
    }

    var collisionResult = {fractionAlongRay:Number.MAX_VALUE};    //no collision

    for (var ii=0;ii<3;ii++){
        if (collisionResult.fractionAlongRay>collisionWithCorners[ii].fractionAlongRay){
            // console.log("hit! " + ii);
            collisionResult=collisionWithCorners[ii];
        }
       if (collisionResult.fractionAlongRay>collisionWithCylinders[ii].fractionAlongRay){collisionResult=collisionWithCylinders[ii]}
    }

    // console.log({
    //     collisionWithCorners,
    //     collisionWithCylinders
    // });

    return collisionResult;
}

function rayBvhTriangleCollision(rayStart, rayEnd, bvh, bvhPosition, bvhScale, sphereRad){
    //use 3D AABB generated using code from 3sphere project
    //various options of increasing speed and complexity
    // 1) test all triangles
    // 2) single AABB check per triangle
    // 3) use of heirarchy (check top level triangle etc). expect will be fast enough
    // 4) test multiple rays together (3sphere project doesn't do this.)
    // AABB checks can be ray vs AABB but ray vs bounding sphere likely OK.

    if (!bvh.isLoaded){
        return {fractionAlongRay:Number.MAX_VALUE};    //no collision
    }

    var rayStartRelative = vectorDifference(rayStart, bvhPosition).map(xx=>xx/bvhScale);
    var rayEndRelative = vectorDifference(rayEnd, bvhPosition).map(xx=>xx/bvhScale);

    sphereRad/=bvhScale;

    var allTris = bvh.trisWithAABB;
    var verts = bvh.verts;

    var collisionResult = {fractionAlongRay:Number.MAX_VALUE, collisionPos:[0,0,0]};


    for (var ii=0;ii<allTris.length;ii++){
        var thisTri = allTris[ii];
        var triangleCorners = thisTri.triangleIndices.map( idx => verts[idx]);
        var thisCollisionResult = lineFatTriangleCollision(rayStartRelative, rayEndRelative, triangleCorners, sphereRad);
        if (thisCollisionResult.fractionAlongRay < collisionResult.fractionAlongRay
            && thisCollisionResult.fractionAlongRay>0){ //TODO move this test into lineFatTriangleCollision ?
            collisionResult = thisCollisionResult;
        }
    }

    var scaledCoords = collisionResult.collisionPos.map(xx=>xx*bvhScale);

    collisionResult.collisionPos = vectorSum(scaledCoords, bvhPosition);

    console.log(collisionResult);

    return collisionResult;
}