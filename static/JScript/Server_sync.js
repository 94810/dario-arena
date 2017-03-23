var ws = new WebSocket("wss://"+window.location.host);

var wsSN  = "";

console.log('Starting.....');

ws.onopen = function(e) {
	console.log('Network check [OK]');
	console.log('HASSHIN');
	window.requestAnimationFrame(Anim);
	ws.onmessage = function(e) {
//		console.log(e.data);
	
		mess = JSON.parse(e.data);
		if("name" in mess){
			console.log('NAME');
			wsSN = mess.name;
		}else if("newp" in mess){
			console.log('NEWP');
			plD[mess.newp] = new Player(new web({left : false, right :false , jump : false}), mess.pos, 50,180,500);	
		}else if(wsSN in mess){
			for( pl in mess) if(pl != wsSN){
				plD[pl].pos = mess[pl].pos;
			}
		}
	
	};
};


function sendServData(){
	ws.send(JSON.stringify(plL.pos));	
}
