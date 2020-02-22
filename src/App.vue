<template>
    <h3>
        <p>
            Deviation {{Math.round((deviation))}}
            Poly {{polyArray.length}}
        </p>
        <div>
            <label> Iterations </label>
            <input type="number" v-model="iterations" /> 
        </div>
        <div>
            <label> Temperature </label>
            <input type="number" v-model="temperature" /> 
        </div>
        <div>
            <label> Optimization Parameters </label>
            <input type="number" v-model="optimizationParams[0]" /> 
            <input type="number" v-model="optimizationParams[1]" /> 
            <input type="number" v-model="optimizationParams[2]" /> 
            <input type="number" v-model="optimizationParams[3]" /> 
        </div>
        <button @click="callRefresh(iterations)"> Refresh </button>
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
import img from '../img/uma2.png'
import {add, subtract, multiply} from './ArrayOperations'
import {optimize, cost, stdColor, stdDiff, averageColor, sortedTriangles} from './optimize'

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
let refresh = null

export default {
    components: {
        Triangles
    },
    created: function() {

        let imgElement = null;
        d3.image(img).then((response) => {
            imageArray = getImageArray(response)
            let [nx,ny] = [imageArray.length, imageArray[0].length]
            let n = 15
            points = [...uniformPoints(n, n, nx, ny), ...contourPoints(5, nx, ny)]
            let data = sortedTriangles(points)
            this.polyArray = data


            refresh = (iterationsLeft) => {

                points = optimize(600, this.temperature, imageArray, points, 16, this.optimizationParams)
                console.log(`${iterationsLeft} iterations left.`)
                this.polyArray = sortedTriangles(points)
                this.deviation = stdDiff(imageArray, [], this.polyArray, this.optimizationParams)

                if (iterationsLeft > 1) {
                    setTimeout(() => {
                        refresh(iterationsLeft-1)
                    },20) 
                }
            }

        })

    },
    methods: {
        testClick: function(e) {
            console.log('click', e)
            // debugger
            points.unshift([e.offsetX, e.offsetY])
            this.polyArray = sortedTriangles(points)
        },
        callRefresh: function(n) {
            refresh(n)
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
                let std = cost(imageArray, poly, this.optimizationParams)
                let rgb = std/d3.polygonArea(poly)/10
                this.deviation += std
                let color = [rgb+128, rgb+128, rgb+128]
                return {coord: poly, color: `rgb(${color[0]}, ${color[1]}, ${color[2]})`}
            })
        }
    },
    data() {
        return {
            name: 'Andrew',
            polyArray: [],
            imageArray: [],
            deviation: 0,
            iterations: 1,
            temperature: 400,
            optimizationParams: [10, -1.5, -10, 1.5]
        }
    }
}

</script>

<style>

* {
    font-family: Arial, Helvetica, sans-serif
}

</style>