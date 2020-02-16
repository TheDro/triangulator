<template>
    <h3>
        Deviation {{Math.round(deviation)}}
        <div @click="testClick">Howdy</div>
        <div @click="testClick">
            <Triangles :tri="triangles"></Triangles>
            <Triangles :tri="triangles2"></Triangles>
        </div>
    </h3>
</template>


<script>
import Triangles from './Triangles'
import * as d3 from 'd3'
import _ from 'lodash'
import img from '../img/mountain.png'
import {add, subtract, multiply} from './ArrayOperations'
import {optimize, stdDiff, stdColor, averageColor, sortedTriangles} from './optimize'

let voronoi = d3.voronoi()

window.d3 = d3
window._ = _


function randomPoints(n, xRange, yRange) {
    let output = []
    for (let i=0; i<n; i++) {
        output.push([Math.random()*xRange, Math.random()*yRange])
    }
    return output
}

function uniformPoints(nx, ny, xRange, yRange) {
    let output = []
    let nRand = d3.randomNormal(0,0.01)
    for (let ix=0.5; ix<nx; ix++) {
        for (let iy=0.5; iy<ny; iy++) {
            output.push([
                (ix+nRand())*xRange/nx, 
                (iy+nRand())*yRange/ny
            ])
        }
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

let imageArray = []
let points = []

export default {
    components: {
        Triangles
    },
    created: function() {

        let imgElement = null;
        d3.image(img).then((response) => {
            imageArray = getImageArray(response)
            let [nx,ny] = [imageArray.length, imageArray[0].length]
            // let nPoints = 500
            let n = 20
            points = [...uniformPoints(n, n, nx, ny), ...contourPoints(5, nx, ny)]
            let data = sortedTriangles(points)
            this.polyArray = data


            let refresh = (iterationsLeft) => {

                points = optimize(400, 50**2, imageArray, points, 16)
                console.log(`${iterationsLeft} iterations left.`)
                this.polyArray = sortedTriangles(points)
                this.deviation = Math.round(Math.sqrt(stdDiff(imageArray, [], this.polyArray)))

                if (iterationsLeft > 1) {
                    setTimeout(() => {
                        refresh(iterationsLeft-1)
                    },50) 
                }
            }

            refresh(200)

        })

    },
    methods: {
        testClick: function(e) {
            console.log('click', e)
            // debugger
            points.push([e.offsetX, e.offsetY])
            this.polyArray = sortedTriangles(points)
        }
    },
    computed: {
        triangles: function() {
            return this.polyArray.map((poly) => {
                let color = averageColor(imageArray, poly)
                return {coord: poly, color: `rgb(${color[0]}, ${color[1]}, ${color[2]})`}
            })
        },
        triangles2: function() {
            this.deviation = 0
            return this.polyArray.map((poly) =>{
                let std = stdColor(imageArray, poly)/d3.polygonArea(poly)/40
                this.deviation += std
                let color = [std,std,std]
                return {coord: poly, color: `rgb(${color[0]}, ${color[1]}, ${color[2]})`}
            })
        }
    },
    data() {
        return {
            name: 'Andrew',
            polyArray: [],
            imageArray: [],
            deviation: 0
        }
    }
}

</script>

<style>

* {
    font-family: Arial, Helvetica, sans-serif
}

</style>