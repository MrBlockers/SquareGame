var socket = io('http://localhost:8080');

players = [];
walls = [];

var myPlayerID = 0;

var scrw, scrh;

function localplayer() {
  var pl = undefined;
  _.each(players, function(player) {
    if(player.plID == myPlayerID)
      pl = player;
  });

  return pl;
}

function checkCollision(x,y) {
  if(x < 0 || y < 0 || x >= scrw || y >= scrh)
    return true;

  var coll = false;
  _.each(players, function(player){

    if(x >= player.x && x < player.x+16)
      if(y >= player.y && y < player.y+16)
        coll = true;

  });

  _.each(walls, function(wall){

    if(x >= wall.x && x < wall.x+16)
      if(y >= wall.y && y < wall.y+16)
        coll = true;

  });

  return coll;
}

socket.on('message', function(data) {
  console.log(data.message);
  console.log("My ID = " + data.ID);
  myPlayerID = data.ID;
});

socket.on('playerDestroy', function(playerDestroyData) {
  console.log("Player#" + playerDestroyData.ID + " needs to be destroyed.");
  var i;
  for(i = 0; i < players.length; i++) {
    if(players[i].plID == playerDestroyData.ID)
      break;
  }

  players.splice(i, 1);
});

socket.on('wallUpdate', function(wallData) {
  walls.push(wallData);
});

socket.on('playerUpdate', function(playerData) {
  // playerData is the data of a single Player that has changed on the server.
  // we must sift through our clientside player list, check if they match
  // if so, overwrite
  // elsewise, add.
  var changed = false;
  for(var i = 0; i < players.length; i++) {
    if(players[i].plID == playerData.plID) {
      players[i].x = playerData.x;
      players[i].y = playerData.y;
      changed = true;
      console.log("Player#" + playerData.plID + " updated.");
    }
  }

  if(!changed) {
    players.push(playerData);
    console.log("Player#" + playerData.plID + " added.");
  }
})

$(document).ready( function() {
  // select gameCanvas
  var gameCanvas = $("#gameScreen")[0];
  // get context
  var ctx = gameCanvas.getContext('2d');
  scrw = $('#gameScreen').width();
  scrh = $('#gameScreen').height();

  if(typeof timer != "undefined")
    clearInterval(timer);

  function draw_player(player, sty) {
    ctx.fillStyle = sty;
    ctx.fillRect(player.x,player.y,16,16);
  }

  function draw_wall(wall, sty) {
    ctx.fillStyle = sty;
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
  }

  function game_tick() {
    //gameCanvas.width = gameCanvas.width;
    ctx.fillStyle = "#efefef";
    ctx.fillRect(0,0, scrw,scrh);

    _.each(walls, function(wall) {
      draw_wall(wall, "#a3a3a3");
    });

    _.each(players, function(player) {
      if(player.plID == myPlayerID)
        draw_player(player, "red");
      else
        draw_player(player, "black");
    });


  }

  timer = setInterval(game_tick, 10);

  $('#gameScreen').attr('tabindex', '0');

  $(document).on("keydown", function(event){
    var ox = localplayer().x;
    var oy = localplayer().y;

    if(event.which == 65 || event.which == 37) //a
      if(!checkCollision(localplayer().x-16, localplayer().y))
        localplayer().x-=16;
    if(event.which == 68 || event.which == 39) //d
      if(!checkCollision(localplayer().x+16, localplayer().y))
        localplayer().x+=16;
    if(event.which == 87 || event.which == 38) //w
      if(!checkCollision(localplayer().x, localplayer().y-16))
        localplayer().y-=16;
    if(event.which == 83 || event.which == 40) //s
      if(!checkCollision(localplayer().x, localplayer().y+16))
        localplayer().y+=16;

    if(event.which == 32)
      socket.emit('wallCreated', { x: localplayer().x, y: localplayer().y });

    var dx = localplayer().x-ox;
    var dy = localplayer().y-oy;

    if(dx != 0 || dy != 0) socket.emit('playerMoved', { x: localplayer().x, y: localplayer().y });
  });

});
