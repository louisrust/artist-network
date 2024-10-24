const fs = require("fs")
const readline = require("readline")

// returns array of all edges
function loadAllEdges() {
    return fs.readFileSync("./data/links.csv").toString().split("\n").splice(1).filter(x => x!="").map(x => {
        let parts = x.split(",")
        return {
            from: parts[0],
            to: parts[1],
            year: parseInt(parts[2])
        }
    })
}

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

// returns only edges where both artists have been checked
function filterEdgesChecked(allEdges, checkedArtists) {
    let edgesOut = []
    allEdges.forEach(edge => {
        if (checkedArtists.has(edge.from) && checkedArtists.has(edge.to)) {
            edgesOut.push(edge)
        }
    })

    return edgesOut
}

// returns data for artists that have been checked only
function filterArtistsChecked(artistData, checkedArtists) {
    let artistsOut = []
    artistData.forEach(artist => {
        if (checkedArtists.has(artist.id)) artistsOut.push(artist)
    })
    return artistsOut
}

// function to load filtered artists without loading all artists
async function loadFilteredArtists(checkedArtists) {
    const fileStream = fs.createReadStream("./data/artists.csv")

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    })

    let out = []
    let lineIndex = 0
    for await (const line of rl) {
        if ((lineIndex>0) && line!="") {
            let parts = line.split(",")

            if (checkedArtists.has(parts[0])) {
                out.push({
                    id: parts[0],
                    name: parts[1],
                    followers: parseInt(parts[2]),
                    popularity: parseInt(parts[3]),
                    genres: parts[4].split(";")
                })
            }
        }
        
        lineIndex++
    }

    return out
}

// returns edges without time data
function getStaticEdges(allEdges) {
    // static edges, undirected
    let edges = new Set()
    allEdges.forEach(edge => {
        let edgeString = edge.from + ":" + edge.to
        let edgeStringReverse = edge.to + ":" + edge.from
        if (!(edges.has(edgeString) || edges.has(edgeStringReverse))) {
            edges.add(edgeString)
        }
    })
    
    let edgesOut = [...edges]
    return edgesOut.map(x => {
        let parts = x.split(":")
        return {
            from: parts[0],
            to: parts[1]
        }
    })
}

function getDynamicEdges(allEdges) {
    // dynamic edges, undirected
    // edgesOut["from:to"] = [...years]
    let edgesOut = {}
    allEdges.forEach(edge => {
        let edgeString = edge.from + ":" + edge.to
        let edgeStringReverse = edge.to + ":" + edge.from
        if (edgesOut[edgeString]==null && edgesOut[edgeStringReverse]==null) {
            edgesOut[edgeString] = [edge.year]
        } else if (edgesOut[edgeStringReverse]==null) {
            if (!edgesOut[edgeString].includes(edge.year)) edgesOut[edgeString].push(edge.year)
        } else if (edgesOut[edgeString]==null) {
            if (!edgesOut[edgeStringReverse].includes(edge.year)) edgesOut[edgeStringReverse].push(edge.year)
        }
    })

    return edgesOut
}

async function generateStaticGEXF() {
    const gexfOutPath = "./data-out/graph-static.gexf"

    let allEdges = loadAllEdges() // get all edges
    let checkedArtists = loadCheckedArtists() // get artist filter
    let edgesFiltered = filterEdgesChecked(allEdges, checkedArtists) // filtered, directed, dynamic edges
    let staticEdges = getStaticEdges(edgesFiltered) // filtered, undirected, static edges
    
    let nodesFiltered = await loadFilteredArtists(checkedArtists) // filtered nodes

    // static, undirected graph
    let gexf = `<?xml version="1.0" encoding="UTF-8"?>
        <gexf xmlns="http://gexf.net/1.3" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://gexf.net/1.3 http://gexf.net/1.3/gexf.xsd" version="1.3">        <meta lastmodifieddate="${new Date().toISOString().split("T")[0]}">
            <creator>Louis Rust</creator>
            <description>Artists Network Checked Only</description>
        </meta>
        <graph mode="static" defaultedgetype="undirected">
            <attributes class="node">
                <attribute id="followers" title="Followers" type="integer" />
                <attribute id="popularity" title="Popularity" type="integer" />
            </attributes>
            <edges>\n`
    
    // insert edges
    staticEdges.forEach(edge => {
        gexf += `<edge source="${edge.from}" target="${edge.to}"/>\n`
    })

    // end edges, begin nodes
    gexf += `</edges><nodes>`

    // insert nodes
    nodesFiltered.forEach(node => {
        // make name XML friendly
        let name = node.name.replaceAll("&", "&amp;")
        name = name.replaceAll(`'`, "&apos;")
        name = name.replaceAll(`"`, "&quot;")
        name = name.replaceAll("<", "&lt;")
        name = name.replaceAll(">", "&gt;")

        gexf += `<node id="${node.id}" label="${name}">
            <attvalues>
                <attvalue for="followers" value="${node.followers}" />
                <attvalue for="popularity" value="${node.popularity}" />
            </attvalues>
        </node>\n`
    })

    // end file
    gexf += `</nodes></graph></gexf>`

    // export
    if (fs.existsSync(gexfOutPath)) fs.unlinkSync(gexfOutPath)
    fs.writeFileSync(gexfOutPath, gexf)

    console.log("done generating static gexf file")
}

async function generateDynamicGEXF() {
    // dynamic, undirected graph
    let gexf = `<?xml version="1.0" encoding="UTF-8"?>
        <gexf xmlns="http://gexf.net/1.3" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://gexf.net/1.3 http://gexf.net/1.3/gexf.xsd" version="1.3">        <meta lastmodifieddate="${new Date().toISOString().split("T")[0]}">
            <creator>Louis Rust</creator>
            <description>Artists Network Checked Only</description>
        </meta>
        <graph mode="dynamic" defaultedgetype="undirected">
            <attributes class="node">
                <attribute id="followers" title="Followers" type="integer" />
                <attribute id="popularity" title="Popularity" type="integer" />
            </attributes>
            <edges>
    `
}

async function run() {
    let allEdges = loadAllEdges()
    let checkedArtists = loadCheckedArtists()
    let edgesFiltered = filterEdgesChecked(allEdges, checkedArtists)

    let staticEdges = getStaticEdges(edgesFiltered)
    let dynamicEdges = getDynamicEdges(edgesFiltered)

    let artistsFiltered = await loadFilteredArtists(checkedArtists)

    console.log(artistsFiltered.length, staticEdges.length)
}

generateStaticGEXF()