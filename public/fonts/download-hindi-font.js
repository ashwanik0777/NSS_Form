const https = require("https")
const fs = require("fs")
const path = require("path")

const fontUrl =
  "https://fonts.gstatic.com/s/notosansdevanagari/v25/TuGoUUFzXI5FBtUq5a8bjKYTZjtRU6Sgv3NaV_SNmI0b8QQCQmHn6B2OHjbL_08AlXQly_AzOy8.ttf"
const fontPath = path.join(__dirname, "NotoSansDevanagari-Regular.ttf")

console.log("Downloading Hindi font...")

const file = fs.createWriteStream(fontPath)
https
  .get(fontUrl, (response) => {
    response.pipe(file)
    file.on("finish", () => {
      file.close()
      console.log("Hindi font downloaded successfully!")
    })
  })
  .on("error", (err) => {
    fs.unlink(fontPath, () => {}) // Delete the file on error
    console.error("Error downloading font:", err.message)
  })
