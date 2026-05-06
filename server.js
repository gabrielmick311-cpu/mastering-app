const express = require("express");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());

if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");
if (!fs.existsSync("output")) fs.mkdirSync("output");

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

const upload = multer({ dest: "uploads/" });

app.post("/master", upload.single("track"), (req, res) => {
    const inputPath = req.file.path;
    const outputPath = `output/${Date.now()}_mastered.wav`;

    ffmpeg(inputPath)
        .audioFilters([
            "highpass=f=35",
            "lowpass=f=17000",
            "acompressor=threshold=-20dB:ratio=3:attack=10:release=80",
            "equalizer=f=1000:t=q:w=1:g=2",
            "loudnorm=I=-14:TP=-1.5:LRA=11"
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
});

app.listen(process.env.PORT || 3000, () => {
    console.log("Server running");
});
