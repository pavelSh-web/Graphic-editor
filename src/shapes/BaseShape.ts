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

export type ShapeFill = {
    color: string
}

export type ShapeBorder = {
    color: string,
    width: number
}

export type ShapeStyle = {
    fill: ShapeFill,
    border: ShapeBorder
}

export type ShapeOptions = {
    style: Partial<ShapeStyle>,
    state?: Partial<ShapeState>,
    bound?: Partial<ShapeBound>,
    ctx: CanvasRenderingContext2D,
    id?: number
}

export default class BaseShape {
    id: number;
    type: string = '';
    ctx: CanvasRenderingContext2D;

    data: { state: ShapeState, bound: ShapeBound, style: ShapeStyle } = {
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

    setFill(fill: Partial<ShapeFill>) {
        this.data.style.fill = {
            ...this.data.style.fill,
            ...fill
        }
    }

    setBorder(border: Partial<ShapeBorder>) {
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
