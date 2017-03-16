var ws = new WebSocket("ws://"+window.location.host);

ws.onopen = function(e) {
	ws.send('CLTREADY');
	ws.onmessage = function(e) {
        	console.log(e.data);
	};
};
