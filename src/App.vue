<template>
    <h3>
        Hello {{name}}

        <Triangles :tri="triangles"></Triangles>
    </h3>
</template>


<script>
import Triangles from './Triangles'
import * as d3 from 'd3'
import _ from 'lodash'
import img from '../img/google-earth.jpg'
import {add, subtract, multiply} from './ArrayOperations'
let voronoi = d3.voronoi()

window.d3 = d3
window._ = _

function sortedTriangles(points) {
    let triangles = d3.voronoi().triangles(points)
    return triangles
}


function randomPoints(n, xRange, yRange) {
    let output = []
    for (let i=0; i<n; i++) {
        output.push([Math.random()*xRange, Math.random()*yRange])
    }
    return output
}

function contourPoints(n, xRange, yRange) {
    let output = []
    for (let i=0; i<n; i++) {
        output.push([i/(n-1)*xRange, 0])
        output.push([i/(n-1)*xRange, yRange])
    }
    for (let i=1; i<n-1; i++) {
        output.push([0, i/(n-1)*yRange])
        output.push([xRange, i/(n-1)*yRange])
    }
    return output
}

function getImageArray(imgElement) {
    let canvas = document.createElement('canvas')
    let w = imgElement.width
    let h = imgElement.height
    canvas.width = w
    canvas.height = h
    let ctx = canvas.getContext('2d')
    ctx.drawImage(imgElement, 0, 0)
    let data = ctx.getImageData(0,0,w,h).data
    return d3.transpose(reshape(data, [h,w,4]))
}

function reshape(arr, dim) {
    let result = []
    let index = 0;
    for (let ix=0; ix<dim[0];ix++) {
        result.push([])
        for (let iy=0; iy<dim[1];iy++) {
            result[ix].push([])
            for (let iz=0; iz<dim[2];iz++) {
                if (iz < 3) {
                    result[ix][iy].push(arr[index])
                }
                index++
            }
        }
    }
    return result
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

    return (sumR2/(nColors-1) - (sumR/nColors)**2 + sumG2/(nColors-1) - (sumG/nColors)**2 + sumB2/(nColors-1) - (sumB/nColors)**2)*nColors
}

function forEachPixelInPolygon(poly, callback) {
    let bounds = xyBounds(poly)
    bounds = bounds.map((bound) => {
        return bound.map(Math.ceil)
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

function forPixelsInPolygon(n, poly, callback) {
    for (let iR=0; iR<n; iR++) {

    }
}

function xyBounds(poly) {
    let t = d3.transpose(poly)
    return [d3.extent(t[0]), d3.extent(t[1])]
}


function optimize(nSteps, temperature, imageArray, points) {
    points = _.cloneDeep(points)
    let polyArray = sortedTriangles(points)
    let rangeX = [0, imageArray.length-1]
    let rangeY = [0, imageArray[0].length-1]
    let nRand = d3.randomNormal(0,20.0)
    for (let i=0; i<nSteps; i++) {
        let randomIndex = Math.floor(Math.random()*points.length)
        let oldPoint = points[randomIndex]
        points[randomIndex] = [within(rangeX, oldPoint[0]+nRand()), within(rangeY, oldPoint[1]+nRand())]
        let nextPolyArray = sortedTriangles(points)
        let diff = stdDiff(imageArray, polyArray, nextPolyArray)
        if (diff < 0) {
            // Accept change
            polyArray = nextPolyArray
        } else {
            // Revert change
            points[randomIndex] = oldPoint
        }

        if (i%100 === 0) {
            console.log(i)
        }
    }
    return points
}

function within(range, value) {
    return Math.max(range[0], Math.min(range[1], value))
}


function stdDiff(imageArray, polyArrayLeft, polyArrayRight) {
    
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
    return rightStd - leftStd
}

let imageArray = []

export default {
    components: {
        Triangles
    },
    created: function() {

        let imgElement = null;
        d3.image(img).then((response) => {
            imageArray = getImageArray(response)
            let points = [...randomPoints(200, 380, 360), ...contourPoints(5, 380, 360)]
            let data = sortedTriangles(points)
            this.polyArray = data


            // setTimeout(() => {
                let nextPoints = optimize(600, 0, imageArray, points)
                console.log('optimized')
                this.polyArray = sortedTriangles(nextPoints)
            // }, 200)
            

        })

    },
    computed: {
        triangles: function() {
            return this.polyArray.map((poly) => {
                let std = Math.sqrt(stdColor(imageArray, poly))
                // let std = 128
                let color = [std,std/10,std/100]
                return {coord: poly, color: `rgb(${color[0]}, ${color[1]}, ${color[2]})`}
            })
        }
    },
    data() {
        return {
            name: 'Andrew',
            polyArray: [],
            imageArray: []
        }
    }
}

</script>

<style>

* {
    font-family: Arial, Helvetica, sans-serif
}

</style>