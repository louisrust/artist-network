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
    let sum = 0
    for (let i=0; i<arr.length; i++) {
        sum += arr[i]
    }
    return sum;
}
function arrayAverage(arr) {
    return arraySum(arr)/arr.length
}
function arrayMedian(arr) {
    arr.sort()
    let n = arr.length
    if (n%2==0) {
        return (arr[n/2-1]+arr[n/2])/2
    } else {
        return arr[Math.floor(n/2)]
    }
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

// map of years to artists active in that year
function getArtistYearsMap(yearsActiveRange) {
    let out = {}

    let entries = Object.entries(yearsActiveRange)
    entries.forEach(artist => {
        let id = artist[0]
        let range = artist[1]

        if (range.min<1000) return // ignore artists with invalid years, for example, Afroman, who somehow released an EP in the year 20. truly ahead of his time.
        
        for (let year=range.min; year<=range.max; year++) {
            if (out[year]==undefined) out[year] = []
            out[year].push(id)
        }
    })

    return out
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

// get number of links for each artist
function getArtistLinksCount(artistLinks) {
    let out = {}
    artistLinks.forEach(link => {
        if (out[link.from]==undefined) out[link.from] = 0
        out[link.from]++
    })
    return out
}

// number of artists with links for each year
function getYearLinkFrequency(yearsActiveMap, artistLinksCount) {
    let out = {} // out[year] = {totalArtists, nArtistLinks, avgPerArtist}

    Object.entries(yearsActiveMap).forEach(entry => {
        let startTime = Date.now()

        let year = entry[0]
        let artistIds = entry[1]
        let totalArtists = artistIds.length

        // for each artist, count outgoing links
        let relatedLinks = {}
        artistIds.forEach(id => {
            let nLinks = artistLinksCount[id]
            if (nLinks>0) relatedLinks[id] = nLinks
        })
        let nArtistLinks = Object.keys(relatedLinks).length

        // calculate average number of links per artist
        let linksPerArtist = Object.entries(relatedLinks).map(x => x[1])
        let avgPerArtist = round(arrayAverage(linksPerArtist))
        let medianPerArtist = round(arrayMedian(linksPerArtist))

        out[year] = {totalArtists, nArtistLinks, avgPerArtist, medianPerArtist}
        
        let endTime = Date.now()
        let time = endTime-startTime

        console.log(`year ${year}: ${totalArtists} artists, ${nArtistLinks} with links, avg ${avgPerArtist} links/artist, median ${medianPerArtist} links/artist, took ${time}ms`)
    })

    return out
}

function exportYearLinkFrequencyCSV(yearLinkFrequency) {
    const outPath = "./data-out/year_link_frequency.csv"

    if (fs.existsSync(outPath)) fs.unlinkSync(outPath)
    let header = `year,totalArtists,nArtistLinks,avgPerArtist,medianPerArtist\n`
    fs.appendFileSync(outPath, header)

    Object.entries(yearLinkFrequency).forEach(entry => {
        let year = entry[0]
        let {totalArtists, nArtistLinks, avgPerArtist, medianPerArtist} = entry[1]
        console.log(year, totalArtists, nArtistLinks, avgPerArtist, medianPerArtist)
    
        let line = `${year},${totalArtists},${nArtistLinks},${avgPerArtist},${medianPerArtist}\n`
        fs.appendFileSync(outPath, line)
    })
}

function exportJSON(data, fileName) {
    let path = `./data-out/${fileName}.json`
    if (fs.existsSync(path)) fs.unlinkSync(path)
    fs.writeFileSync(path, JSON.stringify(data, null, 2))
}

let yearsActiveRange = getYearsActiveRange()
let artistLinks = loadArtistLinks()
let yearsActiveMap = getArtistYearsMap(yearsActiveRange)

let artistLinksStatic = getStaticLinks(artistLinks)
let artistLinksCount = getArtistLinksCount(artistLinksStatic)

let yearLinkFrequency = getYearLinkFrequency(yearsActiveMap, artistLinksCount)

exportJSON(yearLinkFrequency, "year_link_frequency")
exportYearLinkFrequencyCSV(yearLinkFrequency)