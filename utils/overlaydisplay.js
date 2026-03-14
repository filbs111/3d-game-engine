var overlaycanvas;
var overlaycontext;

var overlaydisplay = (function(){

    var geeMeterCentre = [90,100];
    var geeMeterRadiusOneGee = 20;
    var geeMeterMaxGees = 2.5;
    var geeMeterWholeRadius = geeMeterRadiusOneGee*geeMeterMaxGees;

    var geeMeterReading = [0,0];


    function clear(){
        overlaycontext.clearRect(0, 0, overlaycanvas.width, overlaycanvas.height);
    }

    function drawGeeMeter(){
        overlaycontext.beginPath()
        overlaycontext.fillStyle = "rgba(0,0,0,0.5)";
        overlaycontext.beginPath();
        overlaycontext.arc(geeMeterCentre[0], geeMeterCentre[1], geeMeterWholeRadius, 0, 2 * Math.PI);
        overlaycontext.fill();
        overlaycontext.beginPath();
        overlaycontext.arc(geeMeterCentre[0], geeMeterCentre[1], geeMeterRadiusOneGee, 0, 2 * Math.PI);
        overlaycontext.fill();

        overlaycontext.fillStyle = "white";
        overlaycontext.fillRect(geeMeterCentre[0] + geeMeterRadiusOneGee*geeMeterReading[0] - 5, geeMeterCentre[1] + geeMeterRadiusOneGee*geeMeterReading[1] - 5, 10,10);
    }

    function setGeeMeter(accVecGees){
        //car z angle something like Math.atan(carMatrix[0], carMatrix[2])
        // car matrix is only rotated about z angle, so can just use XZ components of it. here probably carMatrix[0] = carMatrix[10], carMatrix[2] = -carMatrix[8]
        geeMeterReading = [accVecGees[0]*carMatrix[0] + accVecGees[2]*carMatrix[2], accVecGees[0]*carMatrix[8] + accVecGees[2]*carMatrix[10]];
    }

    return {
        clear,
        drawGeeMeter,
        setGeeMeter
    }
})();