<template>

    <div class="header">
        <span class="title">{{title}}</span>

        <div v-show="buttonBar" class="btn-bar">
            <span v-show="backButton" class="btn icon-back"
                  @click="back"
            >返回</span>
            <span v-show="saveButton" class="btn icon-save"
                  @click="save"
            >保存</span>
        </div>


    </div>

</template>

<script>

    import bus from '../commons/bus';

    export default {

        name: 'LayoutHeader',

        props: {
            title: {
                type: String,
                default: '远传 · 座位图绘制'
            },
            buttonBar: {
                type: Boolean,
                default: true
            },
            backButton: {
                type: Boolean,
                default: false
            },
            saveButton: {
                type: Boolean,
                default: false
            }
        },

        methods: {
            save() {
                bus.$emit('save');
            },
            back() {
                bus.$emit('back');
            }
        }

    }

</script>

<style lang="scss" scoped>

    .header {

        width: 100%;
        height: 48px;
        background-color: #607d8b;
        box-shadow: 0 0 9px rgba(4, 0, 0, .52);
        font-size: 20px;
        color: #fff;
        white-space: nowrap;
        word-break: keep-all;
        padding: 0 14px;

        .title {
            vertical-align: middle;
            display: inline-block;
        }

        &:before {
            content: '';
            height: 100%;
            width: 0;
            vertical-align: middle;
            display: inline-block;
        }

        .btn-bar {
            position: absolute;
            right: 0;
            top: 0;
            height: 100%;
            font-size: 14px;

            &:before {
                content: '';
                display: inline-block;
                height: 100%;
                width: 0;
                vertical-align: middle;
            }

            .btn {
                display: inline-block;
                vertical-align: middle;
                padding: 5px 5px 5px 25px;
                margin-right: 14px;
                cursor: pointer;

                &:hover {
                    color: darken(#fff, 8%);
                }

            }
        }

        .icon-save {
            background: url("../asserts/img/page/ico-save.png") left center no-repeat;
        }

        .icon-back {
            background: url("../asserts/img/page/ico-back.png") left center no-repeat;
        }

    }


</style>