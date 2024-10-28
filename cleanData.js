const fs = require("fs")
const readline = require("readline")

if (!fs.existsSync("./data-cleaned")) fs.mkdirSync("./data-cleaned")

async function cleanArtistsCSV() {
    const outPath = "./data-cleaned/artists.csv"
    const fileStream = fs.createReadStream("./data/artists.csv")

    if (fs.existsSync(outPath)) fs.unlinkSync(outPath)

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    })

    let artistsDone = new Set()
    let lineIndex = 0
    let duplicatesRemoved = 0
    for await (const line of rl) {
        if (lineIndex==0) {
            fs.appendFileSync(outPath, line+"\n")
        } else if (lineIndex>0 && line!="") {
            let id = line.split(",")[0]
            if (!artistsDone.has(id)) {
                fs.appendFileSync(outPath, line+"\n")
                artistsDone.add(id)
            } else {
                duplicatesRemoved += 1
            }
        }
        lineIndex++
    }

    console.log(`${duplicatesRemoved} duplicates removed`)
}

async function run() {
    console.log("cleaning artists.csv")
    await cleanArtistsCSV()
}

run()