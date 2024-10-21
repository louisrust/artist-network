const fs = require("fs")

const inPath = "./data-out/year_link_frequency.json"
const outPath = "./data-out/year_link_frequency.csv"

const inData = JSON.parse(fs.readFileSync(inPath).toString())

let header = `year,totalArtists,nArtistLinks,avgPerArtist\n`
fs.appendFileSync(outPath, header)

Object.entries(inData).forEach(entry => {
    let year = entry[0]
    let {totalArtists, nArtistLinks, avgPerArtist} = entry[1]
    console.log(year, totalArtists, nArtistLinks, avgPerArtist)

    let line = `${year},${totalArtists},${nArtistLinks},${avgPerArtist}\n`
    fs.appendFileSync(outPath, line)
})