function lineSphereCollision(rayStart, rayEnd, sphereCentre, sphereRad){
    var noCollision = {fractionAlongRay:Number.MAX_VALUE};

    var sphereRadSquared = sphereRad*sphereRad;
    var rayVec = vectorDifference(rayEnd, rayStart);
    var rayLengthSquared = dotProd3(rayVec, rayVec);

    var rayStartToSphereCentre = vectorDifference(sphereCentre, rayStart);
    var rayCrossToSphere = crossProd(rayVec, rayStartToSphereCentre);   //TODO use distributive property to get from rayStart, rayEnd, sphereCentre without vector difference? faster?

    var moveBackDistSq = sphereRadSquared - dotProd3(rayCrossToSphere,rayCrossToSphere)/rayLengthSquared;

    if (moveBackDistSq<=0){
        return noCollision;
    }

    var rayLength = Math.sqrt(rayLengthSquared);

    var moveDistanceToLevelWithSphere = dotProd3(rayVec, rayStartToSphereCentre) / rayLength;

    var moveDistanceToSphereSurf = moveDistanceToLevelWithSphere - Math.sqrt(moveBackDistSq);

    var fractionAlongRay = moveDistanceToSphereSurf / rayLength;

    if (fractionAlongRay<0 || fractionAlongRay>1){
        return noCollision;
    }

    var collisionPos = rayStart.map((xx,ii)=> xx + rayVec[ii]*fractionAlongRay);

    console.log({
        sphereRadSquared,
        rayStartToSphereCentre,
        rayCrossToSphere,
        rayLengthSquared,
        rayLength,
        moveBackDistSq,
        moveDistanceToLevelWithSphere,
        moveDistanceToSphereSurf,
        fractionAlongRay,
        collisionPos
    });

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
    var rayCrossLine = crossProd(rayVec, capsuleVec);

    //normalised direction to line at closest approach is this divided by the length of both lines
    //to get distance to closest approach, dot any vector from ray to line with this direction.
    var rayToLineVec = vectorDifference(rayStart, capsuleStartSphereCentre);
    var dotted = dotProd3(rayCrossLine, rayToLineVec);
    var capsuleVecLenSq = dotProd3(capsuleVec,capsuleVec);
    //divide by lengths
    var bothLengthsSquared = dotProd3(rayVec,rayVec)*capsuleVecLenSq;
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

    var dotStart = dotProd3(rayStartMinusLine, capsuleVec);
    var toSubtractStart = capsuleVec.map(xx=> xx*dotStart/capsuleVecLenSq);
    var flattendStart = vectorDifference(rayStartMinusLine, toSubtractStart);

    var dotEnd = dotProd3(rayEndMinusLine, capsuleVec);
    var toSubtractEnd = capsuleVec.map(xx=> xx*dotEnd/capsuleVecLenSq);
    var flattendEnd = vectorDifference(rayEndMinusLine, toSubtractEnd);

    //reuse sphere test code. (TODO optimise)
    var lineCollisionHackResult = lineSphereCollision(flattendStart, flattendEnd, [0,0,0], sphereRad);

    //redundant test, but maybe  useful for perf.
    if (lineCollisionHackResult.fractionAlongRay>1){
        return noCollision;
    }

    var alongLineVec = rayVec.map(xx=>xx*lineCollisionHackResult.fractionAlongRay);
    
    var howFarAlongLineFromRayStartToCollision = dotProd3(alongLineVec, capsuleVec)/capsuleVecLenSq;   //fraction of capsule lengths from ray start to ray collision

    var rayStartToLineStart = vectorDifference(capsuleStartSphereCentre, rayStart);
    var howFarAlongLineFromRayStartToCapsuleStart = dotProd3(rayStartToLineStart, capsuleVec)/capsuleVecLenSq;  // Math.sqrt(capsuleVecLenSq * dotProd3(rayStartToLineStart,rayStartToLineStart));
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

    console.log({
        collisionWithStartSphere,
        collisionWithEndSphere,
        collisionWithCylinder
    });

    return collisionResult;
}


function lineFatTriangleCollision(rayStart, rayEnd, triangleCorners, sphereRad){
    //collision of ray with triangle bloated by a sphere, equivalent to spherecast with triangle.
    // intermediate results eg cross products likely reusable.
    // TODO more efficient version, use tests to compare functionality to this more obviously correct but inefficient version

    //check collision with both sphere capsule end caps
    var collisionWithCorners = triangleCorners.map(corner => {return lineSphereCollision(rayStart, rayEnd, corner, sphereRad)});

    var collisionWithCylinders = triangleCorners.map( (corner, ii) => {
        var otherCornerIdx = (ii+1)%3;
        console.log(ii,otherCornerIdx);
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

    var surfNormal = crossProd(edges[0], edges[2]);
    var edgeOutwardNormals = edges.map( edge => crossProd(edge, surfNormal));   //TODO check sign - outward or inward?
    
    var surfNormalLen = Math.sqrt(dotProd3(surfNormal,surfNormal));

    var normalisedNormal = surfNormal.map(xx=>xx/surfNormalLen);

    var rayStartInNormalDirection = dotProd3(normalisedNormal, rayStart);
    var rayEndInNormalDirection = dotProd3(normalisedNormal, rayEnd);

    var triangleInNormalDirection = dotProd3(normalisedNormal, triangleCorners[0]);

    var sign = Math.sign(rayStartInNormalDirection - triangleInNormalDirection);

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
        var edgeInEdgeDirection = dotProd3(triangleCorners[ii], edgeOutwardNormals[ii]);    //this could be precomputed (store edge direction not as normalised?)
        var collisionPointInEdgeDirection = dotProd3(collisionPos, edgeOutwardNormals[ii]);
        var difference = edgeInEdgeDirection - collisionPointInEdgeDirection;
        edgeTestResult += Math.sign(difference);
    }

    if (Math.abs(edgeTestResult) == 3){
        return {
            fractionAlongRay,
            collisionPos
        };
    }

    var collisionResult = {fractionAlongRay:Number.MAX_VALUE};    //no collision

    for (var ii=0;ii<3;ii++){
        if (collisionResult.fractionAlongRay>collisionWithCorners[ii].fractionAlongRay){
            console.log("hit! " + ii);
            collisionResult=collisionWithCorners[ii];
        }
       if (collisionResult.fractionAlongRay>collisionWithCylinders[ii].fractionAlongRay){collisionResult=collisionWithCylinders[ii]}
    }

    console.log({
        collisionWithCorners,
        collisionWithCylinders
    })

    return collisionResult;
}
