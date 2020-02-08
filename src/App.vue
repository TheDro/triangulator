<template>
    <h3>
        Hello {{name}}

        <Triangles :tri="triangles"></Triangles>
    </h3>
</template>


<script>
import Triangles from './Triangles'
import * as d3 from 'd3'
import img from '../img/google-earth.jpg'


let voronoi = d3.voronoi()

window.d3 = d3


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
    console.log('data',data)
    return reshape(data, [h,w,4])
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

export default {
    components: {
        Triangles
    },
    created: function() {

        let imgElement = null;
        d3.image(img).then((response) => {
            let imageArray = getImageArray(response)
            console.log('image',imageArray)
            let points = [...randomPoints(4000, 360, 360), ...contourPoints(10, 360, 360)]
            let data = voronoi.triangles(points)
            this.triangles = data.map((poly) => {
                let centroid = d3.polygonCentroid(poly)
                let color = imageArray[Math.floor(centroid[0])][Math.floor(centroid[1])]
                return {coord: poly, color: `rgb(${color[0]}, ${color[1]}, ${color[2]})`}
            })

        })

        setTimeout(()=> {

            
        }, 100)
    },
    data() {
        return {
            name: 'Andrew',
            triangles: [{
                coord: [[50,70],[42,128],[137,112]]
            }]
        }
    }
}

</script>

<style>

* {
    font-family: Arial, Helvetica, sans-serif
}

</style>