const https = require("https")
const fs = require("fs")
const path = require("path")

const fontUrl =
  "https://fonts.gstatic.com/s/notosansdevanagari/v25/TuGoUUFzXI5FBtUq5a8bjKYTZjtRU6Sgv3NaV_SNmI0b8QQCQmHn6B2OHjbL_08AlXQly_AzOy8.ttf"
const fontPath = path.join(__dirname, "NotoSansDevanagari-Regular.ttf")

console.log("Downloading Noto Sans Devanagari font...")

https
  .get(fontUrl, (response) => {
    const fileStream = fs.createWriteStream(fontPath)
    response.pipe(fileStream)

    fileStream.on("finish", () => {
      fileStream.close()
      console.log("Font downloaded successfully!")
    })
  })
  .on("error", (err) => {
    console.error("Error downloading font:", err)
  })
