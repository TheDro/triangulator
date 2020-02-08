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
                return {
                    color: tri.color || randomColor(),
                    coordinateString: "M "+tri.coord.map((c) => {return c.join(',')}).join(' ')+" Z",
                    hash: 1
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