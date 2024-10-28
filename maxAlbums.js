// script to count number of albums for each artist in years_active.csv
const fs = require("fs")

function getArtistsData() {
    let artists = {}
    let entries = fs.readFileSync("./data/artists.csv").toString().split("\n").splice(1).filter(x => x!="")
    entries.forEach(entry => {
        let [id, name, followers, popularity, genres] = entry.split(",")
        followers = parseInt(followers)
        popularity = parseInt(popularity)
        artists[id] = {name, followers, popularity, genres}
    })
    return artists
}

function run() {
    // get years active data
    let yearsActiveData = fs.readFileSync("./data/years_active.csv").toString().split("\n").splice(1).filter(x => x!="").map(x => {
        let [id, years] = x.split(",")
        return {id, years}
    })

    let artists = {}
    yearsActiveData.forEach(entry => {
        let albumsCount = 0
        entry.years.split(";").forEach(yearEntry => {
            let [year, count] = yearEntry.split(":")
            if (year && count) {
                albumsCount += parseInt(count)
            }
        })
        artists[entry.id] = albumsCount
    })

    // get artists data (for name lookup)
    let artistData = getArtistsData()

    let top = Object.entries(artists).sort((a,b) => { return b[1]-a[1]}).slice(0,50)

    top.forEach(([id, count]) => {
        console.log('https://open.spotify.com/artist/'+id, count, (artistData[id]?.name || ""))
    })
}

run()
