var matFuncsLookup = {
    Xposition: (mat, amount) => mat4.translate(mat, [amount,0,0]),
    Yposition: (mat, amount) => mat4.translate(mat, [0,amount,0]), 
    Zposition: (mat, amount) => mat4.translate(mat, [0,0,amount]),
    Xrotation: (mat, angDeg) => mat4.rotateX(mat, angDeg*Math.PI/180),
    Yrotation: (mat, angDeg) => mat4.rotateY(mat, angDeg*Math.PI/180),
    Zrotation: (mat, angDeg) => mat4.rotateZ(mat, angDeg*Math.PI/180)
};

function generateMatricesListForPoints(bone, inputMat, frameIndex){
    //TODO make this yield matrices to avoid creating large array? (maybe retain a stack of mats as traverse skeleton)
    
    //make recursive - assume for now that offset is applied then animation rotation+offset. (?)

    var matsToReturn = [];

    var firstMat = mat4.create(inputMat);
    // var firstMat = mat4.identity();

    translateMatXyz(firstMat, [bone.offsetX, bone.offsetY, bone.offsetZ]);

    if (bone.offsetX!=0 || bone.offsetY!=0 || bone.offsetZ!=0){
        //add an extra mat. these are most of the lines that will be visible, because "from" position and "mat" position are different
        //others that will be visible: things with nonzero translation in channel data, and leaf nodes (with endOffset)
        matsToReturn.push({mat:firstMat, from:inputMat, id:bone.id, info:"constant offset" });
    }

    var secondMat = mat4.create(firstMat);

    //apply animation of this bone. TODO get order right!
    var animFrame = bone.frames[frameIndex];

    bone.channels.forEach((chan,ii) => {
        matFuncsLookup[chan](secondMat, animFrame[ii])
    });
   
    matsToReturn.push({mat:secondMat, from:firstMat, id:bone.id, info:"after pose"});

    if (bone.hasEnd){
        var endMat = mat4.create(secondMat);
        translateMatXyz(endMat, [bone.endOffsetX, bone.endOffsetY, bone.endOffsetZ]);
        matsToReturn.push({mat:endMat, from:secondMat, id:bone.id, info:"after end offset"});
    }

    if (!bone.children || bone.children.length == 0){
        return matsToReturn;
    }

    var matArrs = [matsToReturn];

    bone.children.forEach(childBone => matArrs.push(generateMatricesListForPoints(childBone, secondMat, frameIndex)));

    return matArrs.flat();
}


function translateMatXyz(mat, xyz){
    mat4.translate(mat, xyz);
}