const express = require("express");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(cors());

if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");
if (!fs.existsSync("output")) fs.mkdirSync("output");

app.get("/", (req, res) => {
    res.send("🎧 Mastering API is live");
});

const upload = multer({ dest: "uploads/" });

app.post("/master", upload.single("track"), (req, res) => {
    const inputPath = req.file.path;
    const outputPath = `output/${Date.now()}_mastered.wav`;

ffmpeg(inputPath)
    .audioFilters([
        "highpass=f=30",
        "lowpass=f=18000",
        "acompressor=threshold=-18dB:ratio=3:attack=5:release=50",
        "loudnorm"
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
        console.log(err);
        res.status(500).send("Mastering failed");
    })
    .save(outputPath);
