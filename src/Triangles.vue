<template>
    <div>
        <p>test</p>
        <svg height="400px" width="600px">
            <g id="top-layer">
                <path v-for="triangle of triangles" :key="triangle.hash"
                    :style="'fill: '+triangle.color+';'"
                    :d="triangle.coordinateString" />
            </g>
        </svg>

    </div>
</template>

<script>
import * as d3 from 'd3'
// structure for tri:
// [{color: String??, coord: Number[][]}]

function randomColor() {
    return `rgb(${255*Math.random() | 0}, ${255*Math.random() | 0}, ${255*Math.random() | 0})`
}
export default {
    props: ['tri'],
    computed: {
        triangles: function() {
            if (this.tri === undefined) {
                return []
            }
            return this.tri.map((tri) => {
                let centroid = d3.polygonCentroid(tri.coord)
                return {
                    color: tri.color || randomColor(),
                    coordinateString: "M "+tri.coord.map((c) => {return c.join(',')}).join(' ')+" Z",
                    hash: centroid[0]+centroid[1]*Math.PI
                }
            })
        }
    }
}
</script>





<style scoped>
    path {
        stroke-width: 0px;
        stroke: #000;
    }
</style>