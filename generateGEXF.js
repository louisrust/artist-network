const fs = require("fs")

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

function generateStaticGEXF() {
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
            <edges>
    `
}

function generateDynamicGEXF() {
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

let allEdges = loadAllEdges()
// let staticEdges = getStaticEdges(allEdges)
let dynamicEdges = getDynamicEdges(allEdges)

console.log(dynamicEdges)