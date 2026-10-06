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
