function Anim(){
	
	var ctx = document.getElementById('gameCanvas').getContext('2d');
	ctx.clearRect(0,0,1600,800);
//	ctx.fillStyle = 'green';
//	ctx.fillRect(0,0,1600,800);

	plL.update(ctx);

	for(i in plD){
		plD[i].update(ctx);
	}

	sendServData();

	window.requestAnimationFrame(Anim);
}
 
