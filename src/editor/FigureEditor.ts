import BaseShape from '../shapes/BaseShape';
import ShapeControls from './ShapeControls';
import shapeModules from '../shapes';
import {autorun, computed, makeObservable, observable} from 'mobx';

export default class FigureEditor {
    // @ts-ignore
    public canvas: HTMLCanvasElement;
    // @ts-ignore
    public ctx: CanvasRenderingContext2D;
    public viewport = {
        dpi: window.devicePixelRatio,
        width: document.documentElement.offsetWidth,
        height: window.innerHeight
    };

    public shapeModules: any;

    _activeType: string = 'rectangle';
    _activeFillColor: string = '#000000';
    _activeBorderColor: string = '#000000';
    _activeBorderWidth: number = 2;

    public shapes: BaseShape[] = [];

    public contols: ShapeControls;

    public get focusedShapes() {
        return this.shapes.filter(shape => shape.hasState('focus'));
    }

    get activeFillColor(): string {
        if (this.focusedShapes.length) {
            return this.focusedShapes[0].data.style.fill.color;
        }

        return this._activeFillColor;
    }

    get activeBorderColor(): string {
        if (this.focusedShapes.length) {
            return this.focusedShapes[0].data.style.border.color;
        }

        return this._activeBorderColor;
    }

    get activeBorderWidth(): number {
        if (this.focusedShapes.length) {
            return this.focusedShapes[0].data.style.border.width;
        }

        return this._activeBorderWidth;
    }

    get activeType(): string {
        this.resetState();

        return this._activeType;
    }

    set activeFillColor(color: string) {
        this._activeFillColor = color;

        this.focusedShapes.forEach(shape => shape.setFill({ color }));
    }

    set activeBorderColor(color: string) {
        this._activeBorderColor = color;

        this.focusedShapes.forEach(shape => shape.setBorder({ color }));
    }

    set activeBorderWidth(width: number) {
        this._activeBorderWidth = width;

        this.focusedShapes.forEach(shape => shape.setBorder({ width }));
    }

    // TODO: описать тип
    set activeType(type: string) {
        this._activeType = type;
    }

    constructor() {
        this.shapeModules = shapeModules;
        this.initMobx();

        this.contols = new ShapeControls(this.shapes, this);

        this.initCanvas();
        this.loadFromLS();

        // @ts-ignore
        // Только для дебага
        window.shapes = this.shapes;
    }

    initMobx() {
        makeObservable(this, {
            shapes: observable,
            _activeType: observable,
            _activeFillColor: observable,
            _activeBorderColor: observable,
            _activeBorderWidth: observable,
            focusedShapes: computed,
            activeType: computed,
            activeFillColor: computed,
            activeBorderColor: computed,
            activeBorderWidth: computed
        });

        autorun(() => {
            const needRender = this.shapes.some(shape => shape.hasState(['focus', 'resize', 'move', 'rotate'], true));

            if (needRender) {
                this.renderCtx();
            }
        });
    }

    // TODO pashtet: не работает
    loadFromLS() {
        const shapes = localStorage.getItem('shapes');

        // if (shapes) {
        //     const shapesObject = JSON.parse(shapes);
        //
        //     if (Array.isArray(shapesObject)) {
        //         shapesObject.forEach((shapeData) => {
        //             const shapeInstance = this.createShape(shapeData);
        //
        //             shapeInstance.updateState({
        //                 created: true
        //             });
        //
        //             this.renderCtx();
        //         });
        //     }
        // }
    }

    createShape(shapeData: any, skipRender = false) {
        // @ts-ignore
        const shapeModule = this.shapeModules[shapeData.type];

        if (shapeModule) {
            console.log(this.activeFillColor);
            const shapeInstance = observable(new (shapeModule)({
                ctx: this.ctx,
                id: shapeData.id,
                bound: shapeData.bound,
                style: {
                    fill: {
                        color: this.activeFillColor
                    },
                    border: {
                        color: this.activeBorderColor,
                        width: this.activeBorderWidth
                    }
                }
            }));

            console.log(shapeInstance.data.style.fill.color);

            this.pushShape(shapeInstance);

            if (!skipRender) {
                this.renderCtx();
            }

            this.contols.createControl(shapeInstance);

            return shapeInstance;
        }

        return null;
    }

    resetState() {
        this.shapes.forEach(shape => shape.resetStates());
    }

    pushShape(shape: BaseShape) {
        this.shapes.push(shape);
    }

    moveLayer({ position, shape }: { position: 'start' | 'end' | 'top' | 'bottom', shape?: BaseShape }) {
        const shapes = shape ? [shape] : this.focusedShapes;

        const shapeIndex = this.shapes.indexOf(shapes[0]);
        const shapesLength = this.shapes.length;

        const positions = {
            start: 0,
            end: shapesLength,
            top: Math.max(shapeIndex + 1, shapesLength),
            bottom: Math.min(shapeIndex - 1, 0)
        }

        if (shapes.length) {
            this.shapes.splice(shapeIndex, shapes.length);
            this.shapes.splice(positions[position],0, ...shapes);
        }

        shapes.forEach(shape => shape.updateState({ focus: true }));
    }

    deleteShape(shape: BaseShape) {
        if (shape) {
            const shapeIndex = this.shapes.indexOf(shape);

            shape.destroy();

            this.shapes.splice(shapeIndex, 1);

            this.renderCtx();
        }
    }

    initCanvas() {
        this.canvas = $('<canvas class="editor-canvas"></canvas>')[0] as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;

        $('body').append(this.canvas);

        $(window).on('resize', this.renderCtx);

        $('body').on('pointerdown', (e) => {
            const { pageX, pageY } = e as unknown as PointerEvent;
            const initialPointer = { pageX, pageY };

            this.contols.stop();

            const shape = this.createShape({
                type: this.activeType,
                ctx: this.ctx,
                bound: {
                    fromX: pageX,
                    fromY: pageY
                }
            }, true);

            if (!shape) {
                return;
            }

            $('body').on('pointermove.shape', (e) => {
                const { pageX: x, pageY: y } = e as unknown as PointerEvent;

                shape.resize({
                    pointer: { x, y },
                    saveProportion: true
                });

                this.renderCtx();
            });

            this.contols.$controlContainer.one('pointerup.figure-editor', (e) => {
                const { pageX, pageY } = e as unknown as PointerEvent;
                const distance = Math.sqrt((pageX - initialPointer.pageX) ** 2 + (pageY - initialPointer.pageY) ** 2);

                if (+distance.toFixed(0) <= 10) {
                    const { width, height } = shape.defaultSize;
                    const { fromX, fromY } = shape.data.bound;

                    shape.resize({
                        bound: {
                            width,
                            height,
                            fromX: fromX - (width / 2),
                            fromY: fromY - (height / 2)
                        }
                    })
                }

                shape.updateState({
                    focus: true,
                    created: true
                });

                $('body').off('.shape');

                this.renderCtx();

                this.contols.start();
            });
        });

        $(window).on('unload', this.saveToLS);

        this.renderCtx();
    }

    saveToLS() {
        this.shapes.forEach((shape) => {
            // Удаляем фигуру, если ее ширина или высота равна 0
            if ((!shape.height || !shape.width) && shape.hasState('created')) {
                this.deleteShape(shape);

                return;
            }
        });

        localStorage.setItem('shapes', JSON.stringify(this.shapes));
    }

    updateViewport() {
        this.viewport = {
            dpi: window.devicePixelRatio,
            width: document.documentElement.offsetWidth,
            height: window.innerHeight
        };
    }

    renderCtx() {
        this.updateViewport()
        this.clearCanvas();

        this.ctx.save();

        this.shapes.forEach(shape => shape.render());

        this.ctx.restore();
    }

    clearCanvas() {
        const DPI = this.viewport.dpi;
        const width = this.viewport.width * DPI;
        const height = this.viewport.height * DPI;

        this.canvas.width  = width;
        this.canvas.height = height;

        this.ctx.scale(1, 1);
    }
}
