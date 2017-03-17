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
} window.onkeydown = function () { keyboard.fct(evt, true) ; console.log(keyboard)}; window.onkeyup = function () { keyboard.fct(evt, false) ; console.log(keyboard) };


function Player(controller, point, r, g, b){

	/*
		point is an array as { x : someNumber, y: someNumber }
		r, g, b must be int
		controller must be an object with left, right and jump as boolean value
	*/

	this.ctrl = controller ;

	this.facing = 1;

	this.g = false; //Falling attribut

	this.pos = point;

	this.r = r;
	
	this.g = g;

	this.b = b;

	this.lastUpdate = new Date();

	this.spd = 10;

	/*
		HERE COME JUMPING VAR
	*/

	this.update = function(){
		if(controller.left) this.pos.x-=spd ;
		if(controller.right) this.pos.y+=spd ;
		if(controller.jump) ; // TODO jumping
	};
};

