const fs = require("fs")

function profile(fn, n=1) {
    let start = Date.now()

    for (let i=0; i<n; i++) {
        fn()
    }

    let end = Date.now()
    let time = end-start
    let avg = time/n

    console.log(`function profile: ran ${n} times in ${time}ms, avg ${avg}ms`)
}

function arraySum(arr) {
    return arr.reduce((a,b) => a+b, 0)
}
function arrayAverage(arr) {
    return arraySum(arr)/arr.length
}
function round(n, d=2) {
    return Math.round(n*Math.pow(10, d))/Math.pow(10, d)
}

// returns map of each artist. for each artist, contains object of [years]:frequency
function loadYearsActive() {
    let lines = fs.readFileSync("./data/years_active.csv").toString().split("\n").slice(1).filter(x => x!="")

    let out = {}
    lines.forEach(line => {
        let parts = line.split(",")
        let artistID = parts[0]
        let years = parts[1]

        if (years==undefined || years=='') return
        
        let yearsMap = {}
        years.split(";").forEach(point => {
            let pointParts = point.split(":")
            let year = pointParts[0]
            if (year=="" || year==0) return
            let frequency = parseInt(pointParts[1])
            yearsMap[year] = frequency
        })

        out[artistID] = yearsMap
    })

    return out
}

// returns object - range of years active for each artist
function getYearsActiveRange() {
    let yearsActive = loadYearsActive()

    let out = {}
    Object.entries(yearsActive).forEach(entry => {
        let artist = entry[0]
        let yearsFrequency = entry[1]
        
        let years = Object.keys(yearsFrequency).map(x => parseInt(x))
        years.sort()
        out[artist] = {
            min: years[0],
            max: years[years.length-1]
        }
    })

    return out
}

// get min and max year from yearsActiveRange
function getYearsRangeAll(yearsActiveRange) {
    let entries = Object.entries(yearsActiveRange)
    let yearsSet = new Set(entries.map(x => [x[1].min, x[1].max]).flat())
    let yearsUnique = [...yearsSet]
    yearsUnique.sort()

    return {
        min: yearsUnique[0],
        max: yearsUnique[yearsUnique.length-1]
    }
}

function loadArtistLinks() {
    return fs.readFileSync("./data/links.csv").toString().split("\n").splice(1).filter(x => x!="").map(x => {
        let parts = x.split(",")
        return {
            from: parts[0],
            to: parts[1],
            year: parseInt(parts[2])
        }
    })
}

// get links, ignoring years
function getStaticLinks(artistLinks) {
    // create set
    let links = new Set()
    artistLinks.forEach(link => {
        let linkString = link.from + ":" + link.to
        links.add(linkString)
    })

    // back to array of objects {from, to}
    return [...links].map(x => {
        let [from, to] = x.split(":")
        return {from, to}
    })
}

// number of artists with links for each year
function getYearLinkFrequency(yearsActiveRange, artistLinksStatic) {
    let out = {} // out[year] = {totalArtists, nArtistLinks, avgPerArtist}

    let rangeAll = getYearsRangeAll(yearsActiveRange)
    for (let i=rangeAll.min; i<=rangeAll.max; i++) {
        // get ids of artists within range
        let artistIds = Object.entries(yearsActiveRange).filter(x => x[1].min<=i && x[1].max>=i).map(x => x[0])
        let totalArtists = artistIds.length
        
        // for each artist, count outgoing links
        let relatedLinks = {}
        artistIds.forEach(id => {
            let nLinks = artistLinksStatic.filter(x => x.from==id).length
            if (nLinks>0) relatedLinks[id] = nLinks
        })
        let nArtistLinks = Object.keys(relatedLinks).length

        // calculate average number of links per artist
        let linksPerArtist = Object.entries(relatedLinks).map(x => x[1])
        let avgPerArtist = round(arrayAverage(linksPerArtist))

        out[i] = {totalArtists, nArtistLinks, avgPerArtist}
        console.log(i, out[i])
    }

    return out
}

function exportYearLinkFrequencyCSV(yearLinkFrequency) {
    const outPath = "./data-out/year_link_frequency.csv"

    if (fs.existsSync(outPath)) fs.unlinkSync(outPath)
    let header = `year,totalArtists,nArtistLinks,avgPerArtist\n`
    fs.appendFileSync(outPath, header)

    Object.entries(yearLinkFrequency).forEach(entry => {
        let year = entry[0]
        let {totalArtists, nArtistLinks, avgPerArtist} = entry[1]
        console.log(year, totalArtists, nArtistLinks, avgPerArtist)
    
        let line = `${year},${totalArtists},${nArtistLinks},${avgPerArtist}\n`
        fs.appendFileSync(outPath, line)
    })
}

let yearsActiveRange = getYearsActiveRange()
let artistLinks = loadArtistLinks()

let artistLinksStatic = getStaticLinks(artistLinks)

let yearLinkFrequency = getYearLinkFrequency(yearsActiveRange, artistLinksStatic)
fs.writeFileSync("./data-out/year_link_frequency.json", JSON.stringify(yearLinkFrequency, null, 2))
exportYearLinkFrequencyCSV(yearLinkFrequency)