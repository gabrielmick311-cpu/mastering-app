const express = require("express");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
const clients = {};

// folders
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");
if (!fs.existsSync("output")) fs.mkdirSync("output");

// serve frontend (if you keep index.html in same folder)
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// file upload config
const upload = multer({ dest: "uploads/" });
app.get("/progress/:id", (req, res) => {
    const id = req.params.id;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    clients[id] = res;

    req.on("close", () => {
        delete clients[id];
    });
});
// MASTER ROUTE
app.post("/master", upload.single("track"), (req, res) => {
    if (!req.file) {
        return res.status(400).send("No file uploaded");
    }

    const inputPath = req.file.path;
    const outputPath = `output/${Date.now()}_mastered.wav`;

.audioFilters([
    "loudnorm=I=-14:TP=-1.5:LRA=11",
    "stereotools=mlev=1:slev=1.15"
])
        ])
        .audioCodec("pcm_s16le")
        .format("wav")
        .on("end", () => {
            res.download(outputPath, () => {
                fs.unlinkSync(inputPath);
                fs.unlinkSync(outputPath);
            });
        })
        .on("error", (err) => {
            console.log("FFMPEG ERROR:", err);
            res.status(500).send("Mastering failed");
        })
        .save(outputPath);
});

// start server (IMPORTANT for Render)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
