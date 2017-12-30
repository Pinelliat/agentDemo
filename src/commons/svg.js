import Snap from 'snapsvg';
import Vue from 'vue';

const fragmentMapped = {};
const emitter = new Vue();

class SVG {

    constructor(props) {
        this.init(props);
    }

    init({el, width, height, node, element, style, attr}) {
        let elem = this.element = element ? element : (node ? new Snap(node) : new Snap(width, height)),
            elemStyle = elem.node.style;
        this.node = elem.node;
        if (style) {
            this.setStyle(style);
        } else if (elemStyle.overflow !== 'hidden') {
            elemStyle.overflow = 'visible';
        }
        if (attr) {
            this.attr(attr);
        }
        if (el) {
            this.el = el;
            el.appendChild(elem.node);
        }
    }

    setStyle(style) {
        let node = this.node,
            elemStyle = node.style;
        for (let prop in style) {
            if (style.hasOwnProperty(prop)) {
                elemStyle[prop] = style[prop];
            }
        }
        return this;
    }

    loadFragment({src, el, style, attr}, callback) {
        let element = fragmentMapped[src];
        if (element === 'loading') {
            emitter.$once(src, fragment => {
                callback(new SVG({element: fragment.clone(), el, style, attr}));
            });
        } else if (element) {
            callback(new SVG({element: element.clone(), el, style, attr}));
        } else {
            fragmentMapped[src] = 'loading';
            Snap.load(src, fragment => {
                let element = fragmentMapped[src] = new Snap(fragment.node).clone();
                callback(new SVG({node: fragment.node, el, style, attr}));
                emitter.$emit(src, element);
            });
        }
        return this;
    }

    setWidth(width) {
        width = +width;
        if (!isNaN(width)) {
            this.element.attr('width', width);
        }
        return this;
    }

    hover(fnIn, fnOut) {
        this.element.hover(this.hoverInHandler = fnIn, this.hoverOutHandler = fnOut);
        return this;
    }

    unhover() {
        this.element.unhover(this.hoverInHandler, this.hoverOutHandler);
        this.hoverInHandler = this.hoverOutHandler = null;
        return this;
    }

    getBBox() {
        return this.element.getBBox();
    }

    getWidth() {
        if (this.isSVGElement()) {
            return +this.node.getAttribute('width') || 0;
        }
        return this.element.getBBox().width;
    }

    setHeight(height) {
        height = +height;
        if (!isNaN(height)) {
            this.element.attr('height', height);
        }
        return this;
    }

    getHeight() {
        if (this.isSVGElement()) {
            return +this.node.getAttribute('height') || 0;
        }
        return this.element.getBBox().height;
    }

    appendImageElement(child) {
        if (this.isSVGElement()) {
            let svg = new SVG({
                element: this.element.paper.image(child.src, child.itemLeft, child.itemTop, child.itemWidth, child.itemHeight)
            });
            svg.el = this.element;
            return svg;
        }
    }

    replaceAll(elem) {
        if (elem) {
            let element = this.element;
            if (element !== elem) {
                element.insertAfter(elem instanceof SVG ? elem.element : elem);
                elem.remove();
            }
        }
        return this;
    }

    remove() {
        if (typeof this.element.remove === 'function') {
            this.element.remove();
        }
        return this;
    }

    appendTo() {
        if (this.el) {
            this.el.append(this.element);
            this.element.removed = false;
        }
        return this;
    }

    bringToFront() {
        let element = this.element,
            paper = element.paper;
        if (paper !== element && paper.node) {
            paper.node.appendChild(element.node);
        }
        return this;
    }

    bringToBack() {
        let element = this.element,
            paper = element.paper,
            node;
        if (paper !== element && (node = paper.node)) {
            node.insertBefore(element.node, node.firstChild);
        }
    }

    toDataURL() {
        return this.element.toDataURL();
    }

    refresh({left, top, width, height}, duration) {
        let animation = {};
        !isNaN(left = +left) && (animation.x = left);
        !isNaN(top = +top) && (animation.y = top);
        !isNaN(width = +width) && (animation.width = width);
        !isNaN(height = +height) && (animation.height = height);
        if (!duration) {
            this.attr(animation);
        } else {
            this.element.animate(animation, duration, mina ? mina.easeinout : null);
        }
        return this;
    }

    select(query) {
        return this.element.select(query);
    }

    selectAll(query) {
        return this.element.selectAll(query);
    }

    attr(attr) {
        let val;
        if (!isNaN(val = +attr.left)) {
            attr.x = val;
            delete attr.left;
        }
        if (!isNaN(val = +attr.top)) {
            attr.y = val;
            delete attr.top;
        }
        this.element.attr(attr);
        return this;
    }

    setChildAttr(selector, attr) {
        if (this.isSVGElement()) {
            if (typeof selector === 'string') {
                selector = this.element.selectAll(selector);
                if (selector.length) {
                    for (let i = 0; i < selector.length; i++) {
                        this.attr.call({element: selector[i]}, attr);
                    }
                }
            } else if (selector) {
                this.attr.call({element: selector}, attr);
            }
        }
        return this;
    }

    rotate(angle, origin) {
        origin = (origin || '').split(' ');
        let ox = origin[0] || 'none',
            oy = origin[1] || 'none',
            element = this.element,
            {x, x2, cx, y, y2, cy} = element.getBBox(),
            matrix = new Snap.Matrix();
        if (typeof ox === 'string') {
            ox = ({
                left: x,
                right: x2,
                center: cx
            })[ox];
        }
        if (isNaN(ox = +ox)) {
            ox = cx;
        }
        if (typeof oy === 'string') {
            oy = ({
                top: y,
                bottom: y2,
                center: cy
            })[oy];
        }
        if (isNaN(oy = +oy)) {
            oy = cy;
        }
        element.transform(matrix.rotate(angle, ox, oy));
        return this;
    }

    setChildRotate(selector, ...args) {
        if (this.isSVGElement()) {
            if (typeof selector === 'string') {
                selector = this.element.selectAll(selector);
                if (selector.length) {
                    for (let i = 0; i < selector.length; i++) {
                        this.rotate.apply({element: selector[i]}, args);
                    }
                }
            } else if (selector) {
                this.rotate.apply({element: selector}, args);
            }
        }
        return this;
    }

    toArc(radian, width, height) {
        radian = +radian;
        let PI = Math.PI;
        if (!isNaN(radian)) {
            let degrees = radian * 180 / PI;
            if (degrees >= 360) {
                degrees = 359.99;
            }
            if (degrees <= 0) {
                degrees = 0;
            }
            radian = Math.min(Math.max(degrees * (PI / 180), 0), 2 * PI - 0.01);
            let r = height / radian,
                r2 = r - width,
                x = (Math.sin(radian) * r).toFixed(2),
                x2 = (Math.sin(radian) * r2).toFixed(2),
                y = -(Math.cos(radian) * r).toFixed(2),
                y2 = -(Math.cos(radian) * r2).toFixed(2),
                largeFlag = degrees > 180 ? 1 : 0,
                d = ['M', 0, -r, 'A', r, r, 0, largeFlag, 1, x, y, 'L', x2, y2, 'A', r2, r2, 0, largeFlag, 0, 0, -r2, 'L', 0, -r];
            return d.join(' ');
        }
        return '';
    }

    empty() {
        let element = this.element;
        if (this.isSVGElement() && element.paper === element) {
            element.clear();
        } else {
            element.remove();
        }
        return this;
    }

    clone(props) {
        let {style, attr} = props || {},
            svg = new SVG({element: this.element.clone(), style, attr});
        svg.el = this.el;
        return svg;
    }

    isSVGElement() {
        let element = this.element,
            node = element.node;
        return /svg/i.test(node.nodeName || node.tagName || element.type || node.name);
    }

    hide() {
        if (this.node) {
            this.node.style.visibility = 'hidden';
        }
        return this;
    }

    show() {
        if (this.node) {
            this.node.style.visibility = '';
        }
        return this;
    }

    destroy() {
        if (this.hoverInHandler) {
            this.unhover();
        }
        this.remove();
        this.node = this.element = {};
        this.destroyed = true;
    }

}

export {SVG};