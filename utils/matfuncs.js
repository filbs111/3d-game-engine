
function dotProd3(vec1,vec2){
    return vec1[0]*vec2[0] + vec1[1]*vec2[1] + vec1[2]*vec2[2];
}

function dotProd2(vec1,vec2){
    return vec1[0]*vec2[0] + vec1[1]*vec2[1];
}

function crossProd(vec1, vec2){
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

function vectorDifference(vec1, vec2){
    return [
        vec1[0] - vec2[0],
        vec1[1] - vec2[1],
        vec1[2] - vec2[2],
    ];
}
