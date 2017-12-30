<template>

    <div class="svg-box" ref="box">

        <Selection ref="selection"
                   :flash="selectionFlash"
                   :dragDisabled="dragDisabled"
                   :contextMenu="contextMenu"
                   :editable="editable"
        >

            <div ref="svg"
                 :class="['svg-container',{animate:viewOffset.animate}]"
                 :style="{left:viewOffset.left+'px',top:viewOffset.top+'px'}"
            ></div>

        </Selection>

    </div>

</template>

<script>

    import _ from 'lodash';
    import bus from '../commons/bus';
    import {SVG} from '../commons/svg';

    import Snap from 'snapsvg';

    import Struct from '../maker/struct';

    import {mapMutations, mapState} from 'vuex'
    import Selection from './Selection.vue';

    export default {

        name: 'SVGSurface',

        components: {Selection},

        props: {
            zoomAnimationDuration: {
                type: Number,
                default: 200
            },
            selectionFlash: {
                type: Boolean,
                default: true
            },
            dragDisabled: {
                type: Boolean,
                default: false
            },
            contextMenu: {
                type: Array
            },
            getItemTitle: {
                type: Function
            },
            editable: {
                type: Boolean
            }
        },

        data() {
            return {
                previewURL: ''
            }
        },

        computed: {
            ...mapState(['structsMap', 'structsList', 'viewOffset'])
        },

        methods: {

            ...mapMutations(['addStruct']),

            getClientRect() {
                let box = this.$refs.box;
                return box ? box.getBoundingClientRect() : {};
            },

            deleteStruct() {
                let selection = this.$refs.selection,
                    items = selection.selectedItems,
                    structsMap = this.structsMap,
                    struct;
                for (let i = 0; i < items.length; i++) {
                    this.$store.commit('removeStruct', struct = structsMap[items[i].id]);
                    struct.element.destroy();
                    if (struct.fragment) {
                        struct.fragment.destroy();
                    }
                }
                selection.selectedItems = [];
                bus.$emit('refresh');
            },

            resize(minRect) {
                let {left: vLeft, top: vTop} = this.viewOffset,
                    clientRect, cWidth, cHeight, mWidth, mHeight;
                if (minRect) {
                    clientRect = this.getClientRect();
                    cWidth = clientRect.width;
                    cHeight = clientRect.height;
                    mWidth = minRect.width;
                    mHeight = minRect.height;
                } else {
                    minRect = this.$refs.selection.getViewBox(null, []);
                    cWidth = minRect.viewWidth;
                    cHeight = minRect.viewHeight;
                    mWidth = minRect.width;
                    mHeight = minRect.height;
                }
                this.svg.setWidth(Math.max(cWidth, mWidth) - (vLeft > 0 ? 0 : vLeft))
                    .setHeight(Math.max(cHeight, mHeight) - (vTop > 0 ? 0 : vTop));
            },

            refresh() {
                let items = this.structsList,
                    viewOffset = this.viewOffset,
                    len = items.length,
                    left = len ? Infinity : 0,
                    right = len ? -Infinity : 0,
                    top = len ? Infinity : 0,
                    bottom = len ? -Infinity : 0,
                    durationProps = Math.max(parseInt(this.$props.zoomAnimationDuration, 10) || 0, 0),
                    rect, duration, tAttr,
                    element, eLeft, eTop, eWidth, eHeight, pAttr, wAttr, pAttrChanged, wAttrChanged;
                for (let i = 0, item; i < len; i++) {
                    duration = durationProps;
                    item = items[i];
                    element = item.element;
                    pAttr = {};
                    wAttr = {};
                    pAttrChanged = wAttrChanged = false;
                    eLeft = item._left;
                    eTop = item._top;
                    if (eLeft !== item.left || item._inited) {
                        item._left = item.left;
                        if (item._itemLeft === item.itemLeft) {
                            pAttr.left = (item.itemLeft += (item.left - eLeft));
                        } else {
                            item._itemLeft = item.itemLeft;
                        }
                        pAttrChanged = true;
                    }
                    if (eTop !== item.top || item._inited) {
                        item._top = item.top;
                        if (item._itemTop === item.itemTop) {
                            pAttr.top = (item.itemTop += (item.top - eTop));
                        } else {
                            item._itemTop = item.itemTop;
                        }
                        pAttrChanged = true;
                    }
                    eWidth = item._width;
                    eHeight = item._height;
                    if (eWidth !== item.width || item._inited) {
                        item._width = item.width;
                        if (item._itemWidth === item.itemWidth) {
                            wAttr.width = (item.itemWidth += (item.width - eWidth));
                        } else {
                            item._itemWidth = item.itemWidth;
                        }
                        wAttrChanged = true;
                    }
                    if (eHeight !== item.height || item._inited) {
                        item._height = item.height;
                        if (item._itemHeight === item.itemHeight) {
                            wAttr.height = (item.itemHeight += (item.height - eHeight));
                        } else {
                            item._itemHeight = item.itemHeight;
                        }
                        wAttrChanged = true;
                    }
                    item._inited = false;
                    if (pAttrChanged || wAttrChanged) {
                        duration = 0;
                        element.attr({transform: ''});
                        rect = element.getBBox();
                        if (pAttrChanged) {
                            if (item._itemLeft === item.itemLeft) {
                                pAttr.left = item.itemLeft;
                            } else {
                                pAttr.left = item.itemLeft = item._itemLeft = rect.x + item.left - eLeft;
                            }
                            if (item._itemTop === item.itemTop) {
                                pAttr.top = item.itemTop;
                            } else {
                                pAttr.top = item.itemTop = item._itemTop = rect.y + item.top - eTop;
                            }
                        }
                        if (wAttrChanged) {
                            if (item._itemWidth === item.itemWidth) {
                                wAttr.width = item.itemWidth;
                            } else {
                                wAttr.width = item.itemWidth = item._itemWidth = rect.width + item.width - eWidth;
                            }
                            if (item._itemHeight === item.itemHeight) {
                                wAttr.height = item.itemHeight;
                            } else {
                                wAttr.height = item.itemHeight = item._itemHeight = rect.height + item.height - eHeight;
                            }
                        }
                    }
                    if (viewOffset.animate === 'wh' && +duration) {
                        if (pAttrChanged) {
                            element.attr(pAttr);
                        }
                        if (wAttrChanged) {
                            element.refresh(wAttr, duration);
                        }
                    } else if (pAttrChanged || wAttrChanged) {
                        element.refresh({...pAttr, ...wAttr}, viewOffset.animate ? duration : 0);
                        tAttr = this.getTransformAttr(item) || {};
                        this.setTransform(item, tAttr.value || {}, tAttr.detail || {})
                            .then(() => {
                                if (item.radian !== void 0) {
                                    let cellWidth = bus.cellWidth || 10.5;
                                    this.changeAttr(item, {
                                            angle: item.angle,
                                            radian: item.radian,
                                            width: item.w * cellWidth,
                                            height: item.h * cellWidth
                                        }, {angle: this.getTransformDetail(item, 'angle')},
                                        true);
                                }
                            });
                    }
                    left = Math.min(item.left, left);
                    top = Math.min(item.top, top);
                    right = Math.max(item.left + item.width, right);
                    bottom = Math.max(item.top + item.height, bottom);
                }
                this.resize({
                    width: right - left,
                    height: bottom - top
                });
            },

            appendElementToArea(item, selection, silent) {

                let {left, top, width, height, w, h} = selection,
                    //
                    struct = new Struct({
                        ...item,
                        left, top, w, h,
                        width, height
                    }),
                    svg = this.svg,
                    elem = svg.appendImageElement(struct),
                    node = elem.node,
                    attr;

                struct.element = elem;
                node.id = struct.id;

                struct.selection = selection;

                this.setItemBoxRect(struct);

                if (attr = this.getTransformAttr(struct)) {
                    this.setTransform(struct, attr.value, attr.detail)
                        .then(() => {
                            let {radian, angle} = attr.value;
                            if (radian !== void 0) {
                                let cellWidth = bus.cellWidth || 10.5;
                                this.changeAttr(struct, {
                                    angle: angle,
                                    radian: radian,
                                    width: struct.w * cellWidth,
                                    height: struct.h * cellWidth
                                }, attr.detail, true);
                            }
                        });
                }

                this.addStruct(struct);

                if (!silent) {
                    bus.$emit('refresh');
                }

                return struct;

            },

            setItemBoxRect(item) {
                let attr = item.element.getBBox();
                item._left = item.left;
                item.itemLeft = attr.x;
                item._itemLeft = attr.x;
                item._top = item.top;
                item.itemTop = attr.y;
                item._itemTop = attr.y;
                item._width = item.width;
                item.itemWidth = attr.width;
                item._itemWidth = attr.width;
                item._height = item.height;
                item.itemHeight = attr.height;
                item._itemHeight = attr.height;
                return this;
            },

            setItemAttributes(item, props) {
                item.code = props.code;
                item.remark = props.remark;
                item._color = item.color = props.color;
                item._angle = item.angle = props.angle;
                item._radian = item.radian = props.radian;
            },

            getTransformAttr(item) {
                let {angle, radian, color, code} = item,
                    attr = null, detail = {};
                if (color) {
                    attr = attr || {};
                    attr.color = color;
                    detail.color = this.getTransformDetail(item, 'color');
                }
                if (angle) {
                    attr = attr || {};
                    attr.angle = angle;
                    detail.angle = this.getTransformDetail(item, 'angle');
                }
                if (radian !== void 0) {
                    attr = attr || {};
                    attr.radian = radian;
                    detail.radian = this.getTransformDetail(item, 'radian');
                }
                if (code) {
                    attr = attr || {};
                    attr.code = code;
                    detail.code = this.getTransformDetail(item, 'code');
                }
                return attr ? {value: attr, detail} : null;
            },

            getTransformDetail(item, prop) {
                let transfrom = item.transform || [],
                    attributes = item.attributes || [];
                return transfrom.concat(attributes).filter(item => item.name === prop)[0];
            },

            setTransform(item, attr, detail, noPromise, bBox) {

                let element = item.element,
                    {angle, radian, color, code} = attr,
                    clonedItem = item.clonedItem || item;
                if (angle !== void 0) {
                    element.rotate(angle, (detail.angle || {}).origin);
                    item._angle = item.angle = angle;
                }
                if ((color && item._color !== color) || (item._code !== code) || (radian !== void 0 && radian !== item._radian)) {
                    return (item.fragment ? Promise.resolve(item.fragment)
                        : new Promise((resolve) => {
                            this.svg.loadFragment({
                                src: item.src
                            }, resolve);
                        }))
                        .then(fragment => {
                            item.fragment = fragment;
                            if ((color && item._color !== color) || (item._code !== code)) {
                                let agentColor = color,
                                    deskColor = color,
                                    defaultColor = '#a1887f',
                                    agent = fragment.select('.desk-agent');
                                item._color = item.color = color;
                                item._code = code;
                                if ((typeof color === 'string') && color.indexOf('_') !== -1) {
                                    color = color.split('_');
                                    agentColor = color[0];
                                    deskColor = color[1];
                                }
                                fragment.setChildAttr('.desk-border', {fill: deskColor || defaultColor});
                                if (agent) {
                                    agent.attr({
                                        fill: agentColor || defaultColor
                                    }).node.setAttribute('display', code !== void 0 && code !== '' ? '' : 'none');
                                    if (code) {
                                        item.element
                                            .unhover()
                                            .hover(() => {
                                                let handler = this.$props.getItemTitle,
                                                    code = clonedItem.code;
                                                this.titleTips.content = typeof handler === 'function' ? handler.call(this, clonedItem, this.titleTips) || code : code;
                                                this.titleTips.show(clonedItem.element.node);
                                            }, () => {
                                                this.titleTips.hide();
                                            });
                                    }
                                }
                                item.element.attr({href: fragment.toDataURL()});
                            }
                        }).then(() => {
                            if (radian !== void 0 && bBox) {
                                let fragment = item.fragment,
                                    element = item.element;
                                item._radian = radian;
                                if (radian) {
                                    let path = fragment.select('path'),
                                        node;
                                    if (path) {
                                        node = path.node;
                                        node.style.visible = 'visible';
                                        node.setAttribute('d', fragment.toArc(radian, bBox.width, bBox.height));
                                        let {x, w, h, vb} = path.getBBox(),
                                            eW = w - x;
                                        fragment.attr({width: eW, height: h, viewBox: vb});
                                        fragment.select('rect').node.setAttribute('display', 'none');
                                        element.attr({width: eW, height: h});
                                    }
                                } else {
                                    let width = 32.5,
                                        height = 61;
                                    fragment.node.style.overflow = 'hidden';
                                    fragment.setChildAttr('path', {d: ''});
                                    fragment.attr({viewBox: '', width, height});
                                    fragment.select('rect').node.setAttribute('display', '');
                                }
                                element.attr({href: fragment.toDataURL()});
                            }
                        });
                } else {
                    return noPromise ? this : Promise.resolve();
                }
            },

            getMappedAttrKey(attr) {
                return (({
                    'width height': 'w',
                    'height width': 'w',
                    width: 'w',
                    height: 'h'
                })[attr] || attr);
            },

            initElementItems(items) {
                let defaultItems = bus.defaultItems,
                    item, dItem, name, attrs;
                for (let i = 0, len = items.length; i < len; i++) {
                    item = items[i];
                    if (!item.selection) {
                        item.selection = {
                            left: item.left,
                            top: item.top,
                            width: item.width,
                            height: item.height,
                            w: item.w,
                            h: item.h
                        };
                    }
                    name = item.name;
                    for (let j = 0; j < defaultItems.length; j++) {
                        if ((dItem = defaultItems[j]).name === name) {
                            if (attrs = item.transform = _.cloneDeep(dItem.transform)) {
                                for (let k = 0; k < attrs.length; k++) {
                                    attrs[k].value = item[this.getMappedAttrKey([attrs[k].name])];
                                }
                            }
                            if (attrs = item.attributes = _.cloneDeep(dItem.attributes)) {
                                for (let k = 0; k < attrs.length; k++) {
                                    attrs[k].value = item[attrs[k].name];
                                }
                            }
                            break;
                        }
                    }
                    item = this.appendElementToArea(item, item.selection, true);
                    item._inited = true;
                }
            },

            changeAttr(item, attr, detail, noValidation) {
                let {element, fragment, src, itemWidth, itemHeight, selection} = item,
                    cloned = element.clone({style: {opacity: 0}}),
                    clonedItem = {
                        element: cloned,
                        fragment,
                        src,
                        itemWidth,
                        itemHeight,
                        selection,
                        clonedItem: item
                    },
                    bBox;
                cloned.attr({
                    transform: '',
                    width: attr.width,
                    height: attr.height
                });
                bBox = cloned.getBBox();
                return this.setTransform(clonedItem, attr, detail, false, bBox)
                    .then(() => {
                        item.fragment = clonedItem.fragment;
                        let handler = (valid) => {
                            if (valid && !element.destroyed) {
                                element.destroy();
                                element = item.element = cloned.setStyle({opacity: ''});
                                cloned.attr({id: item.id});
                                item.itemWidth = bBox.width;
                                item.itemHeight = bBox.height;
                                item.itemLeft = bBox.x;
                                item.itemTop = bBox.y;
                                item._itemWidth = bBox.width;
                                item._itemHeight = bBox.height;
                                item._itemLeft = bBox.x;
                                item._itemTop = bBox.y;
                                item._left = item.left;
                                item._top = item.top;
                                item._width = item.width;
                                item._height = item.height;
                                this.setItemAttributes(item, attr);
                                if (item.radian) {
                                    element.bringToBack();
                                }
                            } else if (!cloned.destroyed) {
                                cloned.destroy();
                            }
                        };
                        if (noValidation) {
                            handler(true);
                            item.selection.changing = !!item.radian;
                        } else {
                            let {x: left, y: top, width, height} = cloned.getBBox();
                            bus.$once('attrValidation', handler)
                                .$emit('attrValidate', {
                                    left, top, width, height, radian: attr.radian
                                });
                        }
                    })
                    .catch(error => {
                        console.error(error);
                        cloned.destroy();
                        bus.$emit('attrValidate', false);
                    });
            },

            cloneItem(item, selection) {
                let id = item.clonedId,
                    structsMap = id ? this.structsMap : null,
                    oldItem = id ? structsMap[id] : null;
                if (oldItem) {
                    let struct = new Struct({
                            ...item,
                            ...selection,
                            clonedId: ''
                        }),
                        elem = struct.element = oldItem.element.clone();
                    elem.node.id = struct.id;
                    this.addStruct(struct);
                    return struct;
                } else {
                    return this.appendElementToArea(item, selection, true);
                }
            }

        },

        mounted() {
            let {svg: el} = this.$refs,
                {width, height} = this.getClientRect();
            this.svg = new SVG({
                width,
                height,
                el
            });
            bus.$on('reset', () => {
                this.svg.empty();
            }).$on('hideSVGSurface', () => {
                this.svg.hide();
            }).$on('showSVGSurface', () => {
                this.svg.show();
            }).$on('packageOpen', (items) => {
                this.initElementItems(items);
                bus.$emit('refresh', 'packageOpen');
                this.resize();
            }).$on('layoutChange', () => {
                this.resize();
            }).$on('positionChangeStart', ({items}) => {
                let structsMap = this.structsMap;
                for (let i = 0, item; i < items.length; i++) {
                    item = structsMap[items[i].id];
                    item.element.bringToFront();
                }
            }).$on('onkeyup', (event) => {
                if (event.keyCode == 46) {
                    this.deleteStruct(event);
                }
            }).$on('refresh', (flag) => {
                if (flag !== 'packageOpen') {
                    this.refresh();
                }
            }).$on('makeNewSelection', (list) => {
                let items = [], item;
                for (let i = 0, len = list.length, struct; i < len; i++) {
                    struct = list[i];
                    item = this.cloneItem(struct.item, struct.selection);
                    item._inited = true;
                    items.push({
                        id: item.id,
                        left: item.left,
                        top: item.top,
                        width: item.width,
                        height: item.height
                    });
                }
                this.refresh();
                bus.$emit('newSelectionMade', items);
            }).$on('viewOffsetChanged', () => {
                this.resize();
            }).$on('changeAttr', (item, attr, detail) => {
                this.changeAttr(item, attr, detail);
            }).$on('itemSelected', item => {
                if (item = this.structsMap[item.id]) {
                    if (item.radian) {
                        item.element.bringToBack();
                    } else {
                        item.element.bringToFront();
                    }
                }
            }).$on('refreshItems', items => {
                let cellWidth = bus.cellWidth;
                for (let i = 0, item, attr, value; i < items.length; i++) {
                    item = items[i];
                    if (attr = this.getTransformAttr(item)) {
                        value = attr.value;
                        value.width = item.w * cellWidth;
                        value.height = item.h * cellWidth;
                        this.changeAttr(item, value, attr.detail, true);
                    }
                }
                if (items.length && this.titleTips) {
                    this.titleTips.hide();
                }
            });
            window.addEventListener('resize', this.resizeHandler = _.debounce(() => {
                this.resize();
            }, 100));
            this.titleTips = new (Vue.component('AgentAppTips'))({
                data: {
                    arrow: false,
                    display: 'none',
                    minWidth: '10px',
                    minHeight: '10px',
                    padding: '4px 6px',
                    textAlign: 'center'
                }
            });
        },

        beforeDestroy() {
            if (this.svg) {
                this.svg.destroy();
            }
            if (this.titleTips) {
                this.titleTips.$destroy();
            }
            if (this.resizeHandler) {
                window.removeEventListener('resize', this.resizeHandler);
                this.resizeHandler = null;
            }
        }

    }

</script>

<style lang="scss" scoped>

    .svg-box {
        width: 100%;
        height: 100%;
        position: relative;
    }

    .view-box {
        width: 200px;
        height: 120px;
        box-shadow: 0 0 9px rgba(4, 0, 0, .52);
        position: absolute;
        left: 20px;
        bottom: 20px;
        z-index: 999;
        border-radius: 3px;
    }

    .svg-container {
        width: 100%;
        height: 100%;
        position: absolute;

        &.animate {
            transition: left .09s, top .09s;
        }

    }

</style>