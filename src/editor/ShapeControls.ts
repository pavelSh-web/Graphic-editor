import BaseShape, { ShapeBound } from '../shapes/BaseShape';

const controlContainerClass = 'shape-controls';
const controlClass = 'shape-control';

let ctrlPressed = false;
let shiftPressed = false;

let _keyUpTimeout: any = null;

export default class ShapeControls {
    private static stopped: boolean = false;

    // @ts-ignore
    static _instance: ShapeControls;
    static shapes: BaseShape[] = [];

    static editor: any;

    static $controlContainer: JQuery;

    static get $controls() {
        return this.$controlContainer.find('.shape-control');
    }

    static get focusedShapes() {
        return this.shapes.filter(shape => shape.state.focus);
    }

    static create(shapes: BaseShape[], editor: any) {
        if (this._instance) {
            return this._instance;
        }

        this._instance = new ShapeControls(shapes, editor);

        return this._instance;
    }

    constructor(shapes: BaseShape[], editor: any) {
        ShapeControls.initControls();
        ShapeControls.bindPointerEvents();
        ShapeControls.bindKeyboardEvents();

        ShapeControls.shapes = shapes;
        ShapeControls.editor = editor;
    }

    private static initControls() {
        this.$controlContainer = $(`<div class="${ controlContainerClass }"></div>`);

        $('body').append(this.$controlContainer);
    }

    private static bindKeyboardEvents() {
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
                                    fromX: focusedShape.bound.toX + 20,
                                    fromY: focusedShape.bound.fromY,
                                    width: focusedShape.bound.width,
                                    height: focusedShape.bound.height,
                                }
                            });

                            this.createControl(shape);
                            this.shapes.forEach(shape => shape.resetStates());
                            shape.updateState({ focus: true });
                        }
                    }
                    break;
                case 'ArrowUp':
                    this.focusedShapes.forEach(shape => shape.move({ y: shape.bound.fromY - step }));
                    break;
                case 'ArrowDown':
                    this.focusedShapes.forEach(shape => shape.move({ y: shape.bound.fromY + step }));
                    break;
                case 'ArrowLeft':
                    this.focusedShapes.forEach(shape => shape.move({ x: shape.bound.fromX - step }));
                    break;
                case 'ArrowRight':
                    this.focusedShapes.forEach(shape => shape.move({ x: shape.bound.fromX + step }));
                    break;
                case 'Escape':
                    this.shapes.forEach(shape => shape.resetStates());
                    break;
            }

            if (isMove) {
                this.focusedShapes.forEach(shape => shape.updateState({ move: true }));
            }

            if (needRender) {
                this.focusedShapes.forEach(shape => this.updateContol(shape));

                ShapeControls.editor.renderCtx();
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
                    this.shapes.forEach(shape => this.updateContol(shape));
                }, 1000);
            }
        });
    }

    private static bindPointerEvents() {
        let inMove = false;
        let inResize = false;

        let initialCoordControl = {
            x: 0,
            y: 0
        }

        this.$controlContainer.on('pointerdown', (e) => {
            if (this.stopped) {
                return;
            }

            const $control = $(e.target).closest(`.${ controlClass }`);
            const $controlResizer = $(e.target).closest(`.${ controlClass }-handler`);
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
                else {
                    inMove = true;
                }

                if (shape) {
                    if (shape.state.focus) {
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

            this.focusedShapes.forEach((shape) => {
                shape.normalizeBound();
                shape.updateState({
                    move: false,
                    resize: false
                });
            });

            this.$controlContainer.find(`.${ controlClass }-handler.active`).removeClass('active');

            this.start();
        });
        this.$controlContainer.on('pointermove', (e) => {
            if (this.stopped && !inMove && !inResize) {
                return;
            }

            const $control = $(e.target).closest(`.${ controlClass }`) as JQuery;

            this.shapes.forEach(shape => shape.updateState({ hover: false }));

            if (!this.stopped) {
                if ($control.length) {
                    const shapeId = $control.data('shape-id');
                    const shape = this.shapes.find(shape => shape.id == shapeId) as BaseShape;

                    if (shape) {
                        shape.updateState({ hover: true });
                    }
                }
            }

            if (this.focusedShapes.length) {
                if (inResize) {
                    this.stop();

                    if (e.pageX && e.pageY) {
                        const shape = this.focusedShapes[0];

                        const $activeControl = shape.$control.find(`.${ controlClass }-handler.active`) as JQuery;
                        const editableCoords = ($activeControl.attr('data-control') as string).split(',');
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

                    ShapeControls.editor.renderCtx();
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

                    })

                    ShapeControls.editor.renderCtx();
                }
            }
        });
    }

    static createControl(shape: BaseShape) {
        shape.$control = $(`
            <div class="${ controlClass }" data-shape-id="${ shape.id }">
                <div class="${ controlClass }-handler ${ controlClass }__top" data-control="top"></div>
                <div class="${ controlClass }-handler ${ controlClass }__right" data-control="right"></div>
                <div class="${ controlClass }-handler ${ controlClass }__bottom" data-control="bottom"></div>
                <div class="${ controlClass }-handler ${ controlClass }__left" data-control="left"></div>
                <div class="${ controlClass }-handler ${ controlClass }__top-left" data-control="top,left"></div>
                <div class="${ controlClass }-handler ${ controlClass }__top-right" data-control="top,right"></div>
                <div class="${ controlClass }-handler ${ controlClass }__bottom-left" data-control="bottom,left"></div>
                <div class="${ controlClass }-handler ${ controlClass }__bottom-right" data-control="bottom,right"></div>
                <div class="${ controlClass }-size"></div>
            </div>
        `);

        this.$controlContainer.append(shape.$control);

        this.updateContol(shape);
    }

    static updateContol(shape: BaseShape) {
        if (shape.$control) {
            const { fromX, fromY, toX, toY, width, height } = shape.bound;

            shape.$control.css({
                top: Math.min(fromY, toY),
                left: Math.min(fromX, toX),
                width,
                height
            });

            shape.$control.find(`.${ controlClass }-size`).text(`${ Math.round(width) } × ${ Math.round(height) }`);

            Object.entries(shape.state).forEach(([stateName, stateValue]) => {
                shape.$control.toggleClass(stateName, stateValue);
            });
        }
    }

    static stop() {
        this.stopped = true;
    }

    static start() {
        this.stopped = false;
    }
}
