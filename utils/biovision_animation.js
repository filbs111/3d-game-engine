var biovisionAnimation = {};

function loadBiovisionAnimationStuff(){
    BVH.read("./animation/cmuconvert-mb2-01-09/02/02_01.bvh", function(motion) { 

        console.log({
            info:"loaded biovision hierarchy animation", 
            motion
        });
        
        biovisionAnimation.data = motion;
        biovisionAnimation.loaded = true;
    });
}

function drawBiovisionAnimation(anim, currentTime, activeProg){

    if (!biovisionAnimation.loaded){
        return;
    }

    var animationData = anim.data;

    var maxAnimationFrameNum = animationData.numFrames;
    var frameDuration = animationData.frameTime * 1000;    //ms
    var animationFrame = Math.floor((Math.floor(currentTime / frameDuration)) % maxAnimationFrameNum); //TODO ensure within bounds

    // console.log({
    //     currentTime,
    //     maxAnimationFrameNum,
    //     animationFrame
    // });

    var animatedMats = generateMatricesListForPoints(animationData.root, mat4.identity(), animationFrame);

    //scale relative to world origin?
    var correctiveScaleFactor = 0.065;
    var animWorldPosition = [0,-1,5];
    
    mat4.translate(cameraMat, animWorldPosition);
    mat4.scale(cameraMat, [1,1,1].map(x=>x*correctiveScaleFactor));

   	prepBuffersForDrawing(cubeBuffers, activeProg);

    animatedMats.forEach(matWithInfo => {
        //a bone with matrices ends matWithInfo.mat , matWithInfo.from

        mat4.set(matWithInfo.mat, mMatrix);
        mat4.scale(mMatrix,[1,1,1].map(x=>x*0.5));

        drawObjectFromPreppedBuffers(cubeBuffers, activeProg);

        //draw a dotted line taking rotation of end bone and translation along path from "from" mat to "mat" mat
        var startPosition = matWithInfo.from.slice(12,15);
        var endPosition = matWithInfo.mat.slice(12,15);
        //TODO num points dependent on length 
        var difference = endPosition.map((xx,ii)=> xx-startPosition[ii] );
        var numsteps = 8;
        for (var ii=0;ii<numsteps;ii++){
            mat4.set(matWithInfo.from, mMatrix);

            //mat4.translate(mMatrix, difference.map(xx=>ii*xx/numsteps));  //this doesn't work AFAIK because it's in local object frame.
            mMatrix[12] +=difference[0]*ii/numsteps;
            mMatrix[13] +=difference[1]*ii/numsteps;
            mMatrix[14] +=difference[2]*ii/numsteps;

            mat4.scale(mMatrix,[1,1,1].map(x=>x*0.5));
            drawObjectFromPreppedBuffers(cubeBuffers, activeProg);
        }
    });

    //reset camera scale
    mat4.scale(cameraMat, [1,1,1].map(x=>x/correctiveScaleFactor));
    mat4.translate(cameraMat, animWorldPosition.map(x=>-x));
}
