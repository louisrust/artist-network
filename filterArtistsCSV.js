const fs = require("fs")
const readline = require("readline")

function getCheckedArtists() {
    return fs.readFileSync("./data/artists_links_completed.txt").toString().split("\n").filter(x => x!="")
}

async function generateFilteredArtistsCSV() {
    const fileStream = fs.createReadStream("./data/artists.csv")
    const outPath = "./data-out/artists-filtered.csv"

    if (fs.existsSync(outPath)) fs.unlinkSync(outPath)

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    })

    let checkedArtists = new Set(getCheckedArtists())

    let lineIndex = 0
    for await (const line of rl) {
        if (lineIndex==0) {
            fs.appendFileSync(outPath, line+"\n")
        } else if (lineIndex>0 && line!="") {
            let id = line.split(",")[0]
            if (checkedArtists.has(id)) {
                fs.appendFileSync(outPath, line+"\n")
            }
        }

        lineIndex++

        if (lineIndex%1000==0) {
            console.log(lineIndex, "lines processed")
        }
    }
}

generateFilteredArtistsCSV()