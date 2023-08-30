const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const Influx = require('influx');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const PORT = 3000;

// Replace with your InfluxDB connection details
const influx = new Influx.InfluxDB({
  host: 'localhost',
  database: 'mongodb+srv://nirbhay123:nirbhay123@cluster0.cv4n3uy.mongodb.net/?retryWrites=true&w=majority',
  schema: [
    {
      measurement: 'data',
      fields: {
        value: Influx.FieldType.FLOAT,
      },
      tags: [],
    },
  ],
});

app.use(bodyParser.json());

// Encryption and Decryption
const algorithm = 'aes-256-cbc';
const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);

function encrypt(text) {
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decrypt(encrypted) {
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Socket.IO
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('encryptedData', (data) => {
    const decryptedData = decrypt(data);
    const value = parseFloat(decryptedData);

    // Store data in InfluxDB
    influx.writePoints([
      {
        measurement: 'data',
        fields: { value },
      },
    ]);

    io.emit('newData', value); // Emit to frontend
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
