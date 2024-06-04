const dotenv = require("dotenv").config();
const express = require("express");
const admin = require("firebase-admin");
const bodyParser = require("body-parser");
const cors = require("cors");
const userRoute = require("./routes/userRoute");
const messageRoute = require("./routes/messageRoute");
const errorHandler = require("./middlewares/errorMiddleware");
const cookieParser = require("cookie-parser");
const app = express();

// Socket
const http = require("http");

const SOCKET_PORT = 4000;
const server = http.createServer(app);
const io = require('socket.io')(server, { cors: { origin: 'http://localhost:3000', credentials: true } });

io.on("connection", (socket) => {
    console.log("New client connected");
    socket.on("messages", data => {
        const { from, to, messages } = data;
        console.log(data);
        socket.broadcast.emit(to, { from: from, messages: messages });
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected");
    });
});

server.listen(SOCKET_PORT, () => console.log(`SOCKET listening on port ${SOCKET_PORT}`));

// Firebase initialization
const serviceAccount = {
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
    universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
};

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://passion-pay.firebaseio.com"
});

const db = admin.firestore();

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

// Routes Middleware
app.use("/api/users", userRoute);
app.use("/api/message", messageRoute);

// Routes
app.get("/", (req, res) => {
    res.send("instagram backend");
});

// Error Middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`);
});

module.exports = db; // Export db for use in routes
