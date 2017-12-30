<template>

    <div class="scroll-wrap"
         @mouseenter="hover=true"
         @mouseleave="hover=false"
    >
        <div class="scroll-elem" ref="scroll"
             :style="scrollElemStyle"
             @scroll="calculate"
        >
            <slot></slot>
        </div>
        <Draggable :class="['scroll-bar', {visible:hover||drag, drag}]"
                   :style="barStyle"
                   cursor="default"
                   @dragstart="dragStart"
                   @drag="dragging"
                   @dragend="dragEnd"
        >
        </Draggable>

    </div>


</template>

<script>

    import _ from 'lodash';
    import Draggable from './Draggable.vue';

    export default {

        name: 'ScrollBar',

        props: {},

        components: {Draggable},

        data() {
            return {
                scrollElemStyle: {},
                barStyle: {},
                hover: false,
                drag: false
            }
        },

        methods: {

            dragStart({trigger}) {
                let scroll = this.$refs.scroll;
                this.barHeight = trigger.clientHeight;
                this.scrollTop = +scroll.scrollTop || 0;
                this.viewHeight = scroll.clientHeight;
                this.drag = true;
            },

            dragging({coords}) {
                let scroll = this.$refs.scroll;
                scroll.scrollTop = Math.max(this.scrollTop + coords.delta.y * this.viewHeight / (this.barHeight || 1), 0);
                this.barStyle = Object.assign({}, this.barStyle, {
                    top: `${Math.floor(scroll.scrollTop * this.viewHeight / scroll.scrollHeight)}px`
                });
            },

            dragEnd() {
                this.drag = false;
            },

            calculate() {
                let elem = this.$refs.scroll,
                    viewHeight = elem.clientHeight,
                    scrollHeight = elem.scrollHeight,
                    sHeight = scrollHeight - viewHeight;

                this.scrollElemStyle = {marginRight: sHeight !== 0 ? `-${Math.abs(elem.offsetWidth - elem.clientWidth)}px` : 0};

                this.barStyle = sHeight !== 0 && scrollHeight ? {
                    top: `${Math.floor(elem.scrollTop * viewHeight / scrollHeight)}px`,
                    height: `${Math.floor(Math.pow(viewHeight, 2) / scrollHeight)}px`
                } : {
                    display: 'none'
                };
            }
        },

        mounted() {
            window.addEventListener('resize',
                this.resizeHandler = _.debounce(() => {
                    this.calculate();
                }, 50));
            this.calculate();
        },

        beforeDestroy() {
            if (this.resizeHandler) {
                window.removeEventListener('resize', this.resizeHandler);
                this.resizeHandler = null;
            }
        }

    }


</script>

<style lang="scss" scoped>

    .scroll-wrap {
        height: 100%;
        position: relative;
        overflow: hidden;
    }

    .scroll-elem {
        height: 100%;
        overflow-x: hidden;;
        overflow-y: auto;
    }

    .scroll-bar {

        position: absolute;
        transition: all .08s ease;
        display: none;
        top: 0;
        right: 0;
        background-color: #ddd;
        border-radius: 3px;
        z-index: 10;
        width: 8px;

        &.visible {
            display: block;
        }

        &.drag {
            transition: none;
        }
    }

</style>