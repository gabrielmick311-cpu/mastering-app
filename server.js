const express = require("express");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// folders
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");
if (!fs.existsSync("output")) fs.mkdirSync("output");

// serve frontend (optional if index.html exists)
app.get("/", (req, res) => {
    res.send("Mastering API is live");
});

// file upload config
const upload = multer({ dest: "uploads/" });

// MASTER ROUTE
app.post("/master", upload.single("track"), (req, res) => {
    if (!req.file) return res.status(400).send("No file uploaded");

    const inputPath = req.file.path;

    const originalName = path.parse(req.file.originalname).name;
    const preset = req.body.preset || "spotify";

    const outputPath = `output/${originalName}_mastered.wav`;

    const presets = {
        trap: [
            "loudnorm=I=-9:TP=-1.0:LRA=7",
            "stereotools=mlev=1:slev=1.25",
            "alimiter=limit=0.98"
        ],

        rnb: [
            "loudnorm=I=-14:TP=-1.5:LRA=11",
            "stereotools=mlev=1:slev=1.10"
        ],

        drill: [
            "loudnorm=I=-10:TP=-1.2:LRA=8",
            "acompressor=threshold=-16dB:ratio=3:attack=10:release=80",
            "stereotools=mlev=1:slev=1.15"
        ],

        spotify: [
            "loudnorm=I=-14:TP=-1.5:LRA=11"
        ]
    };

    ffmpeg(inputPath)
        .audioFilters(presets[preset] || presets.spotify)
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

// start server (Render safe)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
