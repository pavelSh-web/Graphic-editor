import BaseShape, { ShapeBound } from '../shapes/BaseShape';
import { autorun, computed, makeObservable, reaction } from 'mobx';

const controlContainerClass = 'shape-controls';
const controlClass = 'shape-control';

let ctrlPressed = false;
let shiftPressed = false;

let _keyUpTimeout: any = null;

export default class ShapeControls {
    private stopped: boolean = false;

    shapes: BaseShape[] = [];

    editor: any;

    // @ts-ignore
    $controlContainer: JQuery;

    get $controls() {
        return this.$controlContainer.find('.shape-control');
    }

    get focusedShapes() {
        return this.shapes.filter(shape => shape.hasState('focus'));
    }

    constructor(shapes: BaseShape[], editor: any) {
        this.shapes = shapes;
        this.editor = editor;

        this.initControls();
        this.bindPointerEvents();
        this.bindKeyboardEvents();

        this.initMobx();
    }

    private initMobx() {
        makeObservable(this, {
            focusedShapes: computed
        });

        autorun(() => {
            this.$controlContainer.toggleClass('multiply-focus', this.focusedShapes.length > 1);
        });
    }

    private initControls() {
        this.$controlContainer = $(`<div class="${ controlContainerClass }"></div>`);

        $('body').prepend(this.$controlContainer);
    }

    private bindKeyboardEvents() {
        $(document).on('keydown', (e) => {
            const step = e.shiftKey ? 10 : 1;
            const isMove = e.code.includes('Arrow');
            let needRender = isMove;

            if (e.ctrlKey) {
                ctrlPressed = true;
            }

            if (e.shiftKey) {
                shiftPressed = true;
            }

            switch (e.code) {
                case 'Delete':
                    if (this.focusedShapes.length) {
                        this.focusedShapes.forEach(shape => this.editor.deleteShape(shape));
                    }
                    break;
                case 'KeyA':
                    if (e.ctrlKey) {
                        this.shapes.forEach((shape) => shape.updateState({ focus: true }));
                    }
                    break;
                case 'KeyD':
                    e.preventDefault();

                    if (e.ctrlKey) {
                        const focusedShape = this.focusedShapes[0];

                        needRender = true;

                        if (focusedShape) {
                            const shape = this.editor.createShape({
                                type: focusedShape.type,
                                bound: {
                                    fromX: focusedShape.data.bound.toX + 20,
                                    fromY: focusedShape.data.bound.fromY,
                                    width: focusedShape.width,
                                    height: focusedShape.height,
                                }
                            });

                            this.createControl(shape);
                            this.shapes.forEach(shape => shape.resetStates());
                            shape.updateState({ focus: true });
                        }
                    }
                    break;
                case 'ArrowUp':
                    this.focusedShapes.forEach(shape => shape.move({ y: shape.data.bound.fromY - step }));
                    break;
                case 'ArrowDown':
                    this.focusedShapes.forEach(shape => shape.move({ y: shape.data.bound.fromY + step }));
                    break;
                case 'ArrowLeft':
                    this.focusedShapes.forEach(shape => shape.move({ x: shape.data.bound.fromX - step }));
                    break;
                case 'ArrowRight':
                    this.focusedShapes.forEach(shape => shape.move({ x: shape.data.bound.fromX + step }));
                    break;
                case 'Escape':
                    this.shapes.forEach(shape => shape.resetStates());
                    break;
            }

            if (isMove) {
                this.focusedShapes.forEach(shape => shape.updateState({ move: true }));
            }
        });

        $(document).on('keyup', (e) => {
            const isMove = e.code.includes('Arrow');

            ctrlPressed = false;
            shiftPressed = false;

            if (isMove) {
                clearTimeout(_keyUpTimeout);

                _keyUpTimeout = setTimeout(() => {
                    this.shapes.forEach(shape => shape.updateState({ move: false }));
                }, 1000);
            }
        });
    }

    private bindPointerEvents() {
        let inMove = false;
        let inResize = false;
        let inRotate = false;

        let initialCoordControl = {
            x: 0,
            y: 0
        }

        this.$controlContainer.on('pointerdown', (e) => {
            if (this.stopped) {
                return;
            }

            const $control = $(e.target).closest(`.${ controlClass }`);
            const $controlResizer = $(e.target).closest(`.${ controlClass }-resize`);
            const $controlRotate = $(e.target).closest(`.${ controlClass }-rotate`);
            const controlOffset = $control.offset();

            if (e.pageX && e.pageY && controlOffset) {
                initialCoordControl = {
                    x: e.pageX - controlOffset.left,
                    y: e.pageY - controlOffset.top
                }
            }

            if (!ctrlPressed) {
                this.shapes.forEach(shape => shape.updateState({ focus: false }));
            }

            if ($control.length) {
                e.preventDefault();
                e.stopPropagation();

                const shapeId = $control.data('shape-id');
                const shape = this.shapes.find(shape => shape.id == shapeId) as BaseShape;

                if ($controlResizer.length) {
                    inResize = true;

                    $controlResizer.addClass('active');
                }
                else if ($controlRotate.length) {
                    inRotate = true;

                    $controlRotate.addClass('active');
                }
                else {
                    inMove = true;
                }

                if (shape) {
                    if (shape.hasState('focus')) {
                        return;
                    }

                    shape.updateState({ focus: true });

                    const $controls = this.$controls;

                    // Перемещаем контрол в конец списка дом нод
                    shape.$control.insertAfter($controls[$controls.length - 1]);
                }
            }
        });
        this.$controlContainer.on('pointerup', (e) => {
            inMove = false;
            inResize = false;
            inRotate = false;

            this.focusedShapes.forEach((shape) => {
                shape.normalizeBound();
                shape.updateState({
                    move: false,
                    resize: false
                });
            });

            this.$controlContainer.find(`.active`).removeClass('active');
            this.$controlContainer.removeClass('in-rotate');

            this.start();
        });
        this.$controlContainer.on('pointermove', (e) => {
            if (this.stopped && !inMove && !inResize) {
                return;
            }

            const $control = $(e.target).closest(`.${ controlClass }`) as JQuery;

            this.shapes.forEach((shape) => {
                if (shape.hasState('hover')) {
                    shape.updateState({ hover: false })
                }
            });

            if (!this.stopped) {
                if ($control.length) {
                    const shapeId = $control.data('shape-id');
                    const currentShape = this.shapes.find(shape => shape.id == shapeId) as BaseShape;

                    if (currentShape && !currentShape.hasState('hover')) {
                        currentShape.updateState({ hover: true });
                    }
                }
            }

            if (this.focusedShapes.length) {
                if (inResize) {
                    this.stop();

                    if (e.pageX && e.pageY) {
                        const shape = this.focusedShapes[0];

                        const $activeControl = shape.$control.find(`.${ controlClass }-resize.active`) as JQuery;
                        const editableCoords = ($activeControl.attr('data-resize-control') as string).split(',');
                        const bound: Partial<ShapeBound> = {};

                        if (!shiftPressed) {
                            if (editableCoords.includes('right')) {
                                bound.toX = e.pageX;
                            }

                            if (editableCoords.includes('bottom')) {
                                bound.toY = e.pageY;
                            }

                            if (editableCoords.includes('left')) {
                                bound.fromX = e.pageX;
                            }

                            if (editableCoords.includes('top')) {
                                bound.fromY = e.pageY;
                            }

                            shape.resize({ bound });
                        }
                        else {
                            // const proportionMax = shape.bound.width > shape.bound.height ? 'x' : 'y';
                            //
                            // const valueX = shiftPressed ? Math.max(e.pageX, e.pageY) : e.pageX;
                            // const valueY = shiftPressed ? Math.max(e.pageX, e.pageY) : e.pageY;
                        }

                        shape.updateState({
                            resize: true
                        });
                    }
                }
                else if (inRotate) {
                    this.stop();

                    if (e.pageX && e.pageY) {
                        const shape = this.focusedShapes[0];

                        this.$controlContainer.addClass('in-rotate');

                        shape.updateState({
                            rotate: true
                        });
                    }
                }
                else if (inMove && this.focusedShapes.length === 1) {
                    this.stop();

                    this.focusedShapes.forEach((shape) => {
                        if (e.pageX && e.pageY) {
                            shape.move({
                                x: e.pageX - initialCoordControl.x,
                                y: e.pageY - initialCoordControl.y,
                            });
                            shape.updateState({ move: true });
                        }

                    });
                }
            }
        });
    }

    createControl(shape: BaseShape) {
        shape.$control = $(`
            <div class="${ controlClass }" data-shape-id="${ shape.id }">
                <div class="${ controlClass }-rotate ${ controlClass }-rotate__top-left" data-rotate-control="top,left"></div>
                <div class="${ controlClass }-rotate ${ controlClass }-rotate__top-right" data-rotate-control="top,right"></div>
                <div class="${ controlClass }-rotate ${ controlClass }-rotate__bottom-left" data-rotate-control="bottom,left"></div>
                <div class="${ controlClass }-rotate ${ controlClass }-rotate__bottom-right" data-rotate-control="bottom,right"></div>
                <div class="${ controlClass }-resize ${ controlClass }-resize__top" data-resize-control="top"></div>
                <div class="${ controlClass }-resize ${ controlClass }-resize__right" data-resize-control="right"></div>
                <div class="${ controlClass }-resize ${ controlClass }-resize__bottom" data-resize-control="bottom"></div>
                <div class="${ controlClass }-resize ${ controlClass }-resize__left" data-resize-control="left"></div>
                <div class="${ controlClass }-resize ${ controlClass }-resize__top-left" data-resize-control="top,left"></div>
                <div class="${ controlClass }-resize ${ controlClass }-resize__top-right" data-resize-control="top,right"></div>
                <div class="${ controlClass }-resize ${ controlClass }-resize__bottom-left" data-resize-control="bottom,left"></div>
                <div class="${ controlClass }-resize ${ controlClass }-resize__bottom-right" data-resize-control="bottom,right"></div>
                <div class="${ controlClass }-size"></div>
            </div>
        `);

        this.$controlContainer.append(shape.$control);

        this.updateResizeContol(shape);
        this.updateSizeControl(shape);

        reaction(
            () => [shape.data.bound, shape.data.state],
            () => {
                this.updateResizeContol(shape);
            }
        );

        reaction(
            () => [shape.width, shape.height],
            () => {
                this.updateSizeControl(shape);
            }
        );
    }

    updateSizeControl(shape: BaseShape) {
        if (shape.$control) {
            shape.$control.find(`.${ controlClass }-size`).text(`${ Math.round(shape.width) } × ${ Math.round(shape.height) }`);
        }
    }

    updateResizeContol(shape: BaseShape) {
        if (shape.$control) {
            const { fromX, fromY, toX, toY, width, height } = shape.data.bound;

            shape.$control.css({
                top: Math.min(fromY, toY),
                left: Math.min(fromX, toX),
                width,
                height
            });

            Object.entries(shape.data.state).forEach(([stateName, stateValue]) => {
                shape.$control.toggleClass(stateName, stateValue);
            });
        }
    }

    stop() {
        this.stopped = true;
    }

    start() {
        this.stopped = false;
    }
}
