var keyboard = {
	left : false,
	right : false,
	jump : false,
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
}


function Player(controller, point, r, g, b){

	/*
		point is an array as { x : someNumber, y: someNumber }
		r, g, b must be int
		controller must be an object with left, right and jump as boolean value
	*/

	this.ctrl = controller ;

	this.forward = true;

	this.g = false; //Falling attribut

	this.pos = point;

	this.r = r;
	
	this.g = g;

	this.b = b;

	this.lastUpdate = (new Date).getTime();

	this.spd = 10;

	this.running=false;
	/*
		HERE COME JUMPING VAR
	*/

	this.update = function(ctx){

		if( (new Date).getTime()-this.lastUpdate > 110 ){

		//	console.log("Up");	
			if(this.ctrl.left){
				this.pos.x-=spd;
				this.forward = false;	
				this.runing = !this.runing;
			}
			if(this.ctrl.right){
				this.pos.x+=spd;
				this.forward = true;
				this.runing = !this.runing;
			}
			if(this.ctrl.jump) ; // TODO jumping
	
			this.lastUpdate = (new Date).getTime();
		}
		
		ctx.save();
		ctx.translate(this.pos.x, this.pos.y);
		
		if(this.runing){
			if(!this.forward) ctx.scale(-1, 1); 
			Dario.run(r, g, b, ctx);
		}else{
			if(!this.forward) ctx.scale(-1, 1);
			Dario.stand(r,g,b, ctx);
		}
		ctx.restore();
	};
};

var plL = new Player(keyboard, {'x': 0, 'y':0}, 255, 255, 255); //Local player

var plD = {}; //Distant player
