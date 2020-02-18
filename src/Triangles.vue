<template>
    <div style="display: inline-block;">
        <svg height="300px" width="200px">
            <g id="top-layer">
                <path v-for="triangle of triangles" :key="triangle.hash"
                    :data-id="triangle.id"
                    :style="'fill: '+triangle.color+'; stroke: '+triangle.color+'; stroke-width: 0.4px'"
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
            return this.tri.map((tri, index) => {
                let centroid = d3.polygonCentroid(tri.coord)
                return {
                    color: tri.color || randomColor(),
                    coordinateString: "M "+tri.coord.map((c) => {return c.join(',')}).join(' ')+" Z",
                    hash: centroid[0]+centroid[1]*Math.PI,
                    id: index
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