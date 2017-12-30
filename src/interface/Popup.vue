<template>

    <transition enter-active-class="animated fadeIn"
                leave-active-class="animated fadeOut"
                mode="out-in"
    >

        <div ref="popup" v-show="!hidden" :class="['popup', {[arrowPosition]:true, animation}]"
             :style="{zIndex,width,height,maxWidth,maxHeight,minWidth,minHeight,left,top,animationDuration,padding,textAlign}"
        >
            <Draggable
                    cursor="move"
                    @dragstart="dragStart"
                    @drag="dragging"
                    @disabled="!draggable"
            >
                <div v-show="title" class="title">
                    <span class="title-txt">{{title}}</span>
                </div>
            </Draggable>

            <div class="body">
                <slot>
                    <template v-if="component">
                        <component :is="component"></component>
                    </template>
                    <template v-else-if="html">
                        <div v-html="html"></div>
                    </template>
                    <template v-else-if="content">
                        {{content}}
                    </template>
                </slot>
            </div>

            <div class='arrow'
                 :style="{left:arrowLeft,top:arrowTop}"
            >
                <span class='arrow-inr'></span>
            </div>
        </div>

    </transition>


</template>

<script>

    import {mapMutations} from 'vuex';

    import _ from 'lodash';
    import Draggable from './Draggable.vue';

    export default {

        name: 'Popup',

        components: {Draggable},

        props: {
            title: {
                type: [String, Number],
                default: ''
            },
            arrow: {
                type: [String, Boolean],
                default: 'auto'
            },
            modal: {
                type: Boolean,
                default: false
            },
            component: {
                type: null,
                default: null
            },
            content: {
                type: [String, Number],
                default: ''
            },
            html: {
                type: String,
                default: ''
            },
            zIndex: {
                type: Number,
                default: 2000
            },
            animationDuration: {
                type: String,
                default: '0.3s'
            },
            position: {
                type: Object,
                default: null
            },
            duration: {
                type: Number,
                default: 0
            },
            draggable: {
                type: Boolean,
                default: true
            },
            width: {},
            height: {},
            maxWidth: {},
            maxHeight: {},
            minWidth: {},
            minHeight: {},
            padding: {},
            textAlign: {},
            display: {},
            target: {}
        },

        data() {
            return {
                arrowPosition: 'none',
                arrowLeft: '',
                arrowTop: '',
                left: 0,
                top: 0,
                hidden: true,
                animation: false,
                locateTarget: this.$props.target
            }
        },

        watch: {

            modal(show) {
                if (show) {
                    this.showMask();
                } else {
                    this.hideMask();
                }
            },

            display(none) {
                if (!(this.hidden = none === 'none')) {
                    this.show();
                } else {
                    this.hide();
                }
            },

            duration(val) {
                val = +parseInt(val) || 0;
                if (val >= 0) {
                    setTimeout(() => {
                        this.hide();
                        setTimeout(() => {
                            this.$destroy();
                        }, 1000);
                    }, val);
                }
            },

            target(val) {
                this.locateTarget = val;
            }

        },

        methods: {

            ...mapMutations(['showMask', 'hideMask']),

            dragStart() {
                this.startClientRect = this.$refs.popup.getBoundingClientRect();
            },

            dragging({coords: {delta: {x, y}}}) {
                let {left, top, width, height} = this.startClientRect,
                    body = document.body,
                    bWidth = body.clientWidth,
                    bHeight = body.clientHeight;
                this.animation = false;
                this.left = Math.min(Math.max(left + x, 0), bWidth - width) + 'px';
                this.top = Math.min(Math.max(top + y, 0), bHeight - height) + 'px';
            },

            hide() {
                this.hidden = true;
                if (this.modal) {
                    this.hideMask();
                }
            },

            show(target) {
                if (this.modal) {
                    this.showMask();
                }
                this.hidden = false;
                if (target) {
                    this.locateTarget = target;
                }
                this.locate(this.locateTarget);
            },

            locate(target, animation) {
                this.$nextTick(() => {
                    let el = this.$el;
                    if (el && !this.hidden) {
                        let {width, height} = el.getBoundingClientRect(),
                            body = document.body,
                            bWidth = body.clientWidth,
                            bHeight = body.clientHeight;
                        this.animation = !!animation;
                        if (typeof target === 'string') {
                            target = document.querySelector(target);
                        }
                        if (target) {

                            let {left: tLeft, top: tTop, width: tWidth, height: tHeight, margin = 9}
                                    = target.getBoundingClientRect ? target.getBoundingClientRect() : target,
                                pArrow = this.arrow,
                                left, top, arrow;

                            tWidth += 2 * margin;
                            tHeight += 2 * margin;
                            tLeft -= margin;
                            tTop -= margin;

                            left = tLeft + tWidth;
                            arrow = 'left';
                            if (left + width > bWidth) {
                                left = tLeft - width;
                                arrow = 'right';
                            }
                            if (left < 0) {
                                if (width > bWidth) {
                                    left = bWidth - width - margin;
                                } else {
                                    left = Math.max(Math.min(tLeft, bWidth - width - margin), margin);
                                }
                                top = tTop - height;
                                arrow = 'bottom';
                                if (top < 0) {
                                    top = tTop + tHeight;
                                    arrow = 'top';
                                }
                            } else {
                                if (height > bHeight) {
                                    top = bHeight - height - margin;
                                } else {
                                    top = Math.max(Math.min(tTop, bHeight - height - margin), margin);
                                }
                            }

                            this.left = left + 'px';
                            this.top = top + 'px';

                            if (/\btrue|auto|left|right|top|bottom\b/i.test(pArrow)) {
                                arrow = this.arrowPosition = /\btrue|auto\b/.test(pArrow) ? arrow : pArrow;
                                if (arrow === 'left' || arrow === 'right') {
                                    this.arrowTop = Math.min((Math.min(Math.floor(tHeight * 0.5), 30) + Math.abs((top - tTop))), height - 30) + 'px';
                                    this.arrowLeft = '';
                                } else {
                                    this.arrowLeft = Math.min((Math.min(Math.floor(tWidth * 0.5), 30) + Math.abs((left - tLeft))), width - 30) + 'px';
                                    this.arrowTop = '';
                                }
                            } else {
                                this.arrowPosition = 'none';
                                this.arrowLeft = this.arrowTop = '';
                            }
                        } else {
                            let position = this.position;
                            this.left = (position && position.left !== void 0 ? position.left : Math.max((bWidth - width) * 0.5, 10)) + 'px';
                            this.top = (position && position.top !== void 0 ? position.top : Math.max((bHeight - height) * 0.382, 10)) + 'px';
                            this.arrowPosition = 'none';
                            this.arrowLeft = this.arrowTop = '';
                        }
                    }
                });
            }
        },

        mounted() {
            this.hidden = this.display === 'none';
            if (this.modal && !this.hidden) {
                this.showMask();
            }
            if (!this.hidden) {
                this.locate(this.locateTarget);
            }
            if (this.duration) {
                setTimeout(() => {
                    this.hide();
                    setTimeout(() => {
                        this.$destroy();
                    }, 1000);
                }, this.duration);
            }
            window.addEventListener('resize',
                this.resizeHandler = _.debounce(() => {
                    this.locate(this.locateTarget, true);
                }, 50));
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

    .popup {
        border-radius: 3px;
        background-color: #fff;
        box-shadow: 0 0 8px rgba(4, 0, 0, .29);
        position: fixed;
        z-index: 1001;
        left: 0;
        top: 0;
        min-width: 60px;
        min-height: 60px;

        &.animation {
            transition: left .1s, top .1s, width .1s, height .1s;
            transition-timing-function: ease-in-out;
        }

        &.none {
            .arrow {
                display: none;
            }
        }

    }

    .title {
        height: 42px;
        background-color: #f5f5f5;
        padding: 0 16px;
        border-top-left-radius: 3px;
        border-top-right-radius: 3px;
        font-size: 14px;

        &:before {
            content: '';
            display: inline-block;
            vertical-align: middle;
            height: 100%;
            width: 0;
        }
    }

    .title-txt {
        font-size: 14px;
        font-weight: bold;
        color: #616161;
        vertical-align: middle;
        word-break: keep-all;
        white-space: nowrap;
        text-overflow: ellipsis;
    }

    .body {
        &:after {
            content: '';
            display: block;
            width: 0;
            clear: both;
        }
    }

    .arrow, .arrow-inr {
        width: 0;
        height: 0;
        position: absolute;
    }

    .arrow {
        border-color: #828282;
        background-color: #fff;
    }

    .arrow-inr {
        background-color: #fff;
    }

    .right, .left {

        .arrow, .arrow-inr {
            background-color: transparent;
            border-top: 10px transparent;
            border-bottom: 10px transparent;
            border-right-width: 8px;
            border-right-color: #fff;
            border-left-width: 0;
            border-style: solid;
            top: 8px;
            left: -8px;
        }

    }

    .right {
        .arrow, .arrow-inr {
            border-right: 0;
            border-left-width: 8px;
            border-left-color: #fff;
            left: auto;
            right: -8px;
        }
    }

    .left {
        .arrow-inr {
            top: -10px;
            left: 1px;
        }
    }

    .right {
        .arrow-inr {
            top: -10px;
            right: 1px;
        }
    }

    .top, .bottom {

        .arrow, .arrow-inr {
            background-color: transparent;
            border-left: 10px transparent;
            border-right: 10px transparent;
            border-bottom-width: 8px;
            border-bottom-color: #fff;
            border-top-width: 0;
            border-style: solid;
            top: -8px;
            left: 16px;
        }

    }

    .bottom {
        .arrow, .arrow-inr {
            border-bottom: 0;
            border-top-width: 8px;
            border-top-color: #fff;
            top: auto;
            bottom: -8px;
        }
    }

    .top {
        .arrow-inr {
            top: 1px;
            left: -10px;
        }
    }

    .bottom {
        .arrow-inr {
            bottom: 1px;
            left: -10px;
        }
    }

</style>