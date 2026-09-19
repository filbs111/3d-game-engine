var framerateCalculator = (()=>{
    var lastFrameTime = 0;
    var framesSum = 0;
    var timeSum = 0;
    var decayTimeMillis = 200;
    var framerate;

    var update = (currentFrameTime) => {
        var elapsed = currentFrameTime - lastFrameTime;
        lastFrameTime = currentFrameTime;

        var decay = Math.exp(-elapsed/decayTimeMillis);

        framesSum*=decay;
        timeSum*=decay;

        framesSum+=1;
        timeSum+=elapsed;

        framerate = 1000* framesSum / timeSum;
    };

    var get = () => {
        return framerate;
    }

    return {
        get,
        update
    }
})();