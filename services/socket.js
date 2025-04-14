const WebSocket = require('ws');
const Home = require('../models/home');



module.exports = function(server) {
  const io = require('socket.io')(server);

  io.on('connection', (socket) => {
    console.log('Client connected');
    
    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  // Fonction pour émettre des alertes
  function emitNewAlert(homeId, deviceName, alert) {
    io.emit('newAlert', {
      type: 'newAlert',
      homeId,
      deviceName,
      alert
    });
  }

  return {
    io,
    emitNewAlert
  };
};





function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    ws.on('message', async (message) => {
      const { deviceId } = JSON.parse(message);
      const interval = setInterval(async () => {
        const device = await Home.findById(deviceId);
        ws.send(JSON.stringify({
          batteryLevel: device.batteryLevel,
          deviceName: device.name,
          lastUpdate: device.lastUpdate
        }));
      }, 5000); // Mise à jour toutes les 5 secondes

      ws.on('close', () => clearInterval(interval));
    });
  });

  return wss;
}

module.exports = setupWebSocket;