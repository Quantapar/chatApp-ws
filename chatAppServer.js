const { WebSocketServer } = require("ws");
const wss = new WebSocketServer({ port: 3045 });

let userId = 1;
const users = [];

wss.on("connection", (ws) => {
  const newuser = {
    id: userId,
    username: `Guest_${userId}`,
    ws: ws,
  };
  users.push(newuser);
  userId++;

  users.forEach((u) => {
    u.ws.send(
      JSON.stringify({
        type: "USER_JOINED",
        payload: { id: newuser.id, username: newuser.username },
      })
    );
  });

  ws.on("message", (message) => {
    handleMessage(ws, message);
  });

  ws.on("close", () => {
    handleClose(ws);
  });
});

function handleMessage(ws, message) {
  const user = users.find((u) => u.ws === ws);
  if (!user) return;

  let data;
  try {
    data = JSON.parse(message);
  } catch {
    return;
  }

  const type = data.type;
  const payload = data.payload;

  if (type === "CHAT") {
    handleChat(user, payload.text);
  } else if (type === "SET_USERNAME") {
    updateUsername(user, payload.username);
  }
}

function handleClose(ws) {
  const index = users.findIndex((u) => u.ws === ws);
  if (index === -1) return;

  const removedUser = users[index];
  users.splice(index, 1);

  users.forEach((u) => {
    u.ws.send(
      JSON.stringify({
        type: "USER_LEFT",
        payload: {
          id: removedUser.id,
          username: removedUser.username,
        },
      })
    );
  });
}

function handleChat(user, text) {
  users.forEach((u) => {
    u.ws.send(
      JSON.stringify({
        type: "CHAT",
        payload: {
          id: user.id,
          username: user.username,
          text: text,
        },
      })
    );
  });
}

function updateUsername(user, username) {
  const oldUsername = user.username;
  user.username = username;

  users.forEach((u) => {
    u.ws.send(
      JSON.stringify({
        type: "USERNAME_UPDATED",
        payload: {
          id: user.id,
          oldUsername: oldUsername,
          newUsername: username,
        },
      })
    );
  });
}
