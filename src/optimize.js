import _ from 'lodash'
import * as d3 from 'd3'
import {add, multiply} from './ArrayOperations'


function optimize(nSteps, temperature, imageArray, points, ignorePoints) {
    let nPoints = points.length-ignorePoints
    points = _.cloneDeep(points)
    let polyArray = sortedTriangles(points)
    let rangeX = [0, imageArray.length-1]
    let rangeY = [0, imageArray[0].length-1]
    let nRand = d3.randomNormal(0,5.0)
    for (let i=0; i<nSteps; i++) {
        let randomIndex = Math.floor(Math.random()*nPoints)
        let oldPoint = points[randomIndex]
        if (Math.random() < 0.9) {
            // Move
            points[randomIndex] = [within(rangeX, oldPoint[0]+nRand()), within(rangeY, oldPoint[1]+nRand())]
            let nextPolyArray = sortedTriangles(points)
            let diff = stdDiff(imageArray, polyArray, nextPolyArray)
            let acceptChange = Math.random() <= Math.exp(-diff/temperature)
            if (acceptChange) {
                polyArray = nextPolyArray
            } else {
                points[randomIndex] = oldPoint
            }
        } else if(Math.random()<0.5) {
            // remove
            points.splice(randomIndex,1)
            let nextPolyArray = sortedTriangles(points)
            let diff = stdDiff(imageArray, polyArray, nextPolyArray)
            let acceptChange = Math.random() <= Math.exp(-diff/temperature)
            if (acceptChange) {
                polyArray = nextPolyArray
                nPoints = nPoints-1
            } else {
                points.splice(randomIndex, 0, oldPoint)
            }
        } else {
            // add
            let newPoint = [Math.random()*rangeX[1], Math.random()*rangeY[1]]
            points.splice(randomIndex, 0, newPoint)
            let nextPolyArray = sortedTriangles(points)
            let diff = stdDiff(imageArray, polyArray, nextPolyArray)
            let acceptChange = Math.random() <= Math.exp(-diff/temperature)
            if (acceptChange) {
                polyArray = nextPolyArray
                nPoints = nPoints+1
            } else {
                points.splice(randomIndex,1)
            }
        }
    }
    return points
}


function stdDiff(imageArray, polyArrayLeft, polyArrayRight, debug) {
    
    let leftMatched  = new Array(polyArrayLeft.length).fill(false)
    let rightMatched = new Array(polyArrayRight.length).fill(false)
    let leftCenters  = polyArrayLeft.map((poly) => {
        let centroid = d3.polygonCentroid(poly)
        return centroid[0]*Math.PI+centroid[1]
    })
    let rightCenters = polyArrayRight.map((poly) => {
        let centroid = d3.polygonCentroid(poly)
        return centroid[0]*Math.PI+centroid[1]
    })

    for (let iLeft=0; iLeft<leftCenters.length; iLeft++) {
        let leftCenter = leftCenters[iLeft]
        let iRight = rightCenters.indexOf(leftCenter)
        if (iRight >= 0) {
            leftMatched[iLeft] = true
            rightMatched[iRight] = true
        }
    }

    let leftStd = polyArrayLeft.filter((e, index) => {
        return !leftMatched[index]
    }).reduce((total, poly) => {
        return total + stdColor(imageArray, poly)
    },0)

    let rightStd = polyArrayRight.filter((e, index) => {
        return !rightMatched[index]
    }).reduce((total, poly) => {
        return total + stdColor(imageArray, poly)
    },0)
    if (debug) { debugger }
    return rightStd - leftStd
}


function stdColor(imageArray, poly) {

    let nColors = 0
    let sumR = 0
    let sumG = 0
    let sumB = 0
    let sumR2 = 0
    let sumG2 = 0
    let sumB2 = 0
    
    forEachPixelInPolygon(poly,(ix,iy) => {
        nColors++
        let [R,G,B] = imageArray[ix][iy]
        sumR += R
        sumG += G
        sumB += B
        sumR2 += R*R
        sumG2 += G*G
        sumB2 += B*B
    })

    if (nColors <= 1) {
        return Number.POSITIVE_INFINITY
    }
    // debugger
    return (sumR2/(nColors-1) - (sumR/nColors)**2 + sumG2/(nColors-1) - (sumG/nColors)**2 + sumB2/(nColors-1) - (sumB/nColors)**2)*(nColors-1)
}


function forEachPixelInPolygon(poly, callback) {
    let bounds = xyBounds(poly)
    bounds = bounds.map((bound) => {
        return [Math.ceil(bound[0]), Math.floor(bound[1])]
    })
    let [[minX, maxX],[minY, maxY]] = bounds
    let ix=0
    let iy=0
    for (ix=minX; ix<maxX; ix++) {
        for (iy=minY; iy<maxY; iy++) {
            if (d3.polygonContains(poly, [ix,iy])) {
                callback(ix,iy)
            }
        }
    }
}


function averageColor(imageArray, poly) {
    let averageColor = [0,0,0]
    let nColor = 0
    forEachPixelInPolygon(poly,(ix,iy) => {
        averageColor = add(averageColor, imageArray[ix][iy])
        nColor++
    })
    averageColor = multiply(averageColor, 1/nColor)
    return averageColor
}


function sortedTriangles(points) {
    let triangles = d3.voronoi().triangles(points)
    return triangles
}

function xyBounds(poly) {
    let t = d3.transpose(poly)
    return [d3.extent(t[0]), d3.extent(t[1])]
}

function within(range, value) {
    return Math.max(range[0], Math.min(range[1], value))
}


export {optimize, stdDiff, stdColor, forEachPixelInPolygon, averageColor, sortedTriangles}