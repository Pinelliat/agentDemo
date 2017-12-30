<template>
    <div id="app-root">
        <Layout :header="appHeader"
                :toolbox="appToolbox"
                :packageName="packageName"
        >

            <Index v-show="index"
                   :editable="editable"
                   slot="main"
            ></Index>
            <LayoutMain v-show="!index"
                        slot="main"
                        :getItemTitle="getItemTitle"
                        :grid="grid"
                        :movable="movable"
                        :freeDrop="appFreeDrop"
                        :gridLine="appGridLine"
                        :gridRuleLine="appGridRuleLine"
                        :gridRuleLineColor="gridRuleLineColor"
                        :gridRuleAreaColor="gridRuleAreaColor"
                        :gridRuleAreaFlash="gridRuleAreaFlash"
                        :zoomAnimationDuration="zoomAnimationDuration"
                        :gridContextMenu="gridContextMenu"
                        :editable="editable"
            ></LayoutMain>

            <LayoutHeader slot="header"
                          :title="title"
                          :buttonBar="headerButtonBar"
                          :backButton="backButton"
                          :saveButton="saveButton"
            ></LayoutHeader>

            <Toolbox v-show="appToolbox" slot="toolbox"
                     :items="structureItems"
                     :imgPath="structureImagePath"
            ></Toolbox>

            <FuncBar v-show="!index" slot="func-bar"
                     :zoomDuration="zoomAnimationDuration"
            ></FuncBar>

        </Layout>

        <ModalMask :hidden="!modalMaskIndex"
                   :zIndex="modalMaskIndex"
        ></ModalMask>

        <Popup :display="confirmDisplay" modal title="提示">
            <div class="app-confirm-wrap">
                <p>场地信息已经变更，是否要保存更新？</p>
                <div class="app-button-bar">
                    <button @click="back">暂不保存</button>
                    <button @click="saveAndBack" class="primary">现在保存</button>
                </div>
            </div>
        </Popup>

    </div>

</template>

<script>

    import Vue from 'vue';
    import Vuex, {mapState, mapMutations} from 'vuex'

    import Layout from '../interface/Layout.vue';
    import LayoutHeader from '../interface/LayoutHeader.vue';
    import Toolbox from '../interface/Toolbox.vue';
    import Index from '../interface/Index.vue';
    import LayoutMain from '../interface/LayoutMain.vue';
    import FuncBar from '../interface/FuncBar.vue';
    import ModalMask from '../interface/ModalMask.vue';
    import Popup from '../interface/Popup.vue';

    import _ from 'lodash';
    import axios from 'axios';

    import bus from '../commons/bus';

    // Vue.use(Vuex);

    class DraftStorage {

        static key = '_CURRENT_AGENT_LAYOUT_DATA_DRAFT_';

        static delay = 5000;

        constructor() {
            this.timestamp = +new Date;
            this.history = DraftStorage.get(true);
            this.packages = null;
        }

        update(state) {
            let now = new Date;
            if (this.timestamp + DraftStorage.delay < +now) {
                let {currentPackage} = state, history = null;
                if (currentPackage) {
                    history = DraftStorage.get();
                    if (history) {
                        for (let i = 0; i < history.length; i++) {
                            if ((history[i]).id === currentPackage.id) {
                                history[i] = DraftStorage.getPackage(state);
                                break;
                            }
                        }
                    } else {
                        history = [];
                        history.push(DraftStorage.getPackage(state));
                    }
                }
                if (history) {
                    DraftStorage.setStorage(history = this.lastUpdateTmp = JSON.stringify(history));
                }
                this.timestamp = +now;
                return history !== this.history;
            }
            return this.lastUpdateTmp !== this.history;
        }

        save(state) {
            let history = DraftStorage.getPackages(state.packages);
            if (this.packages = history) {
                DraftStorage.setStorage(history = JSON.stringify(history));
                this.timestamp = +new Date;
            }
            return history !== this.history;
        }

        isUpdated() {
            return this.history !== DraftStorage.get(true);
        }

        clear() {
            this.history = null;
            try {
                window.localStorage.removeItem(DraftStorage.key);
            } catch (e) {
                console.error(e);
            }
        }

        setHistory(history) {
            this.history = history;
            DraftStorage.setStorage(history);
        }


        static get(str) {
            let val = null, history;
            try {
                history = window.localStorage.getItem(DraftStorage.key);
                val = str ? history : JSON.parse(history);
            } catch (e) {
                val = null;
            }
            return val;
        }

        static getPackages(packages) {
            if (packages) {
                let res = [], pack;
                for (let i = 0, left, top; i < packages.length; i++) {
                    if ((pack = packages[i])) {
                        left = pack.offset.left;
                        top = pack.offset.top;
                        res.push({
                            id: pack.id,
                            name: pack.name,
                            ratio: pack.ratio,
                            items: pack.items.map(item => DraftStorage.getItem(item)),
                            remark: pack.remark,
                            offset: {left, top}
                        });
                    }
                }
                return res;
            }
            return null;
        }

        static getPackage(state) {
            let {structsList: items, currentPackage: {id, name, remark}, viewOffset: {left, top}, ratio} = state;
            return {
                id, name, remark,
                offset: {left, top},
                ratio,
                items: items.map(item => DraftStorage.getItem(item))
            };
        }

        static getItem(item) {
            let {id, name, itemWidth, itemHeight, itemLeft, itemTop, src, color, radian, angle, code, remark, title, left, top, width, height, w, h} = item;
            return {
                id, name, title, src,
                left, top,
                width, height,
                w, h,
                itemWidth: Math.ceil(itemWidth),
                itemHeight: Math.ceil(itemHeight),
                itemLeft: Math.floor(itemLeft),
                itemTop: Math.floor(itemTop),
                color, radian, angle, code, remark
            }
        }

        static setStorage(dataString) {
            try {
                window.localStorage.setItem(DraftStorage.key, dataString);
            } catch (e) {
                console.error(e);
            }
        }
    }

    const storage = new DraftStorage();

    const defaultState = {
        structsMap: {},
        structsList: [],
        packages: [],
        currentPackage: null,
        draft: false,
        viewOffset: {
            left: 0,
            top: 0,
            animate: true
        },
        ratio: 2,
        modalMaskIndex: 0
    };

    let draft = DraftStorage.get();

    if (draft) {
        defaultState.packages = draft;
    }

    const store = new Vuex.Store({
        state: defaultState,
        mutations: {
            showMask(state, index) {
                state.modalMaskIndex = +index || 1000;
            },
            hideMask(state) {
                state.modalMaskIndex = 0;
            },
            addStruct(state, struct) {
                state.structsMap[struct.id] = struct;
                state.structsList.push(struct);
                bus.$emit('addStruct', struct);
                state.draft = storage.update(state);
            },
            removeStruct(state, struct) {
                let id = struct.id,
                    list = state.structsList,
                    length = list.length;
                while (length--) {
                    if (list[length].id === id) {
                        list.splice(length, 1);
                        break;
                    }
                }
                delete state.structsMap[id];
                bus.$emit('removeStruct', struct);
                state.draft = storage.update(state);
            },
            setDraft(state, draft) {
                state.draft = !!draft;
            },
            reset(state) {
                state.draft = storage.save(state);
                clearState(state);
                state.packages = storage.packages;
                bus.$emit('reset');
            },
            setOffset(state, {left, top, animate}) {
                let offset = state.viewOffset;
                if (!isNaN(left = +left)) {
                    offset.left = left;
                }
                if (!isNaN(top = +top)) {
                    offset.top = top;
                }
                if (animate != void 0) {
                    offset.animate = !!animate;
                }
                state.draft = storage.update(state);
            },
            setRatio(state, ratio) {
                state.ratio = ratio;
                if (state.currentPackage) {
                    state.currentPackage.ratio = ratio;
                }
                state.draft = storage.update(state);
            },
            addPackage(state, pack) {
                state.packages.unshift({
                    ...pack,
                    items: [],
                    offset: {left: 0, top: 0},
                    ratio: 2
                });
                state.draft = storage.save(state);
                state.packages = storage.packages;
                bus.$emit('addPackage', pack);
            },
            removePackage(state, pack) {
                let id = pack ? pack.id : '',
                    items = state.packages,
                    deletedItem;
                if (id) {
                    items.forEach((item, index) => {
                        if (item.id === id) {
                            deletedItem = item;
                            items.splice(index, 1);
                        }
                    });
                    state.draft = storage.save(state);
                    state.packages = storage.packages;
                    bus.$emit('removePackage', deletedItem);
                }
            },
            setPackage(state, pack) {
                state.structsList = [];
                state.structsMap = {};
                state.modalMaskIndex = 0;
                state.viewOffset = (pack.offset || {
                    left: 0,
                    top: 0
                });
                state.viewOffset.animate = true;
                state.ratio = pack.ratio || 2;
                bus.$emit('packageOpen', pack.items);
                pack.items = state.structsList;
                pack.offset = state.viewOffset;
                state.currentPackage = pack;
                bus.$once('packageOpened', () => {
                    state.draft = storage.isUpdated();
                });
            },
            setPackages(state, packages) {
                if (Array.isArray(packages)) {
                    state.packages = packages;
                }
            }
        },
        actions: {},
        getters: {}
    });

    function clearState(state) {
        if (state) {
            state.structsList = [];
            state.structsMap = {};
            state.currentPackage = null;
            state.viewOffset = {
                left: 0,
                top: 0,
                animate: true
            };
            state.modalMaskIndex = 0;
            state.draft = false;
            state.ratio = 2;
            state.packages = [];
        }
    }

    const AgentAppPopup = Vue.component('AgentAppPopup', {
        'extends': Popup,
        created() {
            this.$store = store;
            if (!this.$el) {
                let root = document.getElementById('app-root');
                root = (root || document.body).appendChild(document.createElement('div'));
                this.$mount(root);
            }
        }
    });

    Vue.component('AgentAppModal', {
        'extends': AgentAppPopup,
        props: {
            modal: {
                type: Boolean,
                default: true
            },
            animationDuration: {
                type: String,
                default: '300ms'
            }
        }
    });

    Vue.component('AgentAppTips', {
        'extends': AgentAppPopup,
        props: {
            position: {
                type: Object,
                default: () => ({top: 70})
            },
            message: {
                type: String,
                default: ''
            },
            icon: {
                type: String,
                default: ''
            },
            minHeight: {
                type: String,
                default: '10px'
            },
            zIndex: {
                type: Number,
                default: 3000
            }
        },
        watch: {
            content() {
                this.setContent();
            },
            icon() {
                this.setContent();
            }
        },
        methods: {
            setContent() {
                let {content, icon, maxWidth, maxHeight, minWidth, minHeight, padding, textAlign} = this;
                this.html = `
                    <div class="app-tips-wrap" style="max-width:${maxWidth};max-height:${maxHeight};min-width:${minWidth};min-height:${minHeight};padding:${padding};text-align:${textAlign}">
                        ${icon ? `<i class="app-tips-icon icon-${icon}"></i>` : ''}
                        <div class="app-tips-txt">${content}</div>
                    </div>`;
            }
        },
        mounted() {
            this.setContent();
        }
    });

    const props = [
        'fetch', 'persist',
        'structureItems', 'structureImagePath',
        'header', 'toolbox', 'title', 'grid', 'movable', 'editable', 'freeDrop',
        'gridLine', 'gridRuleLine', 'gridRuleLineColor', 'gridRuleAreaColor', 'gridRuleAreaFlash',
        'zoomAnimationDuration', 'contextMenu', 'getItemTitle'
    ];

    export default {

        name: 'App',

        __props: [...props],

        components: {Layout, LayoutHeader, Toolbox, Index, LayoutMain, FuncBar, ModalMask, Popup},

        store,

        props,

        data() {
            let {header, gridLine, gridRuleLine, freeDrop} = this.$props;
            return {
                index: true,
                confirmDisplay: 'none',

                appHeader: header,

                appFreeDrop: freeDrop,

                appGridLine: gridLine,

                appGridRuleLine: gridRuleLine,

                appToolbox: false
            }
        },

        watch: {

            index(val) {
                if (val) {
                    this.reset();
                }
                this.appToolbox = this.toolbox && this.grid && !val;
            },

            toolbox(val) {
                this.appToolbox = val && this.grid && !this.index;
            },

            grid(val) {
                this.appToolbox = this.toolbox && val && !this.index;
            },

            header(val) {
                this.appHeader = val;
            },

            gridLine(val) {
                this.appGridLine = val;
            },

            gridRuleLine(val) {
                this.appGridRuleLine = val;
            },

            freeDrop(val) {
                this.appFreeDrop = val;
            }
        },

        computed: {

            ...mapState(['packages', 'modalMaskIndex', 'draft', 'currentPackage', 'structsList', 'structsMap', 'viewOffset']),

            headerButtonBar() {
                return !this.index;
            },

            saveButton() {
                return this.toolbox && this.grid;
            },

            backButton() {
                return !this.index;
            },

            packageName() {
                let pack = this.currentPackage;
                return pack ? pack.name : '';
            },

            gridContextMenu() {
                let contextMenu = this.contextMenu, res, menu;
                if (Array.isArray(contextMenu)) {
                    res = [];
                    for (let i = 0; i < contextMenu.length; i++) {
                        menu = contextMenu[i];
                        if (menu.value) {
                            menu.checked = this[menu.value];
                            res.push(menu);
                        }
                    }
                }
                return res;
            }
        },

        methods: {

            ...mapMutations(['reset', 'setPackage', 'setPackages', 'setDraft']),

            getData() {
                return DraftStorage.getPackages(this.packages);
            },

            getItems(pack) {
                let items = [];
                if (pack) {
                    let packItems = pack.items;
                    if (Array.isArray(packItems)) {
                        for (let i = 0, item; i < packItems.length; i++) {
                            if ((typeof (item = packItems[i]) === 'object') && item.name === 'desk') {
                                items.push(item);
                            }
                        }
                    }
                }
                return items;
            },

            saveAndBack() {
                this.save()
                    .then(() => {
                        this.back();
                    })
                    .catch(() => {
                        this.confirmDisplay = 'none';
                    });
            },
            save() {
                if (!this.editable) {
                    return Promise.resolve('');
                }
                const tips = new (Vue.component('AgentAppTips'))({
                    data: {
                        content: '保存中',
                        icon: 'load'
                    }
                });
                let persist = this.persist,
                    data = this.getData();
                if (persist && typeof persist === 'object') {
                    persist.data = data;
                }
                return (persist && typeof persist === 'object'
                    ? axios(persist)
                    : (typeof persist === 'function'
                        ? new Promise(persist.bind(this))
                        : Promise.reject('no persist args.')))
                    .then((res) => {
                        tips.content = `保存成功`;
                        tips.icon = 'succ';
                        tips.duration = 1500;
                        storage.setHistory(JSON.stringify(data));
                        this.setDraft(false);
                        return res;
                    })
                    .catch(error => {
                        console.error(error);
                        tips.content = `保存失败`;
                        tips.icon = 'fail';
                        tips.duration = 1500;
                        throw error;
                    });
            },
            back() {
                this.confirmDisplay = 'none';
                this.index = true;
            },

            refresh(items) {
                if (!Array.isArray(items)) {
                    items = [items];
                }
                let maps = this.structsMap || {}, changed = [], struct;
                for (let i = 0, item; i < items.length; i++) {
                    if ((item = items[i]) && (typeof item === 'object')) {
                        struct = maps[item.id];
                        if (struct) {
                            Object.assign(struct, item);
                            changed.push(struct);
                        }
                    }
                }
                bus.$emit('refreshItems', changed);
                return this;
            }
        },

        created() {
            let fetch = this.fetch,
                tips = new (Vue.component('AgentAppTips'))({
                    data: {
                        icon: 'load',
                        content: '加载中'
                    }
                });
            (fetch && typeof fetch === 'object'
                ? axios(fetch)
                : (typeof fetch === 'function'
                    ? new Promise(fetch.bind(this))
                    : Promise.reject('no fetch args.')))
                .then(res => {
                    if (Array.isArray(res)) {
                        this.setPackages(res);
                        this.reset();
                        this.index = true;
                        tips.content = '已加载';
                        tips.icon = 'succ';
                        tips.duration = 1500;
                    } else if (res) {
                        throw '加载的数据不正确';
                    } else {
                        tips.duration = 30;
                    }
                })
                .catch(error => {
                    console.error(error);
                    tips.content = '加载失败';
                    tips.icon = 'fail';
                    tips.duration = 1500;
                });
        },

        mounted() {
            bus.$on('openPackage', (pack) => {
                this.setPackage(pack);
                this.index = false;
                this.$nextTick(() => {
                    bus.$emit('packageOpened');
                    this.$emit('packageOpened', this.getItems(pack), pack);
                });
            }).$on('save', () => {
                this.save();
            }).$on('back', () => {
                if (this.editable && this.draft) {
                    this.confirmDisplay = true;
                } else {
                    this.back();
                }
            }).$on('removePackage', () => {
                this.save();
            }).$on('addPackage', () => {
                this.save();
            }).$on('contextMenu', (item) => {
                this[item.name] = item.value;
            }).$on('itemSelected', item => {
                item = this.structsMap[item.id];
                if (item) {
                    this.$emit('itemSelected', item);
                }
            });

        },

        beforeDestroy() {
            bus.$off();
            clearState(this.$store.state);
        }

    }

</script>

<style lang="scss">

    .app-form {

        padding: 30px 40px;

        .row {
            margin-bottom: 15px;
            &:before {
                content: '';
                display: inline-block;
                height: 100%;
                width: 0;
                vertical-align: middle;
            }
        }

        label {
            font-size: 14px;
            color: #616161;
            margin-right: 10px;
            vertical-align: top;
            display: inline-block;

            &.v-ctr {
                vertical-align: sub;
            }
        }

        .input {
            background-color: #f7f7f7;
            border: solid 1px #9e9e9e;
            padding: 0 8px;
            vertical-align: sub;
            box-sizing: border-box;
            font-size: 14px;
            letter-spacing: 1px;
            color: #000;
            display: inline-block;
        }

        textarea.input {
            resize: none;
            padding: 6px;
        }

    }

    .app-button-bar {

        text-align: right;
        margin-top: 20px;

        button {
            outline: none;
            width: 88px;
            height: 32px;
            border-radius: 3px;
            background-color: #fff;
            border: solid 1px #9e9e9e;
            margin-right: 6px;
            color: #616161;
            cursor: pointer;

            &.primary {
                background-color: #0288d1;
                border: none;
                margin-right: 0;
                color: #fff;

                &:hover {
                    background-color: darken(#0288d1, 5%);
                    color: darken(#fff, 5%);
                }
            }

            &:hover {
                background-color: darken(#fff, 5%);
                color: darken(#616161, 5%);
            }

        }
    }

    .app-confirm-wrap {
        padding: 10px 20px 20px 20px;
        min-width: 340px;

        p {
            margin: 16px 0 35px;
        }
    }

    .app-tips-wrap {

        padding: 16px 30px;
        box-sizing: border-box;
        min-width: 160px;
        margin: 0;
        text-align: center;
        font-size: 14px;

        .app-tips-txt, .app-tips-icon {
            display: inline-block;
            vertical-align: middle;
        }

        .app-tips-icon {
            margin-right: 6px;
        }

        .icon-succ {
            background: url("../asserts/img/page/ico-succ.png") no-repeat center;
            width: 22px;
            height: 22px;
        }

        .icon-fail {
            background: url("../asserts/img/page/ico-fail.png") no-repeat center;
            width: 22px;
            height: 22px;
        }

        .icon-load {
            width: 20px;
            height: 20px;
            border: 2px solid #0071c5;
            border-bottom-width: 0;
            border-right-width: 0;
            border-radius: 50%;
            animation: app-tips-load-am .5s infinite both;
        }

    }

    @keyframes app-tips-load-am {
        0% {
            transform: rotate(0);
            opacity: .7;
        }

        50% {
            transform: rotate(180deg);
            opacity: .9;
        }

        100% {
            transform: rotate(360deg);
            opacity: .7;
        }
    }

    .app-color {
        display: inline-block;
        width: 100%;
        height: 100%;
    }


</style>