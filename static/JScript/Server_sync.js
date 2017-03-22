var ws = new WebSocket("ws://"+window.location.host);

var wsSN  = "";

console.log('Starting.....');

ws.onopen = function(e) {
	console.log('Network check [OK]');
	console.log('HASSHIN');
	window.requestAnimationFrame(Anim);
	ws.onmessage = function(e) {
		console.log(e.data);
	
		mess = JSON.parse(e.data);
		if("name" in mess){
			wsSN = mess.name;
		}else if("newp" in mess){
			plD[mess.newp] = new Player(new web(mess.ctrl), mess.pos, 50,180,500);	
		}else if(wsSN in mess){
			for( pl in mess) if(pl != wsSN){
				plD[pl].pos = mess[pl].pos;
				plD[pl].ctrl = mess[pl].ctrl;
			}
		}
	
	};
};


function sendServData(){
	var obj = {};

	obj.ctrl = {left : plL.ctrl.left, right : plL.ctrl.right, jump :  plL.ctrl.jump};
	obj.pos = plL.pos;

	ws.send(JSON.stringify(obj));
	
}
