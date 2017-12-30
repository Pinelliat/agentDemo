<template>

    <div class="index">

        <div v-if="editable" class="pack new">
            <div class="main"
                 @click="showModal"
            >
                <span class="ico-new"></span>
            </div>
            <div class="name">
                <div class="name-txt">新建场地</div>
            </div>
        </div>

        <transition-group mode="in-out" name="flip-list" tag="span">

            <div v-for="item in packs"
                 class="pack" :key="item.id">
                <div :class="['main', {hover:item._hover}]"
                     @click="openPackage(item)"
                     @mouseenter="item._hover=true"
                     @mouseleave="item._hover=false"
                     :title="item.name"
                >
                <span v-if="editable" class="ico-delete"
                      @click.stop="showConfirm(item)"
                ></span>
                </div>
                <div class="name">
                    <div class="name-txt">{{item.name}}</div>
                </div>
            </div>

        </transition-group>


        <Popup :display="modalDisplay" modal title="新建场地">

            <div class="app-form">

                <div class="row">

                    <label class="v-ctr" for="pack_name">名称</label>
                    <input ref="name" id="pack_name" v-model="nameValue" class="input"
                           style="width: 420px;height: 32px;">

                </div>

                <div class="row">

                    <label for="pack_remark">备注</label>
                    <textarea ref="remark" id="pack_remark" v-model="remarkValue" class="input"
                              style="width: 420px;height: 136px;"></textarea>

                </div>

                <div class="app-button-bar">
                    <button @click="closeModal">取消</button>
                    <button @click="makePack" class="primary">确定</button>
                </div>

            </div>

        </Popup>

        <Popup :display="confirmDisplay" modal title="删除提示">
            <div class="app-confirm-wrap">
                <p>确定要删除该场地吗？</p>
                <div class="app-button-bar">
                    <button @click="closeModal">取消</button>
                    <button @click="deletePackage" class="primary">确定</button>
                </div>
            </div>
        </Popup>

    </div>

</template>

<script>

    import bus from '../commons/bus';
    import utils from '../commons/utils';

    import Vue from 'vue';
    import {mapState, mapMutations} from 'vuex';

    import Popup from './Popup.vue';

    export default {

        name: 'Index',

        components: {Popup},

        props: {
            editable: {
                type: Boolean,
                default: true
            }
        },

        data() {
            return {
                confirmDisplay: 'none',
                modalDisplay: 'none',
                nameValue: '',
                remarkValue: ''
            }
        },

        computed: {

            ...mapState(['packages']),

            packs() {
                return this.packages.map((item) => {
                    this.$set(item, '_hover', false);
                    return item;
                });
            }

        },

        methods: {

            ...mapMutations(['addPackage', 'removePackage']),

            makePack() {
                let refs = this.$refs,
                    name = this.nameValue,
                    remark = this.remarkValue,
                    content;
                if (!(name = name.trim())) {
                    content = '名称不能为空';
                    this.nameValue = '';
                    refs.name.focus();
                } else if (this.packages.some(item => item.name === name)) {
                    content = '名称重复';
                }
                if (content) {
                    new (Vue.component('AgentAppTips'))({
                        data: {
                            duration: 1500,
                            icon: 'fail',
                            content
                        }
                    });
                } else {
                    this.closeModal();
                    this.nameValue = this.remarkValue = '';
                    this.addPackage({
                        id: utils.uuid(),
                        name: name,
                        remark: remark.trim(),
                        _hover: false
                    });
                }
            },
            deletePackage() {
                this.removePackage(this.deleteItem);
                this.confirmDisplay = 'none';
            },
            openPackage(item) {
                bus.$emit('openPackage', item);
            },
            showConfirm(item) {
                this.deleteItem = item;
                this.confirmDisplay = '';
            },
            showModal() {
                this.modalDisplay = '';
            },
            closeModal() {
                this.modalDisplay = this.confirmDisplay = 'none';
            }
        }

    }

</script>

<style lang="scss" scoped>

    .index {
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        padding: 50px 60px;
    }

    .pack {
        display: inline-block;
        text-align: center;
        margin: 0 55px 20px 0;
        width: 112px;
        transition: all .2s;
        transition-timing-function: ease-in-out;

        &.new {

            .main {
                background-color: #cfd8dc;

                &:hover {
                    background-color: lighten(#cfd8dc, 2%);
                }

            }

            .ico-new {
                background: url("../asserts/img/page/ico-new.png");
                width: 34px;
                height: 36px;
                display: inline-block;
                vertical-align: middle;
            }

        }

        .main {
            height: 118px;
            width: 100%;
            border-radius: 3px;
            background-color: #90a4ae;
            cursor: pointer;
            position: relative;

            &:before {
                content: '';
                display: inline-block;
                height: 100%;
                width: 0;
                vertical-align: middle;
            }

            &:hover {
                background-color: lighten(#90a4ae, 4%);
            }

            &.hover {

                .ico-delete {
                    background: url("../asserts/img/page/ico-delete.png");
                    width: 28px;
                    height: 27px;
                    position: absolute;
                    z-index: 10;
                    right: -10px;
                    top: -10px;
                    cursor: pointer;
                }

            }

        }

        .name {
            font-size: 14px;
            color: #616161;
            padding: 8px 6px;
            max-width: 100%;
            height: 48px;
            overflow: hidden;
            box-sizing: border-box;
        }

        .name-txt {
            width: 100%;
            height: 100%;
            overflow: hidden;
            line-height: 1.1em;
            text-align: center;
            white-space: normal;
            text-overflow: ellipsis;
            word-break: break-all;
        }

    }

    .flip-list-enter {
        margin-left: -55px;
        opacity: 0.5;
    }

    .flip-list-leave-active {
        opacity: 0;
        transform: translateY(50px);
        position: absolute;
    }

</style>