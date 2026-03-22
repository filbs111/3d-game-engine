function goFullscreen(elem){

	var that = elem;
	var toDoAfter = () => {
		resizecanvas();
		that.requestPointerLock();
	};

	if (window.electronAPI){
		window.electronAPI.enterFullscreen().then(toDoAfter);
	} else if (elem.requestFullscreen) {
		elem.requestFullscreen().then(toDoAfter);
	} else if (elem.webkitRequestFullscreen) {
		elem.webkitRequestFullscreen.then(toDoAfter);
	} else if (elem.mozRequestFullScreen) {
		elem.mozRequestFullScreen.then(toDoAfter);
	} else if (elem.msRequestFullscreen) {
		elem.msRequestFullscreen.then(toDoAfter);
	}
}