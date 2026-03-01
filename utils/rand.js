function gaussRand(){
    //gaussianish distribution.
    var rootSamples = 3;
    var samples = rootSamples*rootSamples;
    var total = samples/2;
    for (var ii=0;ii<samples;ii++){
        total-=Math.random();
    }
    return total/rootSamples;
}