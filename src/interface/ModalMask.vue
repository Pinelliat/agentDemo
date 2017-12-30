<template>

    <!--<transition name="fade">-->
    <div v-show="!hidden" class="mask"
         @click.stop.prevent="handler"
         @mousedown.stop.prevent="handler"
         @mouseup.stop.prevent="handler"
         @mousepress.stop.prevent="handler"
         :style="{zIndex}"
    ></div>
    <!--</transition>-->

</template>

<script>

    export default {

        name: 'ModalMask',

        props: {
            hidden: {
                type: Boolean,
                default: false
            },
            zIndex: {
                type: Number,
                default: 1000
            }
        },

        methods: {
            handler() {
            }
        }

    }


</script>

<style lang="scss" scoped>

    .mask {
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: #000;
        opacity: .3;
        transition: opacity .2s;
    }

    .fade-enter, .fade-leave-active {
        opacity: 0;
    }

</style>