var ws = new WebSocket("ws://"+window.location.host);

var wsSN  = "";

console.log('Starting.....');

ws.onopen = function(e) {
	console.log('Network check [OK]');
	console.log('HASSHIN');
	window.requestAnimationFrame(Anim);
	ws.onmessage = function(e) {

		mess = JSON.parse(e.data);
		if("name" in mess){
			console.log('NAME');
			wsSN = mess.name;
		}else if("newp" in mess){
			console.log('NEWP');
			console.log(mess);
			plD[mess.newp] = new Player(new web(), {'x' : mess.pos.x, 'y' : mess.pos.y }, 50, 180, 500);	
		}else{
			for( pl in mess){
				plD[pl].pos = mess[pl].pos;
			}
		}
	
	};
};


function sendServData(){
	ws.send(JSON.stringify({'pos' : plL.pos}));
}
