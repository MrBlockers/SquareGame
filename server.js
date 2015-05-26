var _ = require('underscore');
var express = require('express');
// Create an app from instantiation if the Express Module
var app = express();
// Make anything in the site/ directory free domain
app.use(express.static('.'));
// Listen at 8080 with Express
var server = app.listen(8080);
// initialize Socket.IO
var io = require('socket.io').listen(server);

var clients = [];
var walls = [];

var playerID = 0;

io.sockets.on('connection', function(socket){

  var startX = Math.round(Math.random()*(320/16))*16;
  var startY = Math.round(Math.random()*(320/16))*16;
  playerID ++ ;

  clients.push(
  {
    socket: socket,
    player: {
      x: startX,
      y: startY,
      plID: playerID
    }
  });

  socket.emit('message', {message: 'welcome.', ID: playerID});

  console.log("Client connected. Player ID#" + playerID);

  _.each(walls, function(wall) {
    socket.emit('wallUpdate', wall);
  });

  socket.on('disconnect', function() {
    // when this client disconnects

    // find the client with this socket
    var o = 0;
    for(o = 0; o < clients.length; o++) {
      if(clients[o].socket == socket)
        break;
    }

    console.log("Client disconnected. Player ID#" + clients[o].player.plID);;
    io.sockets.emit('playerDestroy', { ID: clients[o].player.plID } );

    clients.splice(o, 1);
  });

  socket.on('playerMoved', function(playerMoveData) {
    // find the client with this socket
    var o = 0;
    for(o = 0; o < clients.length; o++) {
      if(clients[o].socket == socket)
        break;
    }

    clients[o].player.x = playerMoveData.x;
    clients[o].player.y = playerMoveData.y;

    _.each(clients, function(cl) {
      if(cl.socket != socket)
        cl.socket.emit('playerUpdate', clients[o].player);
    });


  });

  socket.on('wallCreated', function(createPoint) {
    var wall = {x: createPoint.x, y: createPoint.y, w: 16, h:16};
    walls.push(wall);
    io.sockets.emit('wallUpdate', wall);
  });

  // update all clients with ALL player information
  _.each(clients, function(cl) {
    io.sockets.emit('playerUpdate', cl.player);
  });
});
