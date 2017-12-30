<template>

    <div class="bar">
        <div class="ico-wrap"
             @click.stop="locate"
        >
            <span class="locate" title="居中"></span>
        </div>
        <div class="ico-wrap"
             @click.stop="zoomIn"
        >
            <span class="zoom-in" title="放大"></span>
        </div>
        <div class="ico-wrap"
             @click.stop="zoomOut"
        >
            <span class="zoom-out" title="缩小"></span>
        </div>
    </div>

</template>

<script>

    import bus from '../commons/bus';

    export default {

        name: 'FuncBar',

        props: ['zoomDuration'],

        methods: {
            locate() {
                if (this.zooming) {
                    return;
                }
                this.zooming = true;
                bus.$emit('focusSelection');
                setTimeout(() => {
                    this.zooming = false;
                }, (parseInt(this.$props.zoomDuration, 10) || 0) + 60);
            },

            zoomIn() {
                if (this.zooming) {
                    return;
                }
                this.zooming = true;
                bus.$emit('zoom', false);
                setTimeout(() => {
                    this.zooming = false;
                }, (parseInt(this.$props.zoomDuration, 10) || 0) + 60);
            },

            zoomOut() {
                if (this.zooming) {
                    return;
                }
                this.zooming = true;
                bus.$emit('zoom', true);
                setTimeout(() => {
                    this.zooming = false;
                }, (parseInt(this.$props.zoomDuration, 10) || 0) + 60);
            },

            zoomToPoint(event) {
                if (this.zooming) {
                    return;
                }
                let delta = 0,
                    x = event.clientX,
                    y = event.clientY;
                if (event.wheelDelta) {
                    delta = event.wheelDelta;
                } else if (event.detail) {
                    delta = event.detail;
                }
                this.zooming = true;
                if (delta > 0) {
                    bus.$emit('zoomInToPoint', {x, y}, event);
                } else if (delta < 0) {
                    bus.$emit('zoomOutToPoint', {x, y}, event);
                }
                setTimeout(() => {
                    this.zooming = false;
                }, (parseInt(this.$props.zoomDuration, 10) || 0) + 60);
            }
        },

        mounted() {
            document.addEventListener('mousewheel', this.wheelHandler = (event) => {
                this.zoomToPoint(event);
            });
        },

        beforeDestroy() {
            if (this.wheelHandler) {
                document.removeEventListener('mousewheel', this.wheelHandler);
                this.wheelHandler = null;
            }
        }


    }

</script>

<style scoped>

    .bar {
        position: fixed;
        z-index: 200;
        right: 20px;
        bottom: 20px;
        padding: 10px 10px 5px;
    }

    .ico-wrap {
        width: 34px;
        height: 34px;
        border-radius: 3px;
        box-shadow: 0 0 8px rgba(4, 0, 0, .29);
        display: block;
        margin-bottom: 12px;
        background-color: #fff;
    }

    .locate, .zoom-in, .zoom-out {
        width: 100%;
        height: 100%;
        display: block;
        cursor: pointer;
    }

    .locate {
        background: url("../asserts/img/page/ico-locate.png") no-repeat center;
    }

    .zoom-in {
        background: url("../asserts/img/page/ico-zoom-in.png") no-repeat center;
    }

    .zoom-out {
        background: url("../asserts/img/page/ico-zoom-out.png") no-repeat center;
    }


</style>