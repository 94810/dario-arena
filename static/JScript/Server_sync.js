var ws = new WebSocket("wss://"+window.location.host);

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
			
		}else if("newp" in mess){
			console.log('NEWP');
			var str = mess.color.slice(1);
			plD[mess.newp] = new Player(new web(), {'x' : mess.pos.x, 'y' : mess.pos.y }, parseInt(str.slice(0,2),16), parseInt(str.substring(2,4),16), parseInt(str.substring(4,6),16));
			majList();	
		}else if("dsc" in mess){
			console.log('DSC');
			delete plD[mess.dsc];
			majList();
		}else if("kill" in mess){
			console.log('KILL'+mess.kill);
			SoundPlay('KILL');	
			if(mess.kill == wsSN){
				plL.pos = { 'x' : Math.floor(Math.random()*1600), 'y' : 0};
				plL.g = false; b
			}
			sendServData(true);
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


function sendServData(alive){
	if(alive) ws.send(JSON.stringify({'pos' : plL.pos, 'way' : plL.forward, 'g' : plL.g }));
	else ws.send(JSON.stringify({'pos' : plL.pos, 'way' : plL.forward, 'g' : plL.g, 'alive' : true }));
 
}

function majList(){
	var ul = document.getElementById('Plist');

 	ul.innerHTML="";

	for(key in plD){
		var li = document.createElement('li');
		var span = document.createElement('span');
	
		li.textContent=key+" | ";
		span.setAttribute('style', 'background:rgb('+plD[key].r+','+plD[key].v+','+plD[key].b+');display:inline-block;width:25px;height:10px;');		
		li.appendChild(span);
		ul.appendChild(li); 
	}

	
}
