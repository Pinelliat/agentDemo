<template>

    <div ref="grid"
         v-show="display"
         :class="['grid', {line, [ratioBg]:true}]"
    >

        <slot></slot>

        <div v-show="showRuleArea" class="area"
             :style="{left: area.left, top: area.top,  width: area.width, height: area.height, backgroundColor: ruleAreaColor, zIndex: ruleLineIndex}"
        >
            <span :class="['avail', {'animated flash infinite': ruleAreaFlash}]"
                  v-for="style in marks.avail"
                  :style="getStyle(style)"
                  :key="style.key"
            >
            </span>
            <span :class="['avoid', {'animated flash infinite': ruleAreaFlash}]"
                  v-for="style in marks.avoid"
                  :style="getStyle(style)"
                  :key="style.key"
            >
            </span>
        </div>

        <span v-show="showRuleLine" class="v-line"
              :style="{zIndex: ruleLineIndex, backgroundColor: ruleLineColor, left: rule.tLeft}"></span>
        <span v-show="showRuleLine" class="h-line"
              :style="{zIndex: ruleLineIndex, backgroundColor: ruleLineColor, top: rule.tTop}"></span>
        <span v-show="showRuleLine" class="v-line"
              :style="{zIndex: ruleLineIndex, backgroundColor: ruleLineColor, left: rule.bLeft}"></span>
        <span v-show="showRuleLine" class="h-line"
              :style="{zIndex: ruleLineIndex, backgroundColor: ruleLineColor, top: rule.bTop}"></span>
        <span v-show="showRuleLine" class="v-label"
              :style="{zIndex: ruleLineIndex, left: rule.tLeft}"
        >{{val.tLeft}}</span>
        <span v-show="showRuleLine" class="h-label"
              :style="{zIndex: ruleLineIndex, top: rule.tTop}"
        >{{val.tTop}}</span>
        <span v-show="showRuleLine" class="v-label"
              :style="{zIndex: ruleLineIndex, left: rule.bLeft}"
        >{{val.bLeft}}</span>
        <span v-show="showRuleLine" class="h-label"
              :style="{zIndex: ruleLineIndex, top: rule.bTop}"
        >{{val.bTop}}</span>

        <div :class="['shadow-wrap', {avoid:!shadow.avail}]"
             v-show="showItemShadow"
             :style="{zIndex:ruleLineIndex + 10, left:shadow.left+'px', top:shadow.top+'px', width:shadow.width+'px', height:shadow.height+'px'}">

            <template v-for="(item,index) in shadow.items">
                <img v-if="index < 5" class="shadow"
                     :src="item.img.src"
                     :class="{'animated flash infinite':shadow.copy&&ruleAreaFlash}"
                     :style="{left:item.img.left+'px', top:item.img.top+'px', opacity:item.img.opacity, animationDelay:item.img.delay+'ms'}"
                />
            </template>
            <span class="count">{{shadow.count}}</span>
            <span v-show="shadow.copy" class="copy">复制</span>

        </div>

        <div v-show="showItemShadow">
            <template v-for="item in shadow.items">
                <span :class="['static', {avail:item.avail, avoid:!item.avail}]"
                      :style="{left: item.left+'px',
                              top: item.top+'px',
                              width: item.width+'px',
                              height: item.height+'px',
                              zIndex: ruleLineIndex}"
                ></span>
            </template>
        </div>

    </div>

</template>

<script>

    import _ from 'lodash';
    import bus from '../commons/bus';
    import {mapState} from 'vuex'

    let cellWidth = 10.5;

    export default {

        name: 'GridLine',

        props: {
            display: {
                type: Boolean,
                default: true
            },
            line: {
                type: Boolean,
                default: true
            },
            ruleLine: {
                type: Boolean,
                default: true
            },
            ruleLineIndex: {
                type: Number,
                default: 100
            },
            ruleLineColor: {
                type: String,
                default: 'red'
            },
            ruleAreaColor: {
                type: String,
                default: 'yellow'
            },
            ruleAreaFlash: {
                type: Boolean,
                default: true
            },
            movable: {
                type: Boolean,
                default: true
            },
            freeDrop: {
                type: Boolean,
                default: false
            }
        },

        data() {
            return {
                offset: {},
                coords: {},
                rule: {},
                area: {},
                marks: {},
                marked: false,
                val: {},
                outOfRange: true,
                showItemShadow: false,
                shadow: {},
                shadowAreas: [{avail: [], avoid: []}]
            }
        },

        computed: {
            showRuleLine() {
                return this.ruleLine && !this.outOfRange && this.marked && !this.freeDrop;
            },
            showRuleArea() {
                return !this.outOfRange;
            },
            ...mapState(['structsMap', 'structsList', 'viewOffset', 'ratio']),

            ratioBg() {
                let ratio = this.ratio || 0;
                return ['one', 'one', 'two', 'three'][ratio];
            }
        },

        watch: {

            offset({x = 0, y = 0}) {
                if (x <= 0 || y <= 0) {
                    this.outOfRange = true;
                    return;
                }
                let body = document.body,
                    bWidth = body.clientWidth,
                    bHeight = body.clientHeight;
                if (x >= bWidth || y >= bHeight) {
                    this.outOfRange = true;
                    return;
                }
                let rect = this.getClientRect();
                if (x <= rect.left || x >= rect.left + rect.width || y <= rect.top || y >= rect.top + rect.height) {
                    this.outOfRange = true;
                    return;
                }
                this.outOfRange = false;
            },

            coords({x = 0, y = 0, w = 2, h = 2}) {
                if (this.display) {
                    let area = this.getArea({
                        x, y, w, h,
                        clientRect: this.getClientRect()
                    }), {left, top, width, height} = area;
                    //
                    this.area = {
                        left: left + 'px',
                        top: top + 'px',
                        width: width + 'px',
                        height: height + 'px'
                    };
                    //
                    this.setMarkedArea(this.getMarkedArea(area));
                }
            },

            showItemShadow(shadow) {
                if (!shadow) {
                    this.shadow = {};
                    this.shadowAreas = [];
                }
            }
        },

        mounted() {

            this.setCellWidth(this.ratio);

            this.coordsMap = {};

            bus.$on('reset', () => {
                this.coordsMap = {};
            }).$on('addStruct', (struct) => {
                let {left, top, width, height, w, h} = struct,
                    selection = {
                        left, top,
                        width, height, w, h
                    };
                struct.selection = selection;
                struct.changing = !!struct.radian;
                this.setCoordsMap(selection);
            }).$on('removeStruct', (struct) => {
                let coordsMap = this.coordsMap,
                    maps = struct.selection.maps,
                    coo;
                while (coo = maps.pop()) {
                    delete coordsMap[`${coo.left},${coo.top}`];
                }
                delete coordsMap[`${struct.left},${struct.top}`];
            }).$on('positionChangeStart', ({items, detail: {coords}}) => {
                if (this.display && this.movable) {
                    this.makeShadow(items, coords);
                }
            }).$on('positionChanging', _.throttle(({detail: {coords}}) => {
                if (this.display && this.movable) {
                    this.moveShadow(coords);
                }
            }, 30)).$on('positionChangeEnd', ({detail: {coords}}) => {
                if (this.display && this.movable) {
                    this.moveShadow(coords);
                    this.$nextTick(() => {
                        this.resetSelection();
                    });
                }
            }).$on('positionChangeCancel', () => {
                this.showItemShadow = false;
            }).$on('zoomIn', () => {
                this.setCurOffset({...this.viewOffset, animate: true})
                    .setRatio(this.ratio + 1);
            }).$on('zoomOut', () => {
                this.setCurOffset({...this.viewOffset, animate: true})
                    .setRatio(this.ratio - 1);
            }).$on('focusViewBox', (box, ratio) => {
                this.focusPoint(box, ratio);
            }).$on('viewOffsetChange', offset => {
                this.setCurOffset(offset);
                bus.$emit('viewOffsetChanged', offset);
            }).$on('onkeydown', event => {
                if (event.ctrlKey && this.showItemShadow && !this.shadow.copy) {
                    this.setShadowChanging(false);
                }
            }).$on('onkeyup', () => {
                if (this.showItemShadow && this.shadow.copy) {
                    this.setShadowChanging(true);
                }
            }).$on('packageOpened', () => {
                this.setCellWidth(this.ratio);
                this.resetCoordsMap();
            }).$on('changeProps', (item, attr, detail) => {
                this.changeAttribute(item, attr, detail);
            });
        },

        methods: {

            getCellWidth(ratio) {
                return [10.5, 10.5, 20.5, 30.5][ratio || this.ratio];
            },

            setCellWidth(ratio) {
                bus.cellWidth = cellWidth = [10.5, 10.5, 20.5, 30.5][ratio || this.ratio];
                let {left, top} = this.viewOffset;
                this.setCurOffset({left, top});
                return this;
            },

            resetTransformSelection(item, attr) {
                let {width, height, left, top, w, h} = attr,
                    selection = item.selection,
                    coo = this.getLargestFixedCoords(left, top, -1),
                    yoo = this.getLargestFixedCoords(left + width, top + height, 1),
                    valid = true,
                    mapped, zoo;
                left = coo.left;
                top = coo.top;
                width = yoo.left - coo.left;
                height = yoo.top - coo.top;
                if (!attr.radian) {
                    mapped = this.getMappedCoords({
                        left,
                        top,
                        width,
                        height
                    });
                    selection.changing = true;
                    while (zoo = mapped.pop()) {
                        if (this.isCoordsMaped(zoo.left, zoo.top)) {
                            valid = false;
                            break;
                        }
                    }
                }
                selection.changing = !!attr.radian;
                if (valid) {
                    Object.assign(selection, {
                        left, top, width, height, w, h
                    });
                    Object.assign(item, {
                        left, top, width, height, w, h
                    });
                    this.setCoordsMap(selection);
                    bus.$emit('newSelectionMade', [item]);
                }
                return valid;
            },

            changeAttribute(item, attr, detail) {
                let keys = Object.keys(attr),
                    length = keys.length, i = 0,
                    {width, height, w, h} = item,
                    key, val, newVal, mappedKey, rectKey;
                while (i < length) {
                    if (key = keys[i++]) {
                        val = attr[key];
                        if (/\bw|h|wh\b/.test((mappedKey = this.getMappedAttrKey(key)))) {
                            newVal = cellWidth * val;
                            rectKey = mappedKey;
                            if (mappedKey === 'wh') {
                                width = height = newVal;
                                w = h = val;
                            } else if (mappedKey === 'h') {
                                height = newVal;
                                h = val;
                            } else {
                                width = newVal;
                                w = val;
                            }
                        }
                    }
                }
                bus.$once('attrValidate', attr => {
                    if (attr) {
                        attr.w = w;
                        attr.h = h;
                        if (this.resetTransformSelection(item, attr)) {
                            bus.$emit('attrValidation', true, {});
                        } else {
                            bus.$emit('attrValidation', false, {
                                msg: '结构周围没有足够的可用空',
                                key: ({
                                    w: 'width',
                                    h: 'height',
                                    wh: 'width height'
                                })[rectKey]
                            });
                        }
                    } else {
                        bus.$emit('attrValidation', false, {
                            msg: '当前无法变动该元素'
                        });
                    }
                }).$emit('changeAttr', item, {
                    ...attr,
                    width,
                    height
                }, detail);
            },

            getMappedAttrKey(attr) {
                return (({
                    'width height': 'wh',
                    'height width': 'wh',
                    width: 'w',
                    height: 'h'
                })[attr] || attr);
            },

            resetCoordsMap() {
                let structs = this.structsList,
                    length = structs.length,
                    item;
                this.coordsMap = {};
                while (length--) {
                    if (item = structs[length]) {
                        this.setCoordsMap(
                            item.selection = {
                                left: item.left,
                                top: item.top,
                                width: item.width,
                                height: item.height,
                                w: item.w,
                                h: item.h
                            }
                        );
                    }
                }
            },

            setShadowChanging(changing) {
                let shadow = this.shadow,
                    maps = this.structsMap,
                    items = shadow.items,
                    length = items.length,
                    item;
                while (length--) {
                    item = items[length];
                    maps[item.id].selection.changing = changing;
                }
                shadow.copy = !changing;
                this.moveShadow(shadow.lastArgs);
            },

            setCurOffset(offset) {
                let {left, top, animate} = offset,
                    curOffset = (!isNaN(left) && !isNaN(top)) ? this.getFixedCoords(left, top, true) : {};
                this.$store.commit('setOffset', {left: curOffset.left, top: curOffset.top, animate});
                return this;
            },

            getClientRect() {
                let grid = this.$refs.grid;
                return grid ? grid.getBoundingClientRect() : {};
            },

            getShadowOffset(x, y, clientReact) {
                let shadow = this.shadow || {},
                    eWidth = shadow.width,
                    eHeight = shadow.height,
                    bWidth = clientReact.width,
                    bHeight = clientReact.height;
                x = Math.min(Math.max(x, 0), bWidth);
                y = Math.min(Math.max(y, 0), bHeight);
                return {
                    left: (x + eWidth / 2 > bWidth) > bWidth ? bWidth - eWidth : (x - eWidth / 2 > 0 ? x - eWidth : 0),
                    top: y > bHeight ? bHeight - eHeight : (y - eHeight > 0 ? y - eHeight : 0)
                }
            },

            makeShadow(items, {current: {x, y}}) {
                let clientRect = this.getClientRect(),
                    {left: oLeft, top: oTop} = this.viewOffset,
                    maps = this.structsMap,
                    shadows = [],
                    left = 0,
                    top = 0,
                    width = 69,
                    height = 69,
                    pad = 3,
                    delay = 20,
                    len = items.length,
                    opacity = 0.95 - Math.min(len, 5) * 0.15,
                    selection, id, start;
                for (let i = 0, item; i < len; i++) {
                    item = items[i];
                    left += pad;
                    top += pad;
                    opacity += 0.15;
                    delay += 80;
                    if (i < 5) {
                        width += pad;
                        height += pad;
                    }
                    if (pad < 5) {
                        pad++;
                    }
                    shadows.push({
                        id: id = item.id,
                        start: start = {left: item.left, top: item.top},
                        left: item.left + oLeft,
                        top: start.top + oTop,
                        width: item.width,
                        height: item.height,
                        avail: true,
                        img: {left, top, src: maps[id].src, opacity, delay}
                    });
                    if (selection = maps[id].selection) {
                        selection.changing = true;
                    }
                }

                let count = shadows.length;
                if (count) {
                    this.shadow = {
                        items: shadows,
                        width,
                        height,
                        count,
                        copy: false,
                        ...this.getShadowOffset(x, y, clientRect)
                    };
                    this.showItemShadow = true;
                } else {
                    this.showItemShadow = false;
                }

            },

            moveShadow({delta: {x, y}, current: {x: cX, y: cY}}) {
                if (this.showItemShadow) {
                    let shadow = this.shadow,
                        structsMap = this.structsMap,
                        clientRect = this.getClientRect(),
                        {left, top} = this.getShadowOffset(cX, cY, clientRect),
                        {left: oLeft, top: oTop} = this.viewOffset,
                        items = shadow.items, shadowAvail = true,
                        avail, mapped, coo, item, start, struct;
                    shadow.left = left;
                    shadow.top = top;
                    for (let i = 0, len = items.length; i < len; i++) {
                        item = items[i];
                        struct = structsMap[item.id];
                        start = item.start;
                        left = start.left + x;
                        top = start.top + y;
                        avail = true;
                        if (!struct.radian) {
                            mapped = this.getMappedCoords({left, top, width: item.width, height: item.height}, true);
                            for (let j = 0; j < mapped.length; j++) {
                                coo = mapped[j];
                                if (this.isCoordsMaped(coo.left, coo.top)) {
                                    avail = shadowAvail = false;
                                    break;
                                }
                            }
                        }
                        item.avail = avail;
                        coo = this.getFixedCoords(left + oLeft, top + oTop, true);
                        item.left = coo.left;
                        item.top = coo.top;
                    }
                    shadow.avail = shadowAvail;
                    shadow.lastArgs = {delta: {x, y}, current: {x: cX, y: cY}};
                }
            },

            setRatio(ratio, silent) {

                if (ratio > 3 || ratio < 1 || ratio === this.ratio) {
                    bus.$emit('ratioNoChange');
                    return;
                }

                this.setCellWidth(ratio);

                let items = this.structsList,
                    r = this.getCellWidth(ratio) / this.getCellWidth(this.ratio),
                    i = 0, item, selection, converted;

                while (item = items[i++]) {
                    selection = item.selection;

                    converted = this.convertToRatio(item, r, true);

                    item.left = selection.left = converted.left;
                    item.top = selection.top = converted.top;
                    item.width = selection.width = converted.width;
                    item.height = selection.height = converted.height;
                    item.itemLeft = converted.itemLeft;
                    item.itemTop = converted.itemTop;
                    item.itemWidth = converted.itemWidth;
                    item.itemHeight = converted.itemHeight;
                }

                this.resetCoordsMap();

                this.$store.commit('setRatio', ratio);

                if (!silent) {
                    bus.$emit('refresh');
                }
            },

            convertToRatio({left, top, width, height, itemLeft, itemTop, itemWidth, itemHeight}, r, absolute) {
                let right = (left + width) * r,
                    bottom = (top + height) * r,
                    itemRight = (itemLeft + itemWidth) * r,
                    itemBottom = (itemTop + itemHeight) * r,
                    coo, yoo, moo, noo;
                left *= r;
                top *= r;
                itemLeft *= r;
                itemTop *= r;
                coo = this.getFixedCoords(left, top, absolute);
                yoo = this.getFixedCoords(right, bottom, absolute);
                moo = this.getFixedCoords(itemLeft, itemTop, absolute);
                noo = this.getFixedCoords(itemRight, itemBottom, absolute);
                return {
                    left: coo.left,
                    top: coo.top,
                    width: yoo.left - coo.left,
                    height: yoo.top - coo.top,
                    itemLeft: moo.left,
                    itemTop: moo.top,
                    itemWidth: noo.left - moo.left,
                    itemHeight: noo.top - moo.top
                };
            },

            focusViewBox(viewBox, point) {
                let {width, height, left, top, viewWidth, viewHeight} = viewBox,
                    ratio = this.ratio,
                    curRatio = ratio,
                    viewOffset = this.viewOffset,
                    {left: vLeft, top: vTop} = viewOffset,
                    preRatio, r, from, to;
                if (!point && (width > viewWidth || height > viewHeight)) {
                    while (curRatio > 1) {
                        preRatio = curRatio;
                        --curRatio;
                        r = this.getCellWidth(curRatio) / this.getCellWidth(preRatio);
                        left *= r;
                        top *= r;
                        width *= r;
                        height *= r;
                        if (width <= viewWidth && height <= viewHeight) {
                            break;
                        }
                    }
                }

                from = {
                    left: left + width * 0.5 + vLeft,
                    top: top + height * 0.5 + vTop
                };

                to = (point || {
                    left: viewWidth * 0.5,
                    top: viewHeight * 0.5
                });

                if (curRatio !== ratio) {
                    this.setCellWidth(curRatio);
                }

                let coo = this.getFixedCoords(from.left, from.top, true),
                    yoo = this.getFixedCoords(to.left, to.top, true),
                    delta = {
                        x: yoo.left - coo.left,
                        y: yoo.top - coo.top
                    };
                //
                if (curRatio !== ratio) {
                    this.setRatio(curRatio);
                }
                //
                this.setCurOffset({left: vLeft + delta.x, top: vTop + delta.y, animate: !point});
            },

            focusPoint(box, ratio) {
                if (!isNaN(ratio = +ratio)) {
                    let prevRatio = this.ratio,
                        viewOffset = this.viewOffset,
                        {left: vLeft, top: vTop} = viewOffset,
                        point = this.getFixedCoords(
                            box.left + vLeft + box.width * 0.5,
                            box.top + vTop + box.height * 0.5,
                            true
                        );
                    ratio += prevRatio;
                    if (ratio > 0 && ratio < 4) {
                        if (ratio !== prevRatio) {
                            this.setRatio(ratio, true);
                        }
                        box = {...box, ...this.convertToRatio(box, this.getCellWidth(ratio) / this.getCellWidth(prevRatio), true)};
                        this.focusViewBox(box, point);
                        this.setCurOffset({animate: false});
                        bus.$emit('refresh');
                        this.setCurOffset({animate: true});
                    } else {
                        this.focusViewBox(box, point);
                    }
                } else {
                    this.focusViewBox(box);
                }
            },

            getSelection({x, y, w, h}) {
                let out = false;
                this.offset = {x, y};
                this.coords = {x, y, w, h};
                out = this.outOfRange;
                this.$nextTick(() => {
                    this.marked = false;
                    this.outOfRange = true;
                });
                this.$forceUpdate();
                this.selectionHidden = true;
                if (out) {
                    return null;
                }
                let {avail} = this.marks,
                    selection = null;
                if (avail && avail.length) {
                    let {left, top, right, bottom} = avail[0],
                        coo, yoo;
                    coo = this.getFixedCoords(left, top);
                    if (!this.isCoordsMaped(coo.left, coo.top)) {
                        selection = {
                            w, h
                        };
                        yoo = this.getFixedCoords(right, bottom);
                        selection.left = coo.left;
                        selection.top = coo.top;
                        selection.width = yoo.left - coo.left;
                        selection.height = yoo.top - coo.top;
                    }
                }
                return selection;
            },

            resetSelection() {
                let shadow = this.shadow,
                    maps = this.structsMap,
                    avail = shadow.avail,
                    items = shadow.items,
                    copy = shadow.copy,
                    newSelectionList = copy ? [] : null,
                    i = 0, selection,
                    newSelection, struct, newStruct,
                    item, coo, left, top, attr;
                if (avail) {

                    while (item = items[i++]) {

                        struct = maps[item.id];
                        selection = struct.selection;
                        selection.changing = false;
                        coo = this.getFixedCoords(item.left, item.top);

                        if (copy) {
                            newSelection = {
                                ...selection,
                                left: left = coo.left,
                                top: top = coo.top,
                                maps: []
                            };
                            newSelectionList.push({
                                item: newStruct = {
                                    ...struct,
                                    selection: null,
                                    element: null,
                                    fragment: null,
                                    node: null,
                                    item: null,
                                    code: '',
                                    remark: '',
                                    left,
                                    top,
                                    id: '',
                                    clonedId: struct.id
                                },
                                selection: newSelection
                            });
                            newStruct.transform = _.cloneDeep(newStruct.transform);
                            attr = _.cloneDeep(newStruct.attributes);
                            if (attr) {
                                newStruct.attributes = attr.map(item => {
                                    item.value = '';
                                    return item;
                                });
                            }
                        } else {
                            selection.left = struct.left = coo.left;
                            selection.top = struct.top = coo.top;
                        }
                    }

                    this.resetCoordsMap();

                    if (copy) {
                        bus.$emit('makeNewSelection', newSelectionList);
                    } else {
                        bus.$emit('refresh');
                    }

                } else if (items) {

                    while (item = items[i++]) {
                        struct = maps[item.id];
                        selection = struct.selection;
                        selection.changing = false;
                    }

                }
                this.showItemShadow = false;
            },

            setMousePosition({x, y, w, h}) {
                if (this.selectionHidden) {
                    this.selectionHidden = false;
                    return;
                }
                this.offset = {x, y};
                if (!this.outOfRange) {
                    this.coords = {x, y, w, h};
                } else {
                    this.marks = {avail: [], avoid: []};
                }
            },

            setMarkedArea(marked) {
                let {avail, avoid} = marked;
                if (avail.length || avoid.length) {
                    if (avail.length) {
                        let {left: tLeft, top: tTop, right: bLeft, bottom: bTop} = avail[0],
                            coo, yoo;
                        this.rule = {
                            tLeft: tLeft + 'px',
                            tTop: tTop + 'px',
                            bLeft: bLeft + 'px',
                            bTop: bTop + 'px'
                        };
                        coo = this.getFixedCoords(tLeft, tTop);
                        yoo = this.getFixedCoords(bLeft, bTop);
                        this.val = {
                            tLeft: (coo.left / cellWidth).toFixed(0),
                            tTop: (coo.top / cellWidth).toFixed(0),
                            bLeft: (yoo.left / cellWidth).toFixed(0),
                            bTop: (yoo.top / cellWidth).toFixed(0)
                        };
                    }
                    this.marks = marked;
                }
                this.marked = !!avail.length;
            },

            getStyle(style) {
                let {left, top, width, height, detail: {left: oLeft, top: oTop}} = style;
                return {
                    left: (left - oLeft) + 'px',
                    top: (top - oTop) + 'px',
                    width: width + 'px',
                    height: height + 'px'
                }
            },

            getArea({x, y, w, h, clientRect}) {
                let itemWidth = w * cellWidth,
                    itemHeight = h * cellWidth,
                    areaWidth = Math.max(Math.max(itemWidth, itemHeight) * 2, 4 * cellWidth),
                    {left = 0, top = 0, width = 0, height = 0} = clientRect,
                    distX = Math.max(Math.min(Math.max(x - left - areaWidth * 0.7, -areaWidth), width), 0),
                    distY = Math.max(Math.min(Math.max(y - top - areaWidth * 0.7, -areaWidth), height), 0),
                    cWidth = this.freeDrop ? 1 : cellWidth,
                    xGridIndex = Math.ceil(distX / cWidth),
                    yGridIndex = Math.ceil(distY / cWidth),
                    right, bottom;
                left = Math.floor(xGridIndex * cWidth);
                top = Math.floor(yGridIndex * cWidth);
                return {
                    right: right = Math.floor(Math.max(Math.min(left + areaWidth, width), areaWidth * 0.5)),
                    bottom: bottom = Math.floor(Math.max(Math.min(top + areaWidth, height), areaWidth * 0.5)),
                    left: left = Math.max(left, 0),
                    top: top = Math.max(top, 0),
                    width: right - left,
                    height: bottom - top,
                    viewWidth: width,
                    viewHeight: height,
                    itemWidth,
                    itemHeight
                };
            },

            getFixedCoords(left, top, absolute) {
                let offset = !absolute ? this.viewOffset : null,
                    cWidth = this.freeDrop ? 1 : cellWidth;
                left = +((left - (offset ? offset.left : 0)) / cWidth).toFixed(0);
                top = +((top - (offset ? offset.top : 0)) / cWidth).toFixed(0);
                return {
                    left: Math.floor(left * cWidth),
                    top: Math.floor(top * cWidth)
                }
            },

            getLargestFixedCoords(left, top, z, absolute = true){
                let offset = !absolute ? this.viewOffset : null,
                    cWidth = this.freeDrop ? 1 : cellWidth,
                    fn, pad = (cWidth * 0.3);
                if (z < 0) {
                    fn = Math.floor;
                    left = Math.ceil(left + pad);
                    top = Math.ceil(top + pad);
                } else {
                    fn = Math.ceil;
                    left = Math.floor(left - pad);
                    top = Math.floor(top - pad);
                }
                left = fn((left - (offset ? offset.left : 0)) / cWidth);
                top = fn((top - (offset ? offset.top : 0)) / cWidth);
                return {
                    left: Math.floor(left * cWidth),
                    top: Math.floor(top * cWidth)
                }
            },

            setCoordsMap(selection) {
                let maps = this.coordsMap,
                    selectionMaps = selection.maps,
                    coo;
                if (selectionMaps && selectionMaps.length) {
                    while (coo = selectionMaps.pop()) {
                        delete maps[`${coo.left},${coo.top}`];
                    }
                }
                selection.maps = this.getMappedCoords(selection, true, true);
            },

            getMappedCoords(selection, absolute = true, mapped) {
                let {left, top, width, height} = selection,
                    maps = this.coordsMap,
                    coords = [], coo;
                for (let i = 0, x, y; (x = left + i * cellWidth) < left + width - 2; i++) {
                    for (let j = 0; (y = top + j * cellWidth) < top + height - 2; j++) {
                        coords.push(coo = this.getFixedCoords(x, y, absolute));
                        if (mapped) {
                            maps[`${coo.left},${coo.top}`] = selection;
                        }
                    }
                }
                return coords;
            },

            isCoordsMaped(x, y) {
                if (this.freeDrop) {
                    return false;
                }
                let selection = this.getCoordsSelection(x, y);
                return selection ? !selection.changing : false;
            },

            getCoordsSelection(x, y) {
                let map = this.coordsMap;
                return map[`${x},${y}`]
                    || map[`${x + 1},${y}`]
                    || map[`${x},${y + 1}`]
                    || map[`${x + 1},${y + 1}`]
                    || map[`${x - 1},${y}`]
                    || map[`${x},${y - 1}`]
                    || map[`${x - 1},${y - 1}`]
                    || null;
            },

            getMarkedArea(detail) {
                let {left, top, itemWidth, itemHeight, width, height} = detail,
                    xVectorAvail = [], xVectorAvoid = [], yVectorAvail, yVectorAvoid,
                    x, y, coo, area;
                for (let j = 0; (y = top + j * cellWidth) < top + height; j++) {
                    xVectorAvail[j] = yVectorAvail = [];
                    xVectorAvoid[j] = yVectorAvoid = [];
                    for (let i = 0; (x = left + i * cellWidth) < left + width; i++) {
                        area = {
                            left: x,
                            top: y,
                            right: x + cellWidth,
                            bottom: y + cellWidth
                        };
                        coo = this.getFixedCoords(x, y);
                        if (this.isCoordsMaped(coo.left, coo.top)) {
                            yVectorAvoid[i] = area;
                            yVectorAvail[i] = null;
                        } else {
                            yVectorAvoid[i] = null;
                            yVectorAvail[i] = area;
                        }
                    }
                }
                let map = (area) => {
                        area.detail = detail;
                        let {left, top, right, bottom} = area,
                            xoo = this.getFixedCoords(left, top, true),
                            yoo = this.getFixedCoords(right, bottom, true);
                        area.left = xoo.left;
                        area.top = xoo.top;
                        area.right = yoo.left;
                        area.bottom = yoo.top;
                        area.key = Math.floor(Math.random() * 10e5);
                        return area;
                    }, avail = this.mergeArea(xVectorAvail, {
                        width: itemWidth, height: itemHeight
                    }, map),
                    avoid = this.mergeArea(xVectorAvoid, null, map);
                return {
                    avail,
                    avoid
                };
            },

            mergeArea(xVector, rect, map) {

                let width, height;
                if (rect) {
                    width = rect.width;
                    height = rect.height;
                }

                if (rect
                    && (width !== height
                    || (width === height
                    && width === cellWidth))) {

                    // 非对称或单格匹配
                    for (let j = 0, yVector; j < xVector.length; j++) {

                        yVector = xVector[j];

                        for (let i = 0, cell; i < yVector.length; i++) {

                            cell = yVector[i];
                            if (!cell) {
                                continue;
                            }

                            let merged;

                            if (cell.right - cell.left >= width) {
                                // 只需要一个单位的宽度的情况
                                for (let m = j; m < xVector.length; m++) {
                                    if (!(merged = xVector[m][i])) {
                                        break;
                                    }
                                    // 匹配高度
                                    if (merged.bottom - cell.top >= height) {
                                        return [map({
                                            left: cell.left,
                                            right: merged.right,
                                            top: cell.top,
                                            bottom: merged.bottom,
                                            width: width,
                                            height: height
                                        })];
                                    }
                                }
                                continue;
                            }

                            let skip = false,
                                w = i + 1;

                            for (; w < yVector.length; w++) {
                                if (!xVector[j][w]) {
                                    // 右侧不满足
                                    skip = true;
                                    break;
                                }
                                if ((merged = xVector[j][w]).right - xVector[j][i].left >= width) {
                                    if (cell.bottom - cell.top >= height) {
                                        // 高度已经满足
                                        return [map({
                                            left: cell.left,
                                            right: merged.right,
                                            top: cell.top,
                                            bottom: merged.bottom,
                                            width: width,
                                            height: height
                                        })];
                                    }
                                    // 宽度满足，匹配高度
                                    for (let m = j + 1; m < xVector.length; m++) {
                                        // 行
                                        for (let n = i; n <= w; n++) {
                                            // 列
                                            if (!xVector[m][n]) {
                                                // 不满足
                                                skip = true;
                                                break;
                                            }
                                            if (n === w && (merged = xVector[m][n]).bottom - cell.top >= height) {
                                                // 匹配结束
                                                return [map({
                                                    left: cell.left,
                                                    right: merged.right,
                                                    top: cell.top,
                                                    bottom: merged.bottom,
                                                    width: width,
                                                    height: height
                                                })];
                                            }
                                        }
                                        if (skip) {
                                            break;
                                        }
                                    }
                                }

                                if (skip) {
                                    break;
                                }

                            }

                        }
                    }
                } else {
                    // 对角线合并优先
                    for (let j = 0, yVector; j < xVector.length; j++) {
                        yVector = xVector[j];
                        for (let i = 0, cell; i < yVector.length; i++) {
                            cell = yVector[i];
                            if (!cell) {
                                continue;
                            }
                            let skip = false,
                                k = j + 1,
                                w = i + 1,
                                merged;
                            for (; k < xVector.length && w < yVector.length; k++, w++) {
                                if (!xVector[k][w]) {
                                    // 对角顶点不满足
                                    skip = true;
                                    break;
                                }
                                for (let n = i; n < w; n++) {
                                    // 查找行
                                    if (!xVector[k][n]) {
                                        // 行不满足
                                        skip = true;
                                        break;
                                    }
                                }
                                if (!skip) {
                                    for (let m = j; m < k; m++) {
                                        // 查找列
                                        if (!xVector[m][w]) {
                                            // 列不满足
                                            skip = true;
                                            break;
                                        }
                                    }
                                }
                                if (!skip) {
                                    // 行列满足
                                    // 删除待合并项
                                    for (let n = i; n < w; n++) {
                                        // 删除行
                                        xVector[k][n] = null;
                                    }
                                    for (let m = j; m < k; m++) {
                                        // 删除列
                                        xVector[m][w] = null;
                                    }
                                    // 记录并删除对角点
                                    merged = xVector[k][w];
                                    xVector[k][w] = null;

                                    if (rect) {
                                        // 判定区域宽高是否已经满足
                                        if (merged.right - cell.left >= width
                                            && merged.bottom - cell.top >= height) {
                                            return [map({
                                                left: cell.left,
                                                right: merged.right,
                                                top: cell.top,
                                                bottom: merged.bottom,
                                                width: width,
                                                height: height
                                            })];
                                        }
                                    } else {
                                        // 优先合并策略
                                        cell.right = merged.right;
                                        cell.bottom = merged.bottom;
                                    }

                                } else {
                                    break;
                                }

                            }
                            // 对角匹配查找结束
                            if (!skip && merged) {
                                // 满足合并条件
                                // 合并项目
                                cell.right = merged.right;
                                cell.bottom = merged.bottom;
                            }
                        }
                    }

                }

                // 没有匹配到满足宽高的区域
                if (rect) {
                    return [];
                }
                // 处理合并结果
                let res = [], merged;
                for (let j = 0, yVector; j < xVector.length; j++) {
                    yVector = xVector[j];
                    for (let i = 0, cell; i < yVector.length; i++) {
                        if (cell = yVector[i]) {
                            // 再次合并单个零散的小格子

                            for (let w = i + 1; w < yVector.length; w++) {
                                if (merged = xVector[j][w]) {
                                    if ((cell.right === merged.left)
                                        && (cell.top === merged.top)
                                        && (cell.bottom === merged.bottom)) {
                                        // 合并右侧格子
                                        cell.right = merged.right;
                                        xVector[j][w] = null;
                                    }
                                }
                            }

                            for (let k = j + 1; k < xVector.length; k++) {
                                if (merged = xVector[k][i]) {
                                    if ((cell.bottom === merged.top)
                                        && (cell.left === merged.left)
                                        && (cell.right === merged.right)) {
                                        // 合并下方格子
                                        cell.bottom = merged.bottom;
                                        xVector[k][i] = null;
                                    }
                                }
                            }

                            cell.width = cell.right - cell.left;
                            cell.height = cell.bottom - cell.top;
                            res.push(map(cell));
                        }
                    }
                }
                return res;
            }
        }

    }

</script>


<style lang="scss" scoped>

    .grid {
        width: 100%;
        height: 100%;
        left: 0;
        top: 0;
        position: absolute;
        overflow: hidden;

        &.line {

            &.one {
                background: url("../asserts/img/page/bg-grid@10.svg") repeat 0 0;
            }

            &.two {
                background: url("../asserts/img/page/bg-grid@20.svg") repeat 0 0;
            }

            &.three {
                background: url("../asserts/img/page/bg-grid@30.svg") repeat 0 0;
            }

        }
    }

    .v-line, .h-line, .v-label, .h-label {
        position: absolute;
        left: 0;
        top: 0;
    }

    .v-line {
        width: 1px;
        height: 100%;
    }

    .h-line {
        width: 100%;
        height: 1px;
    }

    .v-label, .h-label {
        padding: 5px;
        color: #212121;
        font-size: 12px;
    }

    .area {
        position: absolute;
        z-index: 1;
        left: 0;
        top: 0;
        opacity: .3;
        overflow: hidden;
    }

    .avail, .avoid {
        position: absolute;
        opacity: 0.8;

        &.animated {

            &.flash {

                animation-duration: 2s;
                animation-delay: 150ms;

            }

        }

        &.static {

            transition: left .05s, top .05s;

            &.avail {
                background-color: rgba(green, .3);
            }

            &.avoid {
                background-color: rgba(red, .3);
            }

        }

    }

    .avail {
        background-color: green;
    }

    .avoid {
        background-color: red;
    }

    .shadow-wrap {

        position: absolute;
        left: 0;
        top: 0;
        border: 1px solid #64b5f6;
        background-color: rgba(#64b5f6, .2);
        box-sizing: border-box;

        &.avoid {
            border: 1px solid rgba(red, .5);
            background-color: rgba(red, .3);

            .shadow {
                border: 1px solid rgba(red, .3);
            }

            .count {
                background: #ce4444;
            }
        }

        .shadow {
            position: absolute;
            left: 0;
            top: 0;
            width: 64px;
            height: 64px;
            border: 1px solid rgba(#64b5f6, .35);
            box-sizing: border-box;

            &.animated {
                animation-duration: 2s;
            }
        }

        .count {
            position: absolute;
            z-index: 10;
            left: 50%;
            top: 50%;
            background: #428cc0;
            color: #fff;
            font-weight: bold;
            padding: 3px 4px;
            border: 1px solid #fff;
            transform: translate(-50%, -50%);
            font-size: 14px;
            line-height: 1em;
        }

        .copy {
            position: absolute;
            bottom: 0;
            right: 0;
            border: 1px solid #fff;
            border-radius: 3px;
            text-align: center;
            padding: 1px 4px;
            font-size: 12px;
            color: #5896cc;
            background-color: #f5f5f5;
            transform: translateY(110%);
            letter-spacing: 1px;
        }

    }


</style>