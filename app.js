var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(process.env.PORT || 8000, process.env.IP || "0.0.0.0", function(){  //保证监听正确的ip和端口
  var addr = server.address();
  console.log("Server listening at", addr.address + ":" + addr.port);
});

app.use(express.static('assets'));

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});


var players =[];


var player = function(){

	this.paddle;
	this.username;

};

var connectNum=0
var scoreA = 0;
var scoreB = 0;
var timer = null;


io.on('connection', function(socket){

	connectNum++;

	if(players.length>2){
		console.log('full');
		socket.join('full');
    	io.sockets.in('full').emit('full');
    	//socket.disconnect(true);
	}

	socket.on('add user',function(msg){

		var playerA,playerB;

        socket.username = msg;
        console.log("new user:"+msg+" logged.");

        if(players.length===0){

	     	var playerA = new player();
	     	socket.paddle='A';
	    	playerA.paddle = socket.paddle;
	    	playerA.username = socket.username;
	    	players.push(playerA);
	    	console.log('a');
	    	socket.join('playerA');
	     
		    io.sockets.in('playerA').emit('player',playerA);
		     
		    io.emit('add user',{
	            username: socket.username,
	            id :  playerA.paddle
	        });

	        socket.leave('playerA');

    	}else if(players.length===1){

    		var playerB = new player();
    		socket.paddle='B'
	    	playerB.paddle = socket.paddle;
	    	playerB.username = socket.username;
	    	players.push(playerB);
	    	console.log('b');
		    socket.join('playerB');
		   
		    io.sockets.in('playerB').emit('player',playerB);

	        io.emit('add user',{
	            username: socket.username,
	            id :  playerB.paddle
	        });

	        socket.leave('playerB');

    	}else{

    		console.log(players.length);
    		socket.join('full');
    		io.sockets.in('full').emit('full');
    		socket.disconnect(true);
    	};

    	io.emit('showPlayers',players);
    
    });


	socket.on('disconnect',function(){
	  connectNum -= 1;
		console.log('disconnect');
	  if(connectNum<2){
	  	scoreA = 0;
	  	scoreB = 0;
		io.emit('reload');
		clearInterval(timer);
		io.emit('whoLeave',socket.username);
		players=players.filter(player => player.username!==socket.username);
		players=players.map(function(rest){

			var newPlayer = new player();
			newPlayer.paddle = 'A'
			newPlayer.username = rest.username
			return newPlayer;

		});

		//io.emit('player',players[0]);
		io.emit('showPlayers',players);
		//io.emit('showPlayers',players);
		//socket.disconnect(true);
	   }
	});


    
	 socket.on('start',function(startNum){
	 	
	  if(timer!==null){
	  	clearInterval(timer);
	  }

	  timer = setInterval(fresh,10);

	});


	 socket.on('stop',function(){

	 	clearInterval(timer);

	 });


	 socket.on('empty',function(){

	 	players.length = 0;

	 });


	 socket.on('draw',function(pos){

		socket.broadcast.emit('drawing',pos)
	
	 });


	 socket.on('move',function(dir){

		io.emit('movePaddle',dir)

	 });


	 socket.on('score',function(whoScore){

	 	if(whoScore==='A'){

	 		if(scoreA<10){

	 		scoreA+=1;
	 		io.emit('score',whoScore);

	 		}else{
	 		clearInterval(timer);
	 		io.emit('whoWin','A');

	 		}

	 	}else if(whoScore==='B'){
	 	   if(scoreB<10){
	 		scoreB+=1;
	 		io.emit('score',whoScore);
	 	}else{
	 		clearInterval(timer);
	 		io.emit('whoWin','B');
	 	}

	 	}

	 });


	socket.on('reload',function(){

		scoreA = 0;
		scoreB = 0;
		clearInterval(timer);
		io.emit('reload');

	});

	
	socket.on('over',function(){

		io.emit('over');

	});

	
	});




	function fresh(){

	if(connectNum===2){
	io.emit('fresh');
	}

	}

	function empty(){

	players.length = 0;

	};



//setInterval(fresh,5);




