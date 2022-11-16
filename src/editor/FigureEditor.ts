import BaseShape from '../shapes/BaseShape';
import ShapeControls from './ShapeControls';
import shapeModules from '../shapes';
import { autorun, isObservable, makeObservable, observable } from 'mobx';

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

    public shapes: BaseShape[] = [];

    constructor() {
        this.initMobx();

        ShapeControls.create(this.shapes, this);

        this.initCanvas();
        this.loadFromLS();

        // @ts-ignore
        // Только для дебага
        window.shapes = this.shapes;
    }

    initMobx() {
        makeObservable(this, {
            shapes: observable
        });

        autorun(() => {
            const needRender = this.shapes.some(shape => shape.hasState(['resize', 'move', 'rotate'], true));

            if (needRender) {
                this.renderCtx();
            }
        });
    }

    loadFromLS() {
        const shapes = localStorage.getItem('shapes');

        if (shapes) {
            const shapesObject = JSON.parse(shapes);

            if (Array.isArray(shapesObject)) {
                shapesObject.forEach((shapeData) => {
                    const shapeInstance = this.createShape(shapeData);

                    shapeInstance.updateState({
                        created: true
                    });

                    this.renderCtx();
                });
            }
        }
    }

    createShape(shapeData: any) {
        // @ts-ignore
        const shapeModule = shapeModules[shapeData.type];

        if (shapeModule) {
            const shapeInstance = observable(new (shapeModule)({
                ctx: this.ctx,
                id: shapeData.id,
                bound: shapeData.bound
            }));

            this.pushShape(shapeInstance);

            return shapeInstance;
        }

        return null;
    }

    pushShape(shape: BaseShape) {
        this.shapes.push(shape);
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

            ShapeControls.stop();

            const shape = this.createShape({
                type: this.shapes.length % 2 ? 'ellipse' : 'rectangle',
                ctx: this.ctx,
                bound: {
                    fromX: pageX,
                    fromY: pageY
                }
            });

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

            $('body').one('pointerup.shape', (e) => {
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

                ShapeControls.start();
            });
        });

        // $(window).on('unload', this.saveToLS);

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
