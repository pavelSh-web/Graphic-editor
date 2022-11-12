import Rect from '../shapes/Rect';
import BaseShape from '../shapes/BaseShape';
import ShapeControls from './ShapeControls';
import shapeModules from '../shapes';

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
        ShapeControls.create(this.shapes, this);

        this.initCanvas();
        this.loadFromLS();

        // @ts-ignore
        window.shapes = this.shapes;
    }

    loadFromLS() {
        const shapes = localStorage.getItem('shapes');

        if (shapes) {
            const shapesObject = JSON.parse(shapes);

            if (Array.isArray(shapesObject)) {
                shapesObject.forEach((shapeData) => {
                    // @ts-ignore
                    const shapeModule = shapeModules[shapeData.type];

                    if (shapeModule) {
                        const shapeInstance = new (shapeModule)({
                            ctx: this.ctx,
                            id: shapeData.id,
                            bound: shapeData.bound
                        });

                        shapeInstance.updateState({
                            created: true
                        });

                        this.shapes.push(shapeInstance);
                    }
                });

                this.renderCtx()
            }
        }
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

        $(window).on('resize', () => {
            this.updateViewport();
            this.renderCtx();
        });

        $('body').on('pointerdown', (e) => {
            const { pageX, pageY } = e as unknown as PointerEvent;
            const initialPointer = { pageX, pageY };

            ShapeControls.stop();

            const rect = new Rect({
                ctx: this.ctx,
                bound: {
                    fromX: pageX,
                    fromY: pageY
                }
            });

            this.shapes.push(rect);

            $('body').on('pointermove.shape', (e) => {
                const { pageX: x, pageY: y } = e as unknown as PointerEvent;

                rect.resize({
                    pointer: { x, y },
                    saveProportion: true
                });

                this.renderCtx();
            });

            $('body').one('pointerup.shape', (e) => {
                const { pageX, pageY } = e as unknown as PointerEvent;
                const distance = Math.sqrt((pageX - initialPointer.pageX) ** 2 + (pageY - initialPointer.pageY) ** 2);

                if (+distance.toFixed(0) <= 10) {
                    const { width, height } = rect.defaultSize;
                    rect.resize({
                        bound: {
                            width,
                            height,
                            fromX: rect.bound.fromX - (width / 2),
                            fromY: rect.bound.fromY - (height / 2)
                        }
                    })
                }

                rect.updateState({
                    focus: true,
                    created: true
                });

                $('body').off('.shape');

                this.renderCtx();

                ShapeControls.start();
            });
        });

        $(window).on('unload', this.saveToLS);

        this.renderCtx();
    }

    saveToLS() {
        this.shapes.forEach((shape) => {
            // Удаляем фигуру, если ее ширина или высота равна 0
            if ((!shape.bound.height || !shape.bound.width) && shape.state.created) {
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

        this.shapes.forEach(shape => shape.render());
    }

    clearCanvas() {
        const DPI = this.viewport.dpi;
        const width = this.viewport.width * DPI;
        const height = this.viewport.height * DPI;

        this.canvas.width  = width;
        this.canvas.height = height;

        this.ctx.scale(DPI, DPI);
    }
}
