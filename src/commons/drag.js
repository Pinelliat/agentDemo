//
export default class Drag {

    constructor(props) {
        this.props = Object.assign({
            trigger: null,
            handler: null,
            cursor: '',
            disabled: false,
            removeSelection: true,
            onReady(){
            },
            onStart() {
            },
            onEnd() {
            },
            onCancel() {
            },
            onDrag() {
            }
        }, props);
        let trigger = this.props.trigger;
        if (this.trigger = trigger) {
            trigger.addEventListener('mousedown', this.downHandler = event => {
                this.start(event);
            });
            this.handler = trigger;
        } else if (this.handler = this.props.handler) {
            this.trigger = this.handler;
        }
    }

    start(event) {
        if (this.props.disabled) {
            return;
        }
        let startX = event.clientX,
            startY = event.clientY,
            doc = document,
            {cursor, removeSelection, onReady, onStart, onEnd, onCancel, onDrag} = this.props,
            handler = this.handler || {},
            trigger = this.trigger || {};
        if (this.upHandler) {
            this.upHandler();
        }
        onReady(Drag.getParams(event, {x: startX, y: startY}, trigger));
        doc.addEventListener('mousemove', this.moveHandler = (event) => {
            let params = Drag.getParams(event, {x: startX, y: startY}, trigger),
                delta = params.coords.delta;
            if (!this.dragging && (Math.abs(delta.x) > 3 || Math.abs(delta.y) > 3)) {
                if (cursor) {
                    doc.body.style.cursor = cursor;
                }
                if (handler.setCapture) {
                    handler.setCapture();
                }
                onStart(params);
                this.dragging = true;
            }
            if (this.dragging) {
                onDrag(params);
                if (removeSelection) {
                    Drag.removeSelection();
                }
            }
        });
        doc.addEventListener('mouseup', this.upHandler = (event) => {
            this.dragging = false;
            if (cursor) {
                doc.body.style.cursor = '';
            }
            if (handler.releaseCapture) {
                handler.releaseCapture();
            }
            if (this.moveHandler) {
                doc.removeEventListener('mousemove', this.moveHandler);
            }
            if (this.upHandler) {
                doc.removeEventListener('mouseup', this.upHandler);
            }
            this.moveHandler = this.upHandler = null;
            if (!event) {
                onCancel(Drag.getParams(event, {x: startX, y: startY}, trigger));
            } else {
                onEnd(Drag.getParams(event, {x: startX, y: startY}, trigger));
            }
        });
    }

    dispose() {
        if (this.upHandler) {
            this.upHandler();
            this.upHandler = null;
        }
        if (this.trigger) {
            this.trigger.removeEventListener('mousedown', this.downHandler);
            this.downHandler = this.trigger = null;
        }
        this.handler = null;
        this.props = null;
    }

    static removeSelection() {
        if ("getSelection" in window) {
            window.getSelection().removeAllRanges();
        }
        else {
            document['selection'].empty();
        }
    }

    static getParams(event, start, trigger) {
        if (event) {
            let x = event.clientX, y = event.clientY;
            return {
                event,
                trigger,
                coords: {
                    start: {
                        x: start.x,
                        y: start.y
                    },
                    current: {x, y},
                    delta: {
                        x: x - start.x,
                        y: y - start.y
                    }
                }
            }
        } else {
            return {
                event: {},
                trigger,
                coords: {
                    start: {
                        x: start.x,
                        y: start.y
                    },
                    current: {},
                    delta: {}
                }
            }
        }
    }

}