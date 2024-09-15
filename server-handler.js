require('dotenv').config();
const { Server } = require('socket.io');
const http = require('http');
const express = require('express');
const path = require('path');
const fs = require('fs');

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

// Route to display a grid of images from /public/images
app.get('/images', (req, res) => {
    const imagesDir = path.join(__dirname, 'public/images');

    // Read the files in the /public/images directory
    fs.readdir(imagesDir, (err, files) => {
        if (err) {
            return res.status(500).send("Unable to scan directory");
        }

        // Filter image files (optional: include more image extensions)
        const imageFiles = files.filter(file => file.endsWith('_yugi.png'));

        // Process filenames to extract timestamp and username
        const imageDetails = imageFiles.map(file => {
            // Remake timestamp:
            const datePart = file.split('_')[0]
            const timePart = file.split('_')[1].split('-')[0].replace(/\./g,':');
            const timestamp = `${datePart} ${timePart}`

            // Extract the username from filename
            const username = file.split('-').pop().split('_')[0];

            return {
                src: file,
                timestamp: timestamp,
                username: username
            };
        });

        // Render the view, passing the list of image details
        res.render('imageGrid', { images: imageDetails });
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
        console.log(`${socket.id}: client disconnected!`)
    });
});

// Start the HTTP server (this also starts the Socket.IO server)
httpServer.listen(serverPort, serverAddress, () => {
    console.log(`Server is running on http://${serverAddress}:${serverPort}`);
});

// Export the HTTP and Socket.IO servers
module.exports = { httpServer, io };