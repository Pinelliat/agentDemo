<template>

    <ScrollBar class="wrap">

        <div class="items">
            <div v-for="item in toolItems" :class="['item', {active: item._active, hover: item._hover}]">
                <Draggable cursor="pointer"
                           @drag="dragging($event, item)"
                           @dragstart="dragStart($event, item)"
                           @dragend="dragEnd($event, item)"
                           @dragcancel="dragCancel($event, item)"
                >
                    <img draggable="false" class="image"
                         :src="item.src"
                         @mousedown.self="onMouseDown(item)"
                         @mouseenter.self="onMouseEnter(item)"
                         @mouseleave.self="onMouseLeave(item)"
                         :title="item.title"/>
                    <div class="title">{{item.title}}</div>
                </Draggable>
            </div>
        </div>

    </ScrollBar>

</template>

<script>

    import ScrollBar from './ScrollBar.vue';
    import Draggable from './Draggable.vue';
    import bus from '../commons/bus';

    import _ from 'lodash';

    const toolItems = [{
        name: 'wall',
        title: '墙',
        width: 1,
        height: 4,
        transform: [{
            name: 'height',
            text: '长',
            value: 4,
            max: 1000
        }, {
            name: 'width',
            text: '宽',
            value: 1,
            max: 3
        }, {
            name: 'angle',
            text: '角度',
            value: 0,
            origin: 'right bottom'
        }, {
            name: 'radian',
            text: '弧度',
            value: 0
        }]
    }, {
        name: 'post',
        title: '柱',
        width: 3,
        height: 3,
        transform: [{
            name: 'width height',
            text: '边长',
            value: 3
        }]
    }, {
        name: 'door',
        title: '门',
        width: 4,
        height: 4,
        transform: [{
            name: 'width',
            text: '长',
            value: 4
        }, {
            name: 'height',
            text: '宽',
            value: 4
        }, {
            name: 'angle',
            text: '角度',
            value: 0
        }]
    }, {
        name: 'window',
        title: '窗',
        width: 1,
        height: 3,
        transform: [{
            name: 'height',
            text: '长',
            value: 3
        }, {
            name: 'width',
            text: '宽',
            value: 1,
            max: 3
        }, {
            name: 'angle',
            text: '角度',
            value: 0,
            origin: 'right bottom'
        }]
    }, {
        name: 'desk',
        title: '工位',
        width: 2,
        height: 2,
        transform: [{
            name: 'width',
            text: '长',
            value: 2
        }, {
            name: 'height',
            text: '宽',
            value: 2
        }, {
            name: 'angle',
            text: '角度',
            value: 0
        }, {
            name: 'color',
            text: '颜色',
            value: '#a1887f',
            type: 'select',
            items: [{
                text: '#a1887f',
                value: '#a1887f',
                icon: '<i style="background:#a1887f" class="app-color"/>'
            }, {
                text: '#7b8af7',
                value: '#7b8af7',
                icon: '<i style="background:#7b8af7" class="app-color"/>'
            }, {
                text: '#69cdf9',
                value: '#69cdf9',
                icon: '<i style="background:#69cdf9" class="app-color"/>'
            }, {
                text: '#fdac34',
                value: '#fdac34',
                icon: '<i style="background:#fdac34" class="app-color"/>'
            }, {
                text: '#f7d53d',
                value: '#f7d53d',
                icon: '<i style="background:#f7d53d" class="app-color"/>'
            }, {
                text: '#2bb5d5',
                value: '#2bb5d5',
                icon: '<i style="background:#2bb5d5" class="app-color"/>'
            }, {
                text: '#f49cc7',
                value: '#f49cc7',
                icon: '<i style="background:#f49cc7" class="app-color"/>'
            }, {
                text: '#fe7964',
                value: '#fe7964',
                icon: '<i style="background:#fe7964" class="app-color"/>'
            }, {
                text: '#68decb',
                value: '#68decb',
                icon: '<i style="background:#68decb" class="app-color"/>'
            }, {
                text: '#d896f6',
                value: '#d896f6',
                icon: '<i style="background:#d896f6" class="app-color"/>'
            }, {
                text: '#6095fe',
                value: '#6095fe',
                icon: '<i style="background:#6095fe" class="app-color"/>'
            }]
        }],
        attributes: [{
            name: 'code',
            text: '编号',
            value: '',
            span: 2
        }, {
            name: 'remark',
            text: '备注',
            type: 'textarea',
            value: ''
        }]
    }, {
        name: 'plant',
        title: '绿化',
        width: 2,
        height: 2,
        transform: [{
            name: 'height',
            text: '长',
            value: 2
        }, {
            name: 'width',
            text: '宽',
            value: 2
        }]
    }];

    bus.defaultItems = _.cloneDeep(toolItems);

    export default {

        name: 'Toolbox',

        props: {
            items: {
                type: Array,
                default: () => toolItems
            },
            imgPath: {
                type: String,
                default: 'img/struct'
            }
        },

        components: {ScrollBar, Draggable},

        data() {
            return {
                scrollElemStyle: {}
            }
        },

        computed: {
            toolItems () {
                let {imgPath: path = '', items} = this;
                if (items && items.length) {
                    items.forEach(item => {
                        if (!item.src) {
                            item.src = `${path}${/\/$/.test(path) ? '' : '/'}${item.name}.svg`
                        }
                        item.width = Math.max(Math.min(parseInt(item.width, 10) || 2, 8), 1);
                        item.height = Math.max(Math.min(parseInt(item.height, 10) || 2, 8), 1);
                        this.$set(item, '_active', false);
                        this.$set(item, '_hover', false);
                    });
                    return items;
                } else {
                    return [];
                }
            }
        },

        methods: {

            onMouseDown(item) {
                this.items.forEach(imgItem => {
                    imgItem._active = item === imgItem;
                });
            },

            onMouseEnter(item) {
                item._hover = true;
            },

            onMouseLeave(item) {
                item._hover = false;
            },

            getImgSrc(src, suffix) {
                return src.replace('.svg', `@${suffix}.svg`);
            },

            getOffset({current}) {
                let clientReact = this.clientReact;
                if (!clientReact) {
                    return {
                        left: 0,
                        top: 0
                    }
                }
                let {x, y} = current,
                    //  elem = this.shadowImage,
                    eWidth = 68,// elem.width,
                    eHeight = 68,// elem.height,
                    bWidth = clientReact.width,
                    bHeight = clientReact.height;
                x = Math.min(Math.max(x, 0), bWidth);
                y = Math.min(Math.max(y, 0), bHeight);
                return {
                    left: (x + eWidth / 2 > bWidth) ? bWidth - eWidth : (x - eWidth / 2 > 0 ? x - eWidth / 2 : 0),
                    top: (y + eHeight / 2 > bHeight) ? bHeight - eHeight : (y - eHeight / 2 > 0 ? y - eHeight / 2 : 0)
                }
            },

            dragStart(event, item) {
                if (this.shadowImage) {
                    document.body.removeChild(this.shadowImage);
                }
                let body = document.body,
                    coords = event.coords;
                this.clientReact = {
                    width: body.clientWidth,
                    height: body.clientHeight
                };
                let img = this.shadowImage = document.createElement('img'),
                    offset = this.getOffset(coords);
                img.className = 'draggable-struct-shadow';
                img.draggable = false;
                img.style.left = offset.left + 'px';
                img.style.top = offset.top + 'px';
                img.src = this.getImgSrc(item.src, 'main');
                document.body.appendChild(img);
                bus.$emit('toolboxDragStart', {
                    item,
                    event,
                    offset
                });
            },

            dragEnd(event, item) {
                let img = this.shadowImage;
                if (img) {
                    document.body.removeChild(img);
                    this.shadowImage = null;
                    item = _.cloneDeep(item);
                    bus.$emit('toolboxDragEnd', {
                        event,
                        item: {...item, src: this.getImgSrc(item.src, 'main')},
                        offset: this.getOffset(event.coords)
                    });
                }
            },

            dragCancel(event, item) {
                item = _.cloneDeep(item);
                bus.$emit('toolboxDragCancel', {
                    event,
                    item: {...item, src: this.getImgSrc(item.src, 'main')},
                    offset: this.getOffset(event.coords)
                });
            },

            dragging(event, item) {
                if (this.shadowImage) {
                    let coords = event.coords,
                        offset = this.getOffset(coords),
                        style = this.shadowImage.style;
                    style.left = offset.left + 'px';
                    style.top = offset.top + 'px';
                    bus.$emit('toolboxDragging', {
                        item,
                        event,
                        offset
                    });
                }
            }

        }

    }

</script>

<style>

    .draggable-struct-shadow {
        width: 64px;
        height: 64px;
        border: solid 2px #64b5f6;
        cursor: pointer;
        position: absolute;
        z-index: 400;
        box-shadow: 0 0 8px rgba(4, 0, 0, .4);
        opacity: 0.6;
    }

</style>

<style lang="scss" scoped>

    .wrap {
        background-color: #fff;
        box-shadow: 0 0 8px rgba(4, 0, 0, .29);
        width: 110px;
    }

    .items {
        padding: 23px 0;
        font-size: 14px;
        color: #616161;

        &:after {
            content: '';
            clear: both;
            display: block;
        }
    }

    .item {
        float: left;
        width: 100%;
        clear: both;
        text-align: center;

        &.active, &.hover {

            .image {
                border: solid 2px #64b5f6;
            }

        }

    }

    .image {
        width: 64px;
        height: 64px;
        border: solid 2px transparent;
        cursor: pointer;
    }

    .title {
        padding: 1px 0 12px;
    }

</style>