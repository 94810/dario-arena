var runing=false;
var forward=true;
var x_pos = 0;
var spd=30;
var interv=110;

function run(){
	var ctx = document.getElementById("gameCanvas").getContext("2d");
	var str = document.getElementById('shirt_col').value ;
	var r = 255;
	var g = 255;
	var b = 255;

	str = str.slice(1);
	
	r = parseInt(str.slice(0,2),16);
	g = parseInt(str.substring(2,4),16);
	b = parseInt(str.substring(4,6),16);
	
	ctx.clearRect(0,0,900,150);
	
	ctx.save();
	ctx.translate(x_pos, 0);
	if(runing){
		runing = !runing;
		if(!forward) ctx.scale(-1, 1); 
		Dario.run(r, g, b, ctx);
	}else{
		runing = !runing;
		if(!forward) ctx.scale(-1, 1);
		Dario.stand(r,g,b, ctx);
	}

	if(x_pos>900 || x_pos<0){
		spd = -spd;
		forward = !forward;
	}

		x_pos+=spd;

	ctx.restore();
}

var pl = new Player(keyboard, {'x': 0, 'y':0}, 255, 255, 255);

function Anim(){
	
	var ctx = document.getElementById('gameCanvas').getContext('2d');
	ctx.clearRect(0,0,900,150);
	pl.update(ctx);

	window.requestAnimationFrame(Anim);
}

window.requestAnimationFrame(Anim);
//setInterval(run, interv);
 
