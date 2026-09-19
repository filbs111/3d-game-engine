var guiParams={
    externalCamFollowsPlayer:true,
    finalStageFxaa:true,
    useExperimentalProjectionMatrix:true,
    drawBody:true,
    carMode:"walk",
    camera:{
        interpolate:true,
        type:"first person",
        fisheyeMapping: "2 panel intermediate",
        simpleFisheyeStrength: 0.2,
        thobyK2: 0.75,
        tanKThetaK: 0.75,
        specialK: 0.75,
        zoom: .9
    },
    gun:{
        double:false,
        autofire:false
    },
    car:{
        drawWheelMarkers:true,
        brakeBias:.6
    },
    debug:{
        showFramerate:true,
        showSpeedInfo:false
    }
};

function setupGui(){
    var gui = new dat.GUI();

    gui.add(guiParams, "externalCamFollowsPlayer");
    gui.add(guiParams, "finalStageFxaa");
    gui.add(guiParams, "useExperimentalProjectionMatrix");
    gui.add(guiParams, "drawBody");
    gui.add(guiParams, "carMode", ["walk", "car1", "car2", "mecanum"]).listen();;

    var cameraFolder = gui.addFolder("camera");
    cameraFolder.add(guiParams.camera, "interpolate");
    cameraFolder.add(guiParams.camera, "type", ["first person", "third person", "fixed"]);

    cameraFolder.add(guiParams.camera, "fisheyeMapping", ["off", "1 panel intermediate", "2 panel intermediate", "simple", "stereographic", "equidistant", "equisolid", "thoby", "orthographic", "tan(kθ)", "special"]);
    //NOTE currently this is mixed up settings for both mapping and intermediates - all bar 1st 3 use cubemaps
    //fisheye strength values that apply to different fisheye types are controlled separately here.
    
    cameraFolder.add(guiParams.camera, "simpleFisheyeStrength", 0, 0.25, 0.01);
    cameraFolder.add(guiParams.camera, "thobyK2", 0.05, 1, 0.05);
    cameraFolder.add(guiParams.camera, "tanKThetaK", 0.05, 1, 0.05);
    cameraFolder.add(guiParams.camera, "specialK", 0, 1, 0.05);

    cameraFolder.add(guiParams.camera, "zoom", .4, 2, .05);

    var gunFolder = gui.addFolder('gun');
    gunFolder.add(guiParams.gun, "double");
    gunFolder.add(guiParams.gun, "autofire");

    var carFolder = gui.addFolder('car');
    carFolder.add(guiParams.car, "drawWheelMarkers");
    carFolder.add(guiParams.car, "brakeBias", .3, .7, .01);

    var debugFolder = gui.addFolder('debug');
    debugFolder.add(guiParams.debug, "showFramerate");
    debugFolder.add(guiParams.debug, "showSpeedInfo");
}