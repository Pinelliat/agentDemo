<template>

    <div class="main">

        <SVGSurface ref="svg"
                    :getItemTitle="getItemTitle"
                    :zoomAnimationDuration="zoomAnimationDuration"
                    :selectionFlash="gridRuleAreaFlash"
                    :dragDisabled="selectionDragDisabled"
                    :contextMenu="gridContextMenu"
                    :editable="editable"
        ></SVGSurface>

        <GridLine ref="grid"
                  :display="grid"
                  :movable="movable"
                  :freeDrop="freeDrop"
                  :line="gridLine"
                  :ruleLine="gridRuleLine"
                  :ruleLineColor="gridRuleLineColor"
                  :ruleAreaColor="gridRuleAreaColor"
                  :ruleAreaFlash="gridRuleAreaFlash"
        ></GridLine>

    </div>

</template>

<script>

    import GridLine from './GridLine.vue';
    import SVGSurface from './SVGSurface.vue';
    import bus from '../commons/bus';

    export default {

        name: 'LayoutMain',

        components: {GridLine, SVGSurface},

        props: {
            grid: {
                type: Boolean
            },
            gridLine: {
                type: Boolean
            },
            gridRuleLine: {
                type: Boolean
            },
            gridRuleLineColor: {
                type: String
            },
            gridRuleAreaColor: {
                type: String
            },
            gridRuleAreaFlash: {
                type: Boolean
            },
            zoomAnimationDuration: {
                type: Number
            },
            gridContextMenu: {
                type: Array
            },
            movable: {
                type: Boolean
            },
            freeDrop: {
                type: Boolean
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
                selectionDragDisabled: !this.$props.grid
            }
        },

        watch: {
            grid(val) {
                this.selectionDragDisabled = !val;
            }
        },

        mounted() {

            bus.$on('toolboxDragging', ({offset, event, item}) => {
                let current = event.coords.current;
                this.$refs.grid.setMousePosition({
                    left: offset.left - 1,
                    top: offset.top - 1,
                    x: current.x,
                    y: current.y,
                    w: item.width,
                    h: item.height
                });
            }).$on('toolboxDragEnd', ({offset, event, item}) => {
                let {grid} = this.$refs,
                    current = event.coords.current,
                    selection = grid.getSelection({
                        left: offset.left - 1,
                        top: offset.top - 1,
                        x: current.x,
                        y: current.y,
                        w: item.width,
                        h: item.height
                    });
                if (selection) {
                    bus.$emit('makeNewSelection', [{
                        item: {
                            ...item,
                            itemWidth: selection.width,
                            itemHeight: selection.height,
                            itemLeft: selection.left,
                            itemTop: selection.top
                        },
                        selection
                    }]);
                }
            });
        },

        methods: {}


    }

</script>

<style lang="scss" scoped>

    .main {
        width: 100%;
        height: 100%;
        position: relative;
    }

</style>