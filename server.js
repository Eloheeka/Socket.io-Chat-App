const express = require('express');
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // allow all origins for testing
    methods: ["GET", "POST"]
  }
});

app.set('views','./views')
app.set('view engine','ejs')
app.use(express.static('public'))
app.use(express.urlencoded({extended:true}))

const rooms = { name: {}}

app.get('/',(req,res)=>{
res.render('index',{rooms:rooms})
})

app.get('/:room',(req,res)=>{
  if(rooms[req.params.room] == null){
    return res.redirect('/')
  }
res.render('room',{roomNmae:req.params.room})
}) 

app.post('/room', (req,res) => {
  if(rooms[req.body.name] != null) {
    return res.redirect('/')
  }
  rooms[req.body.name] = {users : {}}
  res.redirect(req.body.name)

  io.emit('room-created', req.body.room )
})  

const users = {};

io.on("connection", (socket) => {
 
socket.on('new-user',(room,name) =>{
  socket.join(room)
  rooms[room].users[socket.id] = name
  socket.to(room).broadcast.emit('user-connected',name)
}); 

   socket.on("send-chat-message",  (room,message) => {
    socket.to(room).broadcast.emit('chat-message',{message: message, name:rooms[room].users[socket.id]})
    const name = users[socket.id]
  });

  socket.on("disconnect", () => {
    getUserRooms(socket).forEach(room => {
      socket.broadcast.emit('disconnected-user',rooms[room].users[socket.id])
      delete rooms[room].users[socket.id]
      console.log("User disconnected:", socket.id);
    })
  });

  function getUserRooms(socket){
    return Object.entries(rooms).reduce((names,[name,room]) => {
      if (room.users[socket.id] != null ) names.push(name)
        return names
    },[])
  }

});



server.listen(3000, () => {
  console.log("listening on *:3000");
});
