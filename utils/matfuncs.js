
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

function multiply_quaternions(b,a){	//note switched input order for consistency with matrix multiplication
	var prod=[];
	prod[0]=a[0]*b[0]-(a[1]*b[1]+a[2]*b[2]+a[3]*b[3]);       //s1s2 - v1.v2
    //vector part of product= s1v2+s2v1+s3v3 +v1 x v2
	prod[1]=a[0]*b[1]+b[0]*a[1]+ a[2]*b[3]-a[3]*b[2];
	prod[2]=a[0]*b[2]+b[0]*a[2]+ a[3]*b[1]-a[1]*b[3];
	prod[3]=a[0]*b[3]+b[0]*a[3]+ a[1]*b[2]-a[2]*b[1];
	return prod;
}