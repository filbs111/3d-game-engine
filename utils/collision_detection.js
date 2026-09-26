function lineSphereCollision(rayStart, rayEnd, sphereCentre, sphereRad){
    var noCollision = {collided:false};

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
        collided:true,
        fractionAlongRay,
        collisionPos
    };
}
