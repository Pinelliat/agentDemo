<template>

    <div class="selection"
         ref="box"
         @mousedown="mouseDown"
         @mouseup="mouseUp"
         @contextmenu.stop.prevent="onContextMenu"
    >
        <div v-show="showSelection">
            <span v-show="showArea" class="selection-area"
                  :style="area"
                  draggable="false"
            ></span>
            <span v-for="item in offsetSelectedItems"
                  class="selection-item"
                  :style="item"
                  draggable="false"
            ><i :class="['bg-color', {'animated flash infinite':flash&&item.flash}]"
                :id="'sel_' + item.id"></i></span>
        </div>

        <Popup ref="popup" :display="'none'">

            <div class="app-form">
                <template v-if="editTransform">

                    <div class="form-item" v-for="item in editTransform">
                        <label class="v-ctr">{{item.text}}</label>
                        <input :class="['input', {error:item.error}]"
                               v-model.number.trim="item.value"
                               @keydown="inputKeyDown($event,item)"
                               @input="inputKeyDown($event,item)"
                               @mousedown="showSelect($event,item)"
                               :style="{width: (item.span===2?'160px':'57px'),height:'30px'}"/>
                        <Popup ref="attrSelect" v-if="item.type==='select'" :arrow="false"
                               :display="'none'">
                            <ul class="context-menu">
                                <li v-for="option in item.items"
                                    :class="['menu-item', {hover:option.value==item.value}]"
                                    @click="selectAttr(item, option.value)"
                                >
                                    <span v-if="option.icon" class="menu-icon" v-html="option.icon"></span>
                                    <span class="menu-txt">{{option.text}}</span>
                                </li>
                            </ul>
                        </Popup>
                    </div>
                </template>
                <template v-if="editAttributes">

                    <div class="form-item" v-for="item in editAttributes">
                        <label :class="{'v-ctr':item.type!=='textarea'}">{{item.text}}</label>
                        <textarea v-if="item.type==='textarea'"
                                  :class="['input', {error:item.error}]"
                                  v-model.trim="item.value"
                                  style="width: 160px;height: 90px;"></textarea>
                        <input v-else :class="['input', {error:item.error}]"
                               v-model.trim="item.value"
                               :style="{width: (item.span===2?'160px':'57px'),height:'30px'}"/>
                    </div>

                </template>

                <div class="app-button-bar">
                    <button class="primary" @click.stop="setAttr">确定</button>
                </div>

            </div>

        </Popup>

        <Popup ref="contextMenu" :arrow="false" :display="'none'">
            <ul class="context-menu">
                <li class="menu-item" v-for="item in contextMenu"
                    @click="contextMenuClick(item)"
                >
                    <span :class="['menu-icon', {checked:item.checked}]"></span>
                    <span class="menu-txt">{{item.text}}</span>
                </li>
            </ul>
        </Popup>

        <slot></slot>

    </div>

</template>

<script>

    import _ from 'lodash';
    import bus from '../commons/bus';
    import Drag from '../commons/drag';

    import {mapState} from 'vuex';
    import Popup from './Popup.vue';

    export default {

        name: 'Selection',

        components: {Popup},

        props: {
            flash: {
                type: Boolean,
                default: true
            },
            dragDisabled: {
                type: Boolean,
                default: false
            },
            contextMenu: {
                type: Array,
                default: () => []
            },
            editable: {
                type: Boolean,
                default: true
            }
        },

        data() {
            return {
                area: {},
                showSelection: false,
                showArea: false,
                selectedItems: [],
                moving: false,
                selectionStyle: {},
                editTransform: null,
                editAttributes: null,
                attrSelectTarget: null
            }
        },

        watch: {
            attrSelectTarget(target) {
                let select = this.$refs.attrSelect;
                if (Array.isArray(select)) {
                    select = select[0];
                }
                if (select) {
                    if (target) {
                        select.show(target);
                    } else {
                        select.hide();
                    }
                }
            }
        },

        computed: {

            ...mapState({
                structsMap: state => state.structsMap,
                structsList: state => state.structsList,
                viewOffset: state => state.viewOffset
            }),

            offsetSelectedItems() {
                if (!this.showSelection) {
                    return [];
                }
                let items = this.selectedItems || [],
                    {left, top} = this.viewOffset,
                    length = items.length, item,
                    moving = this.moving,
                    res = [], i = 0;
                while (i < length) {
                    item = items[i++];
                    res.push({
                        id: item.id,
                        left: (item.left + left) + 'px',
                        top: (item.top + top) + 'px',
                        width: item.width + 'px',
                        height: item.height + 'px',
                        flash: moving
                    });
                }
                return res;
            }

        },

        mounted() {

            this.popup = this.$refs.popup;
            this.contextMenuPopup = this.$refs.contextMenu;

            this.dragger = new Drag({
                handler: this.$refs.box,
                cursor: 'default',
                onReady: ({event}) => {
                    if (!this.movable && event.ctrlKey) {
                        document.body.style.cursor = 'move';
                        this.showSelection = false;
                    }
                },
                onStart: (detail) => {
                    let event = detail.event;
                    if (this.movable && !this.dragDisabled) {
                        this.moving = true;
                        this.showArea = false;
                        bus.$emit('positionChangeStart', {detail, items: this.selectedItems});
                    } else if (!this.editable || event.ctrlKey || event.button == 2) {
                        document.body.style.cursor = 'move';
                        let {left, top} = this.viewOffset;
                        if (!this.editable) {
                            this.showSelection = false;
                        }
                        this.changeOffset = {left, top};
                    } else {
                        this.showArea = this.showSelection = true;
                        this.dragging = true;
                    }
                },
                onDrag: (detail) => {
                    if (this.moving && !this.dragDisabled) {
                        this.move(detail);
                    } else if (this.changeOffset) {
                        let {left, top} = this.changeOffset,
                            {coords: {delta: {x, y}}} = detail;
                        bus.$emit('viewOffsetChange', {left: left + x, top: top + y, animate: true});
                    } else {
                        let {coords: {current, start}} = detail,
                            {width: bWidth, height: bHeight, left: bLeft, top: bTop} = this.getClientRect(),
                            left, top, width, height,
                            items = this.structsList;
                        this.area = {
                            left: (left = Math.max(Math.min(start.x, current.x) - bLeft, 0)) + 'px',
                            top: (top = Math.max(Math.min(start.y, current.y) - bTop, 0)) + 'px',
                            width: (width = Math.abs((current.x < start.x ? Math.max(current.x, bLeft) : Math.min(current.x, bWidth + bLeft)) - start.x)) + 'px',
                            height: (height = Math.abs((current.y < start.y ? Math.max(current.y, bTop) : Math.min(current.y, bHeight + bTop)) - start.y)) + 'px'
                        };
                        if (items && items.length) {
                            this.select(left, top, width, height);
                        }
                    }
                },
                onEnd: (detail) => {
                    this.showArea = this.dragging = false;
                    if (this.moving && !this.dragDisabled) {
                        this.moving = false;
                        bus.$emit('positionChangeEnd', {detail, items: this.selectedItems});
                    } else if (this.changeOffset) {
                        this.changeOffset = null;
                        document.body.style.cursor = '';
                    }
                },
                onCancel: (detail) => {
                    this.showArea = this.dragging = false;
                    if (this.moving && !this.dragDisabled) {
                        this.moving = false;
                        bus.$emit('positionChangeCancel', {detail, items: this.selectedItems});
                    } else if (this.changeOffset) {
                        this.changeOffset = null;
                        document.body.style.cursor = '';
                    }
                }
            });

            bus.$on('reset', () => {
                this.selectedItems = [];
                this.showSelection = this.showArea = false;
            }).$on('refresh', () => {
                this.refresh();
            }).$on('focusSelection', (coords) => {
                bus.$emit('focusViewBox', this.getViewBox(coords));
                this.popup.hide();
            }).$on('zoom', (out) => {
                if (this.isZoomable()) {
                    this.zoomToItem(out);
                }
                this.popup.hide();
            }).$on('zoomInToPoint', (coords, event) => {
                if (this.isZoomable(event.target)) {
                    this.zoomToPoint(coords, false);
                }
                this.popup.hide();
            }).$on('zoomOutToPoint', (coords, event) => {
                if (this.isZoomable(event.target)) {
                    this.zoomToPoint(coords, true);
                }
                this.popup.hide();
            }).$on('onkeydown', event => {
                if (event.ctrlKey && event.keyCode == 65 && !this.allSelected) {
                    this.selectAll();
                    if (event.preventDefault) {
                        event.preventDefault();
                    } else {
                        event.returnValue = false;
                        return false;
                    }
                }
            }).$on('onkeyup', () => {
                if (this.allSelected) {
                    this.allSelected = false;
                }
            }).$on('newSelectionMade', items => {
                this.refresh(items);
            }).$on('packageOpened', () => {
                this.refresh([]);
                this.showSelection = false;
            });

        },

        methods: {

            isZoomable(target) {
                if (this.structsList.length) {
                    let box = this.$refs.box;
                    return target ? (box === target || box.contains(target)) : true;
                }
                return false;
            },

            refresh(list) {
                this.showArea = false;
                let items = list || this.selectedItems || [],
                    itemsMap = this.structsMap,
                    item, elemItem;
                for (let i = 0, len = items.length; i < len; i++) {
                    item = items[i];
                    if (elemItem = itemsMap[item.id]) {
                        item.left = elemItem.left;
                        item.top = elemItem.top;
                        item.width = elemItem.width;
                        item.height = elemItem.height;
                    }
                }
                if (list === items) {
                    this.selectedItems = items;
                }
                if (items.length) {
                    this.showSelection = true;
                }
                this.popup.hide();
                this.contextMenuPopup.hide();
            },

            getClientRect() {
                let box = this.$refs.box;
                return box ? box.getBoundingClientRect() : {};
            },

            getViewBox(coords, selection) {
                let items = selection || (this.showSelection ? this.selectedItems || [] : []) || [],
                    len = items.length,
                    rect = this.getClientRect(),
                    boundingRect,
                    item, left, top, width, height;

                if (coords) {

                    coords = this.getPointByCoords(coords.x, coords.y);

                    boundingRect = {
                        left: coords.left,
                        top: coords.top,
                        right: coords.left + 100,
                        bottom: coords.top + 100
                    };

                } else {
                    if (!len) {
                        items = this.structsList;
                        len = items.length;
                    }

                    if (len) {
                        boundingRect = {
                            left: Infinity,
                            top: Infinity,
                            right: -Infinity,
                            bottom: -Infinity
                        };
                        for (let i = 0; i < len; i++) {
                            item = items[i];
                            left = item.left;
                            top = item.top;
                            width = item.width;
                            height = item.height;
                            boundingRect.left = Math.min(boundingRect.left, left);
                            boundingRect.top = Math.min(boundingRect.top, top);
                            boundingRect.right = Math.max(boundingRect.right, left + width);
                            boundingRect.bottom = Math.max(boundingRect.bottom, top + height);
                        }
                    } else {
                        boundingRect = {
                            left: 0,
                            top: 0,
                            right: rect.width,
                            bottom: rect.height
                        };
                    }
                }

                boundingRect.width = boundingRect.right - boundingRect.left;
                boundingRect.height = boundingRect.bottom - boundingRect.top;
                boundingRect.viewWidth = rect.width;
                boundingRect.viewHeight = rect.height;
                return boundingRect;
            },

            getElementByPoint(x, y) {
                let items = this.structsList, left, top, coo;
                coo = this.getPointByCoords(x, y);
                x = coo.left;
                y = coo.top;
                for (let i = 0, len = items.length, item; i < len; i++) {
                    item = items[i];
                    left = item.left;
                    top = item.top;
                    if (x > left
                        && y > top
                        && x < left + item.width
                        && y < top + item.height
                    ) {
                        return item;
                    }
                }
                return null;
            },

            getPointByCoords(x, y) {
                let {left: oLeft, top: oTop} = this.viewOffset,
                    clientRect = this.getClientRect();
                x -= (oLeft + clientRect.left);
                y -= (oTop + clientRect.top);
                return {
                    left: x,
                    top: y
                };
            },

            zoomToPoint({x, y}, out) {
                let point = this.getPointByCoords(x, y),
                    {width: viewWidth, height: viewHeight} = this.getClientRect();
                bus.$emit('focusViewBox', {
                    left: point.left - 50,
                    top: point.top - 50,
                    right: point.left + 50,
                    bottom: point.top + 50,
                    viewWidth,
                    viewHeight,
                    width: 100,
                    height: 100
                }, out ? -1 : 1);
            },

            zoomToItem(out)  {
                if (this.showSelection) {
                    let items = this.selectedItems || [];
                    if (items.length) {
                        bus.$emit('focusViewBox', this.getViewBox(), out ? -1 : 1);
                        return;
                    }
                }
                bus.$emit(out ? 'zoomOut' : 'zoomIn');
            },

            onContextMenu(event) {
                let target = event.target,
                    popup = this.popup,
                    id = target.id, item,
                    {clientX, clientY} = event,
                    {x, y} = this.mouseDownCoordinates || {};
                if ((x !== clientX || y !== clientY) || popup.$el.contains(target)) {
                    return;
                }
                if (this.editable) {
                    if (!id) {
                        item = this.getElementByPoint(event.clientX, event.clientY);
                        if (item) {
                            id = item.id;
                        }
                    }
                    if (id && /^sel_.+/.test(id)) {
                        id = id.replace(/^sel_/, '');
                    }
                    if (item = this.structsMap[id]) {
                        let attr, hasTransform, hasAttributes;
                        this.selectedItems = [{
                            left: item.left,
                            top: item.top,
                            width: item.width,
                            height: item.height,
                            id: item.id
                        }];
                        this.editTransform = (attr = _.cloneDeep(item.transform)) ? attr.map(item => {
                            item.error = false;
                            hasTransform = true;
                            return item;
                        }) : null;
                        this.editAttributes = (attr = _.cloneDeep(item.attributes)) ? attr.map(item => {
                            item.error = false;
                            hasAttributes = true;
                            return item;
                        }) : null;
                        if (hasTransform || hasAttributes) {
                            this.editItem = item;
                            popup.show(item.element.node);
                        } else {
                            this.editItem = null;
                        }
                        return;
                    }
                }
                if (this.contextMenu.length) {
                    this.contextMenuPopup.show({
                        left: event.clientX,
                        top: event.clientY,
                        width: 1,
                        height: 1,
                        margin: 0
                    });
                }
            },

            contextMenuClick(item) {
                bus.$emit('contextMenu', {
                    name: item.value,
                    value: !item.checked
                });
                this.contextMenuPopup.hide();
            },

            setAttr() {
                let transform = this.editTransform,
                    attributes = this.editAttributes,
                    item = this.editItem,
                    changed = {},
                    detail = {},
                    length, attr, val;
                if (item) {
                    if (transform) {
                        length = transform.length;
                        while (attr = transform[--length]) {
                            if (!attr.type || attr.type === 'number') {
                                if (!isNaN(val = +attr.value)) {
                                    changed[attr.name] = val;
                                    detail[attr.name] = attr;
                                }
                            } else if (val = attr.value) {
                                changed[attr.name] = val;
                                detail[attr.name] = attr;
                            }
                        }
                    }
                    if (attributes) {
                        length = attributes.length;
                        while (attr = attributes[--length]) {
                            changed[attr.name] = attr.value;
                            detail[attr.name] = attr;
                        }
                    }
                    bus.$once('attrValidation', (valid, detail) => {
                        if (valid) {
                            item.transform = transform;
                            item.attributes = attributes;
                            this.popup.hide();
                        } else if (detail) {
                            let {msg, key} = detail;
                            new (Vue.component('AgentAppTips'))({
                                data: {
                                    content: msg,
                                    icon: 'fail',
                                    duration: 3000
                                }
                            });
                            ((transform || []).concat(attributes || [])).forEach(item => {
                                item.error = item.name === key;
                            });
                        }
                    }).$emit('changeProps', item, changed, detail);
                } else {
                    this.popup.hide();
                }
            },

            mouseDown(event) {
                let target = event.target,
                    id = target.id,
                    maps = this.structsMap,
                    dragger = this.dragger,
                    items = this.selectedItems,
                    popup = this.popup,
                    editable = this.editable,
                    button = event.button,
                    struct, remove, append;
                this.mouseDownCoordinates = {
                    x: event.clientX,
                    y: event.clientY
                };
                this.contextMenuPopup.hide();
                if (target !== this.attrSelectTarget) {
                    this.attrSelectTarget = null;
                }
                if (popup.$el.contains(target)) {
                    return;
                }
                popup.hide();
                this.allSelected = false;
                if (!button || button == 0) {
                    if (!id) {
                        target = this.getElementByPoint(event.clientX, event.clientY);
                        if (target) {
                            id = target.id;
                        }
                    }
                    if (id && /^sel_.+/.test(id)) {
                        id = id.replace(/^sel_/, '');
                        remove = event.ctrlKey;
                    } else {
                        append = event.ctrlKey;
                    }
                    if (struct = maps[id]) {
                        if (!editable) {
                            if (event.type !== 'mouseup') {
                                if (struct.code) {
                                    let {selection: {left, top, width, height}} = struct,
                                        item = {
                                            id,
                                            left, top,
                                            width, height
                                        };
                                    this.movable = false;
                                    dragger.start(event);
                                    this.selectedItems = [item];
                                    this.showSelection = true;
                                    bus.$emit('itemSelected', item);
                                } else {
                                    this.movable = false;
                                    dragger.start(event);
                                }
                            }
                            return;
                        }
                        if ((items.length > 1 || event.ctrlKey) && event.type !== 'mouseup') {
                            this.movable = true;
                            dragger.start(event);
                            return;
                        }
                        let {selection: {left, top, width, height}} = struct,
                            item = !remove ? {
                                id,
                                left, top,
                                width, height
                            } : null;
                        if (append) {
                            items.push(item);
                        } else if (remove) {
                            let i = items.length;
                            while (i--) {
                                if (items[i].id === id) {
                                    items.splice(i, 1);
                                }
                            }
                        } else {
                            this.selectedItems = [item];
                            if (event.type !== 'mouseup') {
                                bus.$emit('itemSelected', item);
                            }
                        }
                        this.showSelection = true;
                        if (dragger && event.type !== 'mouseup' && this.selectedItems.length) {
                            this.movable = true;
                            dragger.start(event);
                        }
                    } else {
                        this.movable = false;
                        dragger.start(event);
                    }
                } else if (!editable || button == 2) {
                    this.movable = false;
                    dragger.start(event);
                }
            },

            mouseUp(event) {
                if (this.dragging && !event.ctrlKey || this.popup.$el.contains(event.target)) {
                    return;
                }
                let coordinates = this.mouseDownCoordinates || {};
                if (Math.abs(coordinates.x - event.clientX) > 1 || Math.abs(coordinates.y - event.clientY) > 1) {
                    return;
                }
                if (this.movable) {
                    this.movable = false;
                    return this.mouseDown(event);
                }

                if (event.ctrlKey) {
                    return;
                }

                let {target: {id}} = event,
                    maps = this.structsMap;
                if (id && /^sel_.+/.test(id)) {
                    id = id.replace(/^sel_/, '');
                }
                if (!maps[id]) {
                    this.selectedItems = [];
                    this.showArea = false;
                }
            },

            inputKeyDown(event, item) {
                if (item.type === 'select') {
                    return;
                }
                let keyCode = event.keyCode,
                    target = event.target,
                    value = target.value,
                    name = item.name,
                    max = item.max || 6;
                if (event.type === 'input') {
                    if (!value) {
                        item.value = '';
                    } else {
                        item.value = Math.min(value.replace(/[^.\d]/g, ''), name === 'angle' ? 360 : name === 'radian' ? 6.29 : max);
                        if (name === 'radian') {
                            item.value = item.value.toFixed(2);
                        } else if (name !== 'angle') {
                            item.value = Math.max(item.value, 1);
                        }
                    }
                } else if (keyCode != 8 && !(keyCode > 47 && keyCode < 58) && !(keyCode > 95 && keyCode < 106)) {
                    if (keyCode < 41 && keyCode > 36) {
                        let step = name === 'angle' ? 10 : name === 'radian' ? 0.1 : 1;
                        if (keyCode == 38) {
                            item.value = Math.max((+value || 0) + step, 0);
                            event.preventDefault();
                        } else if (keyCode == 40) {
                            item.value = Math.max((+value || 0) - step, 0);
                            event.preventDefault();
                        } else if (keyCode == 37 || keyCode == 39) {
                            return;
                        }
                        item.value = Math.min(item.value, name === 'angle' ? 360 : name === 'radian' ? 6.29 : max);
                        if (name === 'radian') {
                            item.value = item.value.toFixed(2);
                        } else if (name !== 'angle' && target.value) {
                            item.value = Math.max(item.value, 1);
                        }
                    } else {
                        if ((keyCode == 110 || keyCode == 190) && !event.shiftKey) {
                            if (name === 'radian' && target.value.indexOf('.') === -1) {
                                return;
                            }
                        }
                        if (event.preventDefault) {
                            event.preventDefault();
                        } else {
                            event.returnValue = false;
                        }
                    }
                }
            },

            selectAttr(item, value) {
                item.value = value;
                this.attrSelectTarget = null;
            },

            showSelect(event, item) {
                if (item.type === 'select') {
                    this.attrSelectTarget = event.target;
                }
            },

            select: _.throttle(function (aLeft, aTop, aWidth, aHeight) {
                let {left: oLeft, top: oTop} = this.viewOffset;
                aLeft -= oLeft;
                aTop -= oTop;
                let selectedItems = [],
                    aRight = aLeft + aWidth,
                    aBottom = aTop + aHeight,
                    items = this.structsList,
                    length = items.length,
                    pad = 12,
                    left, top, bottom, right, width, height,
                    appear, item;
                while (length--) {
                    appear = false;
                    item = items[length];
                    left = item.left;
                    top = item.top;
                    width = item.width;
                    height = item.height;
                    right = left + width;
                    bottom = top + height;
                    if ((aTop < top && aBottom - top > pad)
                        || (aBottom > bottom && bottom - aTop > pad)
                        || (aTop > top && aBottom < bottom)) {
                        appear = (aLeft < left && aRight - left > pad)
                            || (aRight > right && right - aLeft > pad)
                            || (aLeft > left && aRight < right);
                    }
                    if (appear) {
                        selectedItems.push({
                            id: item.id,
                            left, top,
                            width, height
                        });
                    }
                }
                this.selectedItems = selectedItems;
            }, 60),

            selectAll() {
                let items = this.structsList;
                if (this.selectedItems.length !== items.length) {
                    let len = items.length,
                        selectedItems = [],
                        i = 0, item;
                    while (i < len) {
                        item = items[i++];
                        selectedItems.push({
                            id: item.id,
                            left: item.left,
                            top: item.top,
                            width: item.width,
                            height: item.height
                        });
                    }
                    this.selectedItems = selectedItems;
                }
                this.allSelected = this.showSelection = true;
            },

            move(detail) {
                bus.$emit('positionChanging', {detail, items: this.selectedItems});
            }

        }

    }

</script>

<style lang="scss" scoped>

    .selection {
        width: 100%;
        height: 100%;
        position: absolute;
        left: 0;
        top: 0;
        z-index: 100;
    }

    .selection-area, .selection-item {
        z-index: 1;
        position: absolute;
        box-sizing: border-box;
    }

    .selection-area {
        border: 1px solid #64b5f6;
        background-color: rgba(#64b5f6, .35);
    }

    .selection-item {
        border: 2px solid #64b5f6;

        .bg-color {
            background-color: rgba(#64b5f6, .15);
            display: block;
            width: 100%;
            height: 100%;

            &.animated {
                background-color: rgba(#64b5f6, .4);
            }
        }

    }

    .context-menu {
        margin: 0;
        padding: 0;
        list-style: none;
        font-size: 14px;

        .menu-item {
            margin: 0;
            padding: 6px 15px 6px 6px;
            cursor: pointer;

            &:hover, &.hover {
                background: #ebebeb;
            }

            &:before {
                content: '';
                display: inline-block;
                width: 0;
                height: 100%;
                vertical-align: middle;
            }

            .menu-icon {
                display: inline-block;
                width: 16px;
                height: 16px;
                margin-right: 4px;
                margin-left: 4px;
                vertical-align: middle;

                &.checked {
                    background: url("../asserts/img/page/ico-checked.png") no-repeat center;
                }
            }

            .menu-txt {
                display: inline-block;
                vertical-align: middle;
                color: #000;
                overflow: hidden;
                max-width: 150px;
                text-overflow: ellipsis;
                white-space: nowrap;
                word-break: keep-all;
            }

        }

    }

    .app-form {

        padding: 20px 20px 0 0;
        max-width: 230px;
        box-sizing: border-box;

        &:after {
            content: '';
            display: block;
            width: 0;
            clear: both;
        }

        .input.error {
            border-color: red;
        }

        .form-item, .app-button-bar {
            float: left;
            margin-bottom: 15px;
        }

        .app-button-bar {
            clear: both;
            text-align: right;
            margin: 0 0 20px 47px;
        }

        label {
            width: 40px;
            padding-right: 2px;
            margin: 0;
            text-align: right;
        }
    }

</style>