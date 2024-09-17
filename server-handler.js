// server-handler.js
require('dotenv').config();
const { Server } = require('socket.io');
const http = require('http');
const express = require('express');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

// Load environment variables
const serverAddress = process.env.CONJURE_SERVER_ADDRESS || 'localhost';
const serverPort = process.env.CONJURE_SERVER_PORT || 3000;

// Create an Express application
const app = express();

// Serve static files from 'public'
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Define routes
app.get('/', (req, res) => {
    const data = {
        socketAddress: serverAddress,
        socketPort: serverPort
    };
    res.render('cardSpin', data);
});

// Route to render the job monitor page
app.get('/jobmonitor', (req, res) => {
    const data = {
        socketAddress: serverAddress,
        socketPort: serverPort
    };
    res.render('jobmonitor', data);  // Ensure the EJS file name is correct
});


// Route to display a grid of images from /public/images
app.get('/images', (req, res) => {
    const imagesDir = path.join(__dirname, 'public/images');

    fs.readdir(imagesDir, (err, files) => {
        if (err) {
            console.error("Unable to scan directory:", err);
            return res.status(500).send("Unable to scan directory");
        }

        const imageFiles = files.filter(file => file.endsWith('_yugi.png'));

        const imageDetails = imageFiles.map(file => {
            const datePart = file.split('_')[0];
            const timePart = file.split('_')[1].split('-')[0].replace(/\./g, ':');
            const timestamp = `${datePart} ${timePart}`;
            const username = file.split('-').pop().split('_')[0];

            return {
                src: file,
                timestamp: timestamp,
                username: username
            };
        });

        res.render('imageGrid', { images: imageDetails });
    });
});

// Route to fetch all active jobs and emit them via Socket.IO
app.get('/start-job-monitor', (req, res) => {
    exec('list-active-jobs', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error fetching active jobs: ${stderr}`);
            return res.status(500).send('Error fetching active jobs');
        }

        try {
            const jobs = JSON.parse(stdout);  // Expect JSON data
            io.emit('jobQueue', jobs);
            res.send('Job monitoring started');
        } catch (parseError) {
            console.error('Error parsing job list:', parseError);
            res.status(500).send('Error parsing job list');
        }
    });
});

// Create an HTTP server and attach the Express app
const httpServer = http.createServer(app);

// Create a Socket.IO server and attach it to the HTTP server
const io = new Server(httpServer, {
    cors: {
        origin: "*", // Adjust as needed
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log(`${socket.id}: Client connected!`);

    socket.on('disconnect', () => {
        console.log(`${socket.id}: client disconnected!`);
    });
});

// Start the HTTP server (this also starts the Socket.IO server)
httpServer.listen(serverPort, serverAddress, () => {
    console.log(`Server is running on http://${serverAddress}:${serverPort}`);
});

// Export the HTTP and Socket.IO servers
module.exports = { httpServer, io };