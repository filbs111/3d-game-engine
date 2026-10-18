
function dotProduct(vec1,vec2){
    return vec1[0]*vec2[0] + vec1[1]*vec2[1] + vec1[2]*vec2[2];
}

function dotProd2(vec1,vec2){
    return vec1[0]*vec2[0] + vec1[1]*vec2[1];
}

function crossProduct(vec1, vec2){
    return [
        vec1[1]*vec2[2] - vec1[2]*vec2[1],
        vec1[2]*vec2[0] - vec1[0]*vec2[2],
        vec1[0]*vec2[1] - vec1[1]*vec2[0],
    ];
}

function normalise3(vv){
    var len = Math.sqrt(vv[0]*vv[0]+ vv[1]*vv[1] + vv[2]*vv[2]);
    return [vv[0]/len, vv[1]/len, vv[2]/len];
}

function vectorSum(vec1, vec2){
    return [
        vec1[0] + vec2[0],
        vec1[1] + vec2[1],
        vec1[2] + vec2[2],
    ];
}

function vectorDifference(vec1, vec2){
    return [
        vec1[0] - vec2[0],
        vec1[1] - vec2[1],
        vec1[2] - vec2[2],
    ];
}

function normalise_quat(q){
	var sumsq=0;
	for (var ii=0;ii<4;ii++){
		sumsq+=q[ii]*q[ii];
	}
	var sum = Math.sqrt(sumsq);
	for (var ii=0;ii<4;ii++){
		q[ii]/=sum;
	}
}

function multiply_quaternions(b,a){	//note switched input order for consistency with matrix multiplication
	var prod=[];
	prod[0]=a[0]*b[0]-(a[1]*b[1]+a[2]*b[2]+a[3]*b[3]);       //s1s2 - v1.v2
    //vector part of product= s1v2+s2v1+s3v3 +v1 x v2
	prod[1]=a[0]*b[1]+b[0]*a[1]+ a[2]*b[3]-a[3]*b[2];
	prod[2]=a[0]*b[2]+b[0]*a[2]+ a[3]*b[1]-a[1]*b[3];
	prod[3]=a[0]*b[3]+b[0]*a[3]+ a[1]*b[2]-a[2]*b[1];
	return prod;
}

function matFromPosAndQuat(pos, quat){

    var matToReturn = mat4.create();

    var turnMat = mat4.create();
    quat4.toMat3(quat, turnMat);

    //create matrix for displaying object - NOTE might wish to calc this when drawing, or even just pass quat and pos to shader.
    //TODO get a matrix lib that can find docs for! don't just guess because takes ages.
    //copy 3x3 part
    for (var aa=0;aa<3;aa++){
        for (var bb=0;bb<3;bb++){
            matToReturn[aa*4+bb] = turnMat[aa*3+bb];
        }
    }

    //set position part.
    matToReturn[12]=pos[0];
    matToReturn[13]=pos[1];
    matToReturn[14]=pos[2];

    matToReturn[15]=1;  //IIRC this is standard

    return matToReturn;
}