<template>

    <div ref="trigger">
        <slot></slot>
    </div>

</template>

<script>

    import Drag from '../commons/drag';

    export default {

        name: 'Draggable',

        props: {
            cursor: {
                type: String
            },
            removeSelection: {
                type: Boolean,
                default: true
            },
            disabled: {
                type: Boolean,
                default: false
            }
        },

        watch: {
            cursor(val) {
                if (this.dragger) {
                    this.dragger.props.cursor = val;
                }
            },
            removeSelection(val) {
                if (this.dragger) {
                    this.dragger.props.removeSelection = val;
                }
            },
            disabled(val) {
                this.dragger.props.disabled = val;
            }
        },

        mounted() {
            let {cursor, removeSelection, disabled} = this.$props;
            this.dragger = new Drag({
                trigger: this.$refs.trigger,
                cursor,
                removeSelection,
                disabled,
                onStart: detail => {
                    this.$emit('dragstart', detail);
                },
                onDrag: detail => {
                    this.$emit('drag', detail);
                },
                onEnd: detail => {
                    this.$emit('dragend', detail);
                },
                onCancel: detail => {
                    this.$emit('dragcancel', detail);
                }
            });
        },

        beforeDestroy() {
            if (this.dragger) {
                this.dragger.dispose();
            }
        }

    }

</script>