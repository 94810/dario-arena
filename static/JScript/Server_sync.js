var ws = new WebSocket("ws://"+window.location.host);

var wsSN  = "";

console.log('Starting.....');

window.onclose = function () { ws.close();  }

ws.onopen = function(e) {
	console.log('Network check [OK]');
	console.log('HASSHIN');
	window.requestAnimationFrame(Anim);
	ws.onmessage = function(e) {

		mess = JSON.parse(e.data);
		if("name" in mess){
			console.log('NAME');
			console.log(mess);
			wsSN = mess.name;
			
			var str = mess.color;
			
			str = str.slice(1);
			
			console.log(str);

			plL.r = parseInt(str.slice(0,2),16);
			plL.v = parseInt(str.substring(2,4),16);
			plL.b = parseInt(str.substring(4,6),16);
			
			console.dir(plL);
		}else if("newp" in mess){
			console.log('NEWP');
			var str = mess.color.slice(1);
			plD[mess.newp] = new Player(new web(), {'x' : mess.pos.x, 'y' : mess.pos.y }, parseInt(str.slice(0,2),16), parseInt(str.substring(2,4),16), parseInt(str.substring(4,6),16));	
		}else if("dsc" in mess){
			console.log('DSC');
			delete plD[mess.dsc];
		}else if("kill" in mess){
			console.log('KILL'+mess.kill);
			SoundPlay('KILL');	
			if(mess.kill == wsSN){
				plL.pos = { x : Math.floor(Math.random()*1600), y : 0};
				plL.g = false; 
			}
		}
		else{
			for( pl in mess){
				plD[pl].pos = mess[pl].pos;
				plD[pl].forward = mess[pl].way;
				
				if(plD[pl].g == true && mess[pl].g == false){
					SoundPlay('JUMP');
				}
				
				plD[pl].g = mess[pl].g;
			}
		}
	
	};
};


function sendServData(){
	ws.send(JSON.stringify({'pos' : plL.pos, 'way' : plL.forward, 'g' : plL.g }));
}
