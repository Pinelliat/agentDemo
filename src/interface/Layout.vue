<template>

    <div :class="['layout', {'transition-on': layoutTransition}]" :style="layoutStyle">

        <transition enter-active-class="animated slideInDown"
                    leave-active-class="animated slideOutUp"
                    @after-enter="layoutChange"
                    @enter-cancelled="layoutChange"
                    @after-leave="layoutChange"
                    @leave-cancelled="layoutChange"
        >
            <div v-show="header" ref="header" class="head-wrap" :style="headerStyle">
                <slot name="header"/>
            </div>
        </transition>


        <div class="body" :style="bodyStyle">

            <div class="main-wrap" ref="main" :style="mainStyle">
                <slot name="main"/>
                <span v-show="packageName!==''" class="fixed-name">{{packageName}}</span>
            </div>

            <transition name="slide-left"
                        enter-active-class="animated slideInLeft"
                        leave-active-class="animated slideOutLeft"
                        @after-enter="layoutChange"
                        @enter-cancelled="layoutChange"
                        @after-leave="layoutChange"
                        @leave-cancelled="layoutChange"
            >
                <div v-show="toolbox" class="toolbox-wrap" ref="bar" :style="barStyle">
                    <slot name="toolbox"/>
                </div>
            </transition>


        </div>

        <slot name="func-bar"></slot>

    </div>

</template>

<script>

    import bus from '../commons/bus';

    export default {

        name: 'Layout',

        components: {},

        props: {
            header: {
                type: Boolean,
                default: true
            },
            toolbox: {
                type: Boolean,
                default: true
            },
            packageName: {
                type: String,
                default: ''
            }
        },

        data() {
            return {
                headerStyle: {},
                barStyle: {},
                mainStyle: {},
                layoutStyle: {},
                bodyStyle: {},
                layoutTransition: false
            }
        },

        watch: {
            header() {
                this.layoutTransition = true;
                this.setLayoutStyle();
            },
            toolbox() {
                this.layoutTransition = true;
                this.setLayoutStyle();
            },
            grid() {
                this.layoutTransition = true;
                this.setLayoutStyle();
            }
        },

        methods: {

            setLayoutStyle() {
                this.$nextTick(() => {
                    let refs = this.$refs;
                    this.layoutStyle = this.header ? {
                        paddingTop: `${refs.header.getBoundingClientRect().height}px`
                    } : {};
                    this.bodyStyle = this.toolbox ? {
                        paddingLeft: `${refs.bar.getBoundingClientRect().width}px`
                    } : {};
                });
            },

            layoutChange() {
                bus.$emit('layoutChange');
            }
        },

        mounted() {
            bus.$on('packageOpened', () => {
                this.setLayoutStyle();
            });
            this.setLayoutStyle();
            this.$nextTick(() => {
                setTimeout(() => {
                    bus.$emit('layoutChange');
                }, 150);
            });
            document.addEventListener('keyup', this.keyupHandler = (event) => {
                return bus.$emit('onkeyup', event);
            });
            document.addEventListener('keydown', this.keydownHandler = (event) => {
                return bus.$emit('onkeydown', event);
            });
            document.addEventListener('keypress', this.keypressHandler = (event) => {
                return bus.$emit('onkeypress', event);
            });
            document.addEventListener('contextmenu', this.contextmenuHandler = (event) => {
                return bus.$emit('oncontextmenu', event);
            });
        },

        beforeDestroy() {
            if (this.keyupHandler) {
                document.removeEventListener('keyup', this.keyupHandler);
                this.keyupHandler = null;
            }
            if (this.keydownHandler) {
                document.removeEventListener('keydown', this.keydownHandler);
                this.keydownHandler = null;
            }
            if (this.keypressHandler) {
                document.removeEventListener('keypress', this.keypressHandler);
                this.keypressHandler = null;
            }
            if (this.contextmenuHandler) {
                document.removeEventListener('contextmenu', this.contextmenuHandler);
                this.contextmenuHandler = null;
            }
        }

    }

</script>

<style>

    @import "../../node_modules/animate.css";

    html, body {
        width: 100%;
        height: 100%;
        overflow: hidden;
        margin: 0;
        padding: 0;
        border: 0;
        font-family: "Microsoft YaHei", sans-serif;
    }

</style>

<style lang="scss" scoped>

    .layout {
        width: 100%;
        height: 100%;
        position: absolute;
        left: 0;
        top: 0;
        box-sizing: border-box;
        background-color: #e6ebed;

        &.transition-on {
            transition: all .1s;

            .body {
                transition: all .1s;
            }
        }
    }

    .animated {

        &.slideInDown,
        &.slideOutUp,
        &.slideInLeft,
        &.slideOutLeft {

            animation-duration: .15s;

        }

    }

    .body {
        width: 100%;
        height: 100%;
        position: relative;
        box-sizing: border-box;
        overflow: hidden;
    }

    .main-wrap {
        position: relative;
        width: 100%;
        height: 100%;
    }

    .head-wrap {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        z-index: 200;
    }

    .toolbox-wrap {
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        z-index: 200;
    }

    .fixed-name {
        position: absolute;
        top: 0;
        right: 0;
        padding: 5px 10px;
        font-size: 14px;
        color: #000;
        line-height: 1.2em;
        max-width: 120px;
        z-index: 999;
        text-align: center;
        background-color: rgba(#fff, .5);
    }


</style>