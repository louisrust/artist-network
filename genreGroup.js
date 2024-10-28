const fs = require("fs")

// returns all artists with metadata
function loadArtistData() {
    return fs.readFileSync("./data/artists.csv").toString().split("\n").splice(1).filter(x => x!="").map(x => {
        let parts = x.split(",")
        return {
            id: parts[0],
            name: parts[1],
            followers: parseInt(parts[2]),
            popularity: parseInt(parts[3]),
            genres: parts[4].split(";")
        }
    })
}

// returns set of checked artist ids
function loadCheckedArtists() {
    return new Set(fs.readFileSync("./data/artists_links_completed.txt").toString().split("\n").filter(x => x!=""))
}

// returns data for artists that have been checked only
function filterArtistsChecked(artistData, checkedArtists) {
    let artistsOut = []
    artistData.forEach(artist => {
        if (checkedArtists.has(artist.id)) artistsOut.push(artist)
    })
    return artistsOut
}

function getGenreFrequency(genres) {
    let genresFreq = {}
    genres.forEach(genre => {
        if (genresFreq[genre]==null) genresFreq[genre] = 0
        genresFreq[genre]++
    })
    return genresFreq
}

function includesWholeWord(text, word) {
    return (text==word || text.includes(" "+word) || text.includes(word+" ") || text.includes("-"+word) || text.includes(word+"-"))
}

function groupGenres(genres) {
    // if a genre includes any of these words (keys), they will be mapped to a blanket genre (values)
    let includesMap = {
        "bollywood": "world",
        "filmi":"world",
        "latino":"world", // latin
        "mexicana":"world", // mexican
        "norteno": "world", // mexican
        "corrido": "world", // mexican
        "banda": "world", // mexican
        "salsa": "world",
        "sierreno": "world",
        "afrobeats": "world", // africa
        "afropop": "world", // africa
        "reggaeton": "world",
        "reggae": "world",
        "dancetronica": "world",
        "dancehall": "world",
        "ccm": "world", // christian
        "gospel": "world", // christian
        "chior": "world", // christian
        "worship": "world", // christian
        "k-pop": "world", // korean
        "k-rap": "world", // korean
        "v-pop": "world",
        "environmental": "world",
        "bhangra": "world",
        "cubaton": "world",
        "mollywood": "world",
        "viet": "world",
        
        "classical": "classical",
        "orchestral": "classical",
        "orchestra": "classical",
        "opera": "classical",
        "quartet": "classical",
        "baroque": "classical",

        "jazz": "jazz/lofi",
        "chill": "jazz/lofi",
        "lofi": "jazz/lofi",
        "lo-fi": "jazz/lofi",
        "downtempo": "jazz/lofi",

        "rap": "rap/hip hop",
        "trap": "rap/hip hop",
        "hip hop": "rap/hip hop",
        "boom bap": "rap/hip hop",
        "drill": "rap/hip hop",
        
        "urban": "urban/soul",
        "soul": "urban/soul",
        "r&b": "urban/soul",
        "funk": "urban/soul",
        "singer-songwriter": "urban/soul",

        "rock": "rock",
        "metal": "rock",
        "punk": "rock",
        "mellow gold": "rock", // one of spotify's made up genres

        "country": "country/traditional",
        "folk": "country/traditional",

        "alternative": "alternative",
        "experimental": "alternative",
        "indietronica": "alternative",
        "indie": "alternative",
        "alt": "alternative",
        
        "house": "house/electronic",
        "electronic": "house/electronic",
        "dubstep": "house/electronic",
        "trance": "house/electronic",
        "edm": "house/electronic",
        "techno": "house/electronic",
        "brostep": "house/electronic",
        "sky room": "house/electronic",
        "grime": "house/electronic",
        "dance": "house/electronic",
        "electronica": "house/electronic",
        "hardstyle": "house/electronic",
        "hardcore": "house/electronic",
        "disco": "house/electronic",
        "electro": "house/electronic",
        "electropop": "house/electronic",
        "bass": "house/electronic",
        "dnb": "house/electronic",

        "unknown": "unknown",

        "movie": "theater",
        "broadway": "theater",
        "soundtrack": "theater",
        "show": "theater",
        "hollywood": "theater",

        "historically informed performance": "other",

        "pop": "pop",
        "metropopolis": "pop"
    }

    return genres.map(genre => {
        // let outGenre = genre
        let outGenre = "other"
        Object.entries(includesMap).forEach(entry => {
            if (includesWholeWord(genre, entry[0])) outGenre = entry[1]
        })
        return outGenre
    })
}

function getMainGenre(genres) {
    // map each genre to more generalised genre
    let mappedGenres = groupGenres(genres).filter(x => x!="other")
    if (mappedGenres.length==0) { // definitely an other
        return 'other'
    }
    
    // get frequency of each
    let freq = {}
    mappedGenres.forEach(genre => {
        if (freq[genre]==null) freq[genre] = 0
        freq[genre] += 1
    })

    // if only one genre, return it
    if (Object.entries(freq).length==1) {
        return Object.keys(freq)[0]
    }

    // order genre in order of frequency
    let orderedGenres = Object.entries(freq).sort((a,b) => b[1]-a[1]).map(x => x[0])

    // if winning genre, return it
    if (freq[orderedGenres[0]]>freq[orderedGenres[1]]) {
        return orderedGenres[0]
    }

    return 'multi'
}

function mapArtistGenres(artists) {
    return artists.map(artist => {
        let mainGenre = getMainGenre(artist.genres)
        artist.genres = mainGenre
        return artist
    })
}

function exportArtistGenreFrequency() {
    console.log("loading and filtering artists")
    let artists = loadArtistData()
    let checkedArtists = loadCheckedArtists()
    let filteredArtists = filterArtistsChecked(artists, checkedArtists)

    console.log("mapping genres")
    let artistsGenreMapped = mapArtistGenres(filteredArtists)

    console.log("calculating frequency and exporting")
    let freq = {}
    artistsGenreMapped.forEach(artist => {
        let genre = artist.genres
        if (freq[genre]==null) freq[genre] = 0
        freq[genre] +=1
    })

    const pathOut = "./data-out/genre-frequency.csv"
    if (fs.existsSync(pathOut)) fs.unlinkSync(pathOut)

    const header = "genre,frequency\n"
    fs.appendFileSync(pathOut, header)

    Object.entries(freq).sort((a,b) => b[1]-a[1]).forEach(entry => {
        fs.appendFileSync(pathOut, `${entry[0]},${entry[1]}\n`)
    })

    console.log("done")
}

// export functions
exports.getMainGenre = getMainGenre

if (require.main === module) { // if ran from terminal, export genre frequency
    exportArtistGenreFrequency()
}