function SoundPlay(evt){
	var audio;

	if(evt == "JUMP"){
		audio = document.getElementById('A_jump');	
	}else if(evt == "KILL"){
		audio = document.getElementById('A_kill');
	}

	audio.play();
} 

var keyboard = {
	left : false,
	right : false,
	jump : false,
	noctrl : true,
	fct : function (evt, bool){
		switch(evt.key.toUpperCase()){
			case 'Q':
				this.left = bool;
			break;
			case 'D':
				this.right = bool;
			break;
			case'Z':
				this.jump = bool;
			break;
		}
	}	
} 
window.onkeydown = function (evt){ keyboard.fct(evt, true) }
window.onkeyup = function (evt) { keyboard.fct(evt, false) }

function web(){
	this.left = false;
	this.right = false;
	this.jump = false;
	this.noctrl = false;
}


function Player(controller, point, r, v, b){

	/*
		point is an array as { x : someNumber, y: someNumber }
		r, g, b must be int
		controller must be an object with left, right and jump as boolean value
	*/

	this.ctrl = controller ;

	this.forward = true;

	this.g = false; //Anti multi G (Mono jumping)
	
	this.vd = 0 ; //vertical displasment

	this.pos = point;

	this.r = r;
	
	this.v = v;

	this.b = b;

	this.lastUpdate = (new Date).getTime();

	this.spd = 55;

	this.running=false;
	/*
		HERE COME JUMPING VAR
	*/

	this.update = function(ctx){

		if((new Date).getTime()-this.lastUpdate > 80 ){
			if(this.ctrl.noctrl){ //Player You want to have local control
				if(this.ctrl.left){
					this.pos.x-=this.spd;
					this.forward = false;	
				}
				if(this.ctrl.right){
					this.pos.x+=this.spd;
					this.forward = true;
				}
				if(this.ctrl.jump && this.g){
					this.g = false;
					SoundPlay('JUMP');
					this.vd = 150;
				 }
				
				var floor = 700;
	
				if(this.pos.y < floor){ // canvas size less dario size
					if(this.vd > 0){
						 this.vd = this.vd-20;
						this.g = false; //crappy fix
					}

					if(this.vd < 0) this.vd = 0;
				
					if(floor-this.pos.y > 60) this.pos.y+=60;
					else{
						this.pos.y+=floor-this.pos.y;
					}
				}else{	
						this.g = true;
				}
				this.pos.y -= this.vd;
				
				if(this.pos.x < -20) this.pos.x = 1600-20;
				if(this.pos.x > 1620) this.pos.x = -20;
			}
			
			this.lastUpdate = (new Date).getTime();
			this.runing = !this.runing;
		}

		
		ctx.save();
		ctx.translate(this.pos.x, this.pos.y);	
		if(!this.forward){	
			 ctx.translate(90,0);
			 ctx.scale(-1, 1);
		}

		if(!this.g){
			Dario.jump(this.r, this.v, this.b, ctx);
		}else if(this.runing){
			ctx.translate(0,-5);
			Dario.run(this.r, this.v, this.b, ctx);
		}else{
			Dario.stand(this.r, this.v,this.b, ctx);
		}
		ctx.restore();
	};
};

var plL = new Player(keyboard, {'x': 0, 'y':0}, 255, 255, 255); //Local player

var plD = {}; //Distant player
