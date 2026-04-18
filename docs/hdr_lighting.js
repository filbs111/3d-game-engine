/*
if lighting is stored, for lighting amount x, as 
1-exp(-x)

double lighting is
1-exp(-2x)

can store light like this and choose blend mode to add light contributions eg in deferred lighting, and handle both dim and bright lights.

combining with srgb might be useful

suppose store colour like this in sRGB - ie where 0.5 is intrepreted as linear value 0.5^2.2

here y is value stored as interpreted by shader, L is linear light, x is srgb stored value - ie where precision is linear.

srgb
y = x^2.2		(1)

in exponential lighting scheme

y = 1-exp(-L)	(2)

combine (1),(2)

x^2.2 = 1-exp(-L)

x = (1- exp(-L))^0.455		(3)

- ln(1 - x^2.2) = L			(4)


what range of values of linear light can we represent? 
*/


var bitDepth = 10;  //1024 shades of grey. 10 bits per channel is generally available.
var twoToTheN = Math.pow(bitDepth,2);

console.log("HDR-sRGB");
var previousLight = 0;
for (var ii=1; ii<twoToTheN;ii++){
    var srgbVal = ii/twoToTheN; //from 0 to nearly 1
    var linearValShaderWillSee = Math.pow(srgbVal, 2.2);
    var brightnessThisRepresents = -Math.log(1 - linearValShaderWillSee);
    var fractionDifferent = (brightnessThisRepresents-previousLight)/brightnessThisRepresents;
    previousLight = brightnessThisRepresents;
    console.log(brightnessThisRepresents, Math.log(brightnessThisRepresents), fractionDifferent);
}

console.log("HDR-linear");
var previousLight = 0;
for (var ii=1; ii<twoToTheN;ii++){
    var linearValShaderWillSee = ii/twoToTheN; //from 0 to nearly 1
    var brightnessThisRepresents = -Math.log(1 - linearValShaderWillSee);
    var fractionDifferent = (brightnessThisRepresents-previousLight)/brightnessThisRepresents;
    previousLight = brightnessThisRepresents;
    console.log(brightnessThisRepresents, Math.log(brightnessThisRepresents), fractionDifferent);
}

console.log("sRGB");
previousLight = 0;
for (var ii=1; ii<twoToTheN;ii++){
    var srgbVal = ii/twoToTheN; //from 0 to nearly 1
    var linearVal = Math.pow(srgbVal, 2.2);
    var fractionDifferent = (linearVal-previousLight)/linearVal;
    previousLight = linearVal;
    console.log(linearVal, Math.log(linearVal), fractionDifferent);
}

console.log("linear");
previousLight = 0;
for (var ii=1; ii<twoToTheN;ii++){
    var linearVal = ii/twoToTheN; //from 0 to nearly 1
    var fractionDifferent = (linearVal-previousLight)/linearVal;
    previousLight = linearVal;
    console.log(linearVal, Math.log(linearVal), fractionDifferent);
}