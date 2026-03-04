//test script for fisheye mappings that preserve angle from point of view where display screen takes up different FOV to game camera.
// TODO analytically, but want to test anyway. 

//1 - simple fisheye
// for some square in game camera at position (x,z) where z=1 , pointed in z direction, has angle away from straight forwards theta, where tan theta = x/z = x
// and so visible size has aspect ratio expected of sin(theta). calculate to confirm

var smallDelta = 0.00001;

for (var xx=0;xx<0.05;xx+=0.01){

    var ang = Math.atan(xx);
    var aspectRatioExpected = Math.cos(ang);
    
    var angleDifferenceX = Math.atan(xx + smallDelta) - Math.atan(xx);
    var distanceToCentre = Math.sqrt(1 + xx*xx);
    var angleDifferenceY = Math.atan(smallDelta / distanceToCentre);
    var observedAspect = angleDifferenceX/angleDifferenceY;

    console.log("xx: " + xx + "\t aspectRatioExpected: " + aspectRatioExpected + "\t calculated: " + observedAspect);


    //calculate aspect as viewed from distance from camera n.
    var nn= 0.5;
    var angleDifferenceXFromDistanceN = Math.atan((xx + smallDelta)/nn) - Math.atan(xx/nn);
    var distanceToCentreFromN = Math.sqrt(nn*nn + xx*xx);
    var angleDifferenceYFromN = Math.atan(smallDelta / distanceToCentreFromN);
    var observedAspectFromN = angleDifferenceXFromDistanceN/angleDifferenceYFromN;

    console.log("          ratio of ratios minus 1: " + (observedAspectFromN/observedAspect - 1));    //number shows that thing becomes stretched in x when viewed from N (n>1)


    //experiment with fisheye adjustment. TODO what is equivalent to simple fisheye shader? - just adjust x? or adjust z too?
    // basically for small angle suspect these fisheye shaders behave ~ same, so just want idea of dependence of some curvature /distortion val as function of n
    //var somemapping = xx => (xx*(1-0.125*xx*xx));  // 1 - xx*xx/8 seems about right for n=2 
    //var somemapping = xx => (xx*(1-0.156*xx*xx));       // n=4
    //var somemapping = xx => (xx*(1-0.165*xx*xx));       // n=9
    //var somemapping = xx => (xx*(1-0.164*xx*xx));       //n=8
    //var somemapping = xx => (xx*(1-0.1665*xx*xx));        //n=100. suggests tends towards 1/6

    // from working below, think generall mapping is
    // k = (n^2 -1) / (6n^2)
    
    var somemapping = (function generateMapping(n) {
        var nn = n*n;
        var k = (nn-1) / (6*nn);
        return xx => xx*(1-k*xx*xx);
    })(nn);

    var xxmapped = somemapping(xx);
    var angleDifferenceXFromDistanceNMapped = Math.atan(somemapping(xx + smallDelta)/nn) - Math.atan(xxmapped/nn);
    var distanceToCentreFromNMapped = Math.sqrt(nn*nn + xxmapped*xxmapped);
    var angleDifferenceYFromNMapped = Math.atan(somemapping(smallDelta) / distanceToCentreFromNMapped);
    var observedAspectFromNMapped = angleDifferenceXFromDistanceNMapped/angleDifferenceYFromNMapped;

    console.log("          ratio of ratios mapped minus 1: " + (observedAspectFromNMapped/observedAspect - 1));

    // not obvious to guess mapping function as function of n. what is analytic aspect for mapped? 

    //for a mapping x => x*(1- k x*x)
   
    //really the ratio is just affected by derivative of mapping (squashes in x)
    // and movement back by n (expands in x)
    // derivative of mapping: 1 - 3kx^2
    // expansion from moving back is like cosine of angle away from viewpoint 
    // adj/hyp = n / hypot(n,xmapped)
    // effective aspect from multiplying: (1 - 3kx^2) * n/ hypot(n,xmapped)

    // cosine ~ n ( 1- (xmapped/n)^2 /2 )   (for small x)
    //  ~  n ( 1 - x^2/(2n^2) + kx^4/n^2 + ... )

    // (1 - 3kx^2)  *  n ( 1 - x^2/(2n^2) + kx^4/n^2 ) ~  aspectRatioExpected = cos(x) ~ 1- x^2/2

    // (1)

    //  lose x^4 term 

   // (1 - 3kx^2)  *  ( 1 - x^2/(2n^2) )  =  1- x^2/2

   // multiply by 2n^2
   // (1 - 3kx^2)  *  ( 2n^2 - x^2 )  =  2n^2 - n^2x^2
   // multiply LHS terms

   // 2n^2 - x^2 - 6kn^2x^2 + 3kx^4 =  2n^2 - n^2x^2
   
   // lose x^4 term
   // 2n^2 - x^2 - 6kn^2x^2  =  2n^2 - n^2x^2

   // differentiate wrt x
   // -2x - 12kn^2 x = -2 n^2 x
   // lose x
   // -2 -12k n^2 = - 2 n^2
   // divide by -2
   // 1 + 6k n^2 = n^2 
   // 6k n^2 = n^2 -1 
   // k = (n^2 -1) / (6n^2)

   // n= 1      k = 0
   // n= 2      k = 3/24 = 1/8
   // n = inf   k = 1/6
}

