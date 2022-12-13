import { getRandomId } from '../helpers';
import {
    observable,
    makeObservable,
    action,
    computed,
} from 'mobx';

export type State = 'hover' | 'focus' | 'move' | 'resize' | 'rotate' | 'created';
export type TransformOrigin = 'start' | 'end'; // | 'center'
export type ShapeTransformOrigin = Record<'x' | 'y', TransformOrigin>;
export type ShapeTransformPointer = Record<'x' | 'y', number>;
export type ShapeState = Record<State, boolean>;
export type ShapeSize = Record<'width' | 'height', number>;
export type ShapeBound = {
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    width: number,
    height: number
}

export type IFill = {
    color: string
}

export type IBorder = {
    color: string,
    width: number
}

export type IStyle = {
    fill: IFill,
    border: IBorder
}

export type ShapeOptions = {
    style: Partial<IStyle>,
    state?: Partial<ShapeState>,
    bound?: Partial<ShapeBound>,
    rotate?: number,
    ctx: CanvasRenderingContext2D,
    id?: number
}

export default class BaseShape {
    id: number;
    type: string = '';
    ctx: CanvasRenderingContext2D;

    allowRotate: boolean = true;

    data: { state: ShapeState, bound: ShapeBound, rotate: number, style: IStyle } = {
        state: {
            move: false,
            hover: false,
            focus: false,
            resize: false,
            rotate: false,
            created: false
        },
        bound: {
            fromX: 0,
            fromY: 0,
            toX: 0,
            toY: 0,
            width: 0,
            height: 0
        },
        rotate: 0,
        style: {
            fill: {
                color: '#000000'
            },
            border: {
                width: 10,
                color: 'transparent'
            }
        }
    };

    defaultSize: ShapeSize = {
        width: 100,
        height: 100
    }
    // @ts-ignore
    $control: JQuery;

    get width() {
        return this.data.bound.width;
    }

    get height() {
        return this.data.bound.height;
    }

    constructor(options: ShapeOptions) {
        if (options.bound) {
            this.updateBound(options.bound);
        }

        if (options.state) {
            this.updateState(options.state);
        }

        if (options.style && options.style.border) {
            this.setBorder(options.style.border);
        }

        if (options.style && options.style.fill) {
            this.setFill(options.style.fill);
        }

        this.ctx = options.ctx;
        this.id = options.id ?? getRandomId();

        makeObservable(this, {
            data: observable,
            height: computed,
            width: computed,
            updateState: action,
            updateBound: action,
            resetStates: action
        });
    }

    public move({ x, y }: Partial<ShapeTransformPointer>) {
        this.updateBound({
            fromX: x ?? this.data.bound.fromX,
            fromY: y ?? this.data.bound.fromY,
            width: this.data.bound.width,
            height: this.data.bound.height
        });
    }

    public resize({ origin = { x: 'start', y: 'start' }, pointer, bound, saveProportion }: { origin?: ShapeTransformOrigin, bound?: Partial<ShapeBound>, pointer?: ShapeTransformPointer, saveProportion?: boolean }) {
        if (bound) {
            return this.updateBound(bound);
        }

        if (pointer) {
            // if (saveProportion) {
            //     const currentToX = this.bound.toX || 1;
            //     const currentToY = this.bound.toY || 1;
            //     const maxCoord = Math.abs(pointer.x - currentToX) > Math.abs(pointer.y - currentToY) ? currentToX - pointer.x : currentToY - pointer.y;
            //
            //     pointer.x = currentToX + maxCoord;
            //     pointer.y = currentToY + maxCoord;
            // }

            this.updateBound({
                toX: pointer.x,
                toY: pointer.y
            });
        }
    }

    protected applyPathStyle(path: Path2D) {
        this.ctx.clip(path);
        this.ctx.lineWidth *= 2;
        this.ctx.fill(path);
        this.ctx.stroke(path);
    }

    render() {
        const { fill, border } = this.data.style;

        this.ctx.fillStyle = fill.color;
        this.ctx.strokeStyle = border.color;
        this.ctx.lineWidth = border.width;
    }

    protected rotate(): ShapeBound {
        if (!this.data.state.created) {
            return this.data.bound;
        }

        const { fromX, fromY, toX, toY, width, height } = this.data.bound;
        this.ctx.translate(Math.min(fromX, toX) + width / 2, Math.min(fromY, toY) + height / 2);

        const normX = toX < fromX ? -1 : 1;
        const normY = toY < fromY ? -1 : 1;

        this.ctx.rotate(this.data.rotate * (Math.PI / 180));

        return {
            fromX: width / 2 * -normX,
            fromY: height / 2 * -normY,
            toX: width / 2 * normX,
            toY: height / 2 * normY,
            width,
            height,
        };
    }

    updateBound(bound: Partial<ShapeBound>) {
        this.data.bound = {
            ...this.data.bound,
            ...bound
        };

        if (bound.width) {
            this.data.bound.toX = this.data.bound.fromX + bound.width;
        }
        else {
            this.data.bound.width = Math.abs(this.data.bound.toX - this.data.bound.fromX);
        }

        if (bound.height) {
            this.data.bound.toY = this.data.bound.fromY + bound.height;
        }
        else {
            this.data.bound.height = Math.abs(this.data.bound.toY - this.data.bound.fromY);
        }
    }


    updateState(states: Partial<ShapeState>) {
        this.data.state = {
            ...this.data.state,
            ...states
        }

        if (states.created) {
            this.normalizeBound();
        }
    }

    setFill(fill: Partial<IFill>) {
        this.data.style.fill = {
            ...this.data.style.fill,
            ...fill
        }
    }

    setBorder(border: Partial<IBorder>) {
        this.data.style.border = {
            ...this.data.style.border,
            ...border
        }
    }

    hasState(state: State | State[], some = false) {
        const states = Array.isArray(state) ? state : [state];

        return some ? states.some(state => this.data.state[state]) : states.every(state => this.data.state[state]);
    }

    normalizeBound() {
        const { fromX, fromY, toX, toY } = this.data.bound;

        if (toX < fromX) {
            this.updateBound({
                fromX: toX,
                toX: fromX
            });
        }

        if (toY < fromY) {
            this.updateBound({
                fromY: toY,
                toY: fromY
            });
        }
    }

    createDown(e: any) {}
    createDoubleClick(e: any) {}

    createUp(e: any, initialPointer: any) {
        const { pageX, pageY } = e as unknown as PointerEvent;
        const distance = Math.sqrt((pageX - initialPointer.pageX) ** 2 + (pageY - initialPointer.pageY) ** 2);

        console.trace('here');

        if (+distance.toFixed(0) <= 10) {
            const { width, height } = this.defaultSize;
            const { fromX, fromY } = this.data.bound;

            this.resize({
                bound: {
                    width,
                    height,
                    fromX: fromX - (width / 2),
                    fromY: fromY - (height / 2)
                }
            })
        }

        this.updateState({
            focus: true,
            created: true
        });
    }

    createMove(e: any, initialPointer: any) {
        const { pageX: x, pageY: y } = e as unknown as PointerEvent;

        this.resize({
            pointer: { x, y },
            saveProportion: true
        });
    }

    resetStates() {
        this.updateState({
            move: false,
            hover: false,
            focus: false,
            resize: false
        });
    }

    destroy() {
        if (this.$control) {
            this.$control.remove();
        }
    }
}
