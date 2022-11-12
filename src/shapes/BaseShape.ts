import FigureEditor from '../editor/FigureEditor';
import { getRandomId } from '../helpers';
import ShapeControls from '../editor/ShapeControls';

export type State = 'hover' | 'focus' | 'move' | 'resize' | 'created';
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

export type ShapeOptions = {
    state?: Partial<ShapeState>,
    bound?: Partial<ShapeBound>,
    ctx: CanvasRenderingContext2D,
    id?: number
}

export default class BaseShape {
    id: number;
    type: string = '';
    ctx: CanvasRenderingContext2D;
    state: ShapeState = {
        move: false,
        hover: false,
        focus: false,
        resize: false,
        created: false
    }
    bound: ShapeBound = {
        fromX: 0,
        fromY: 0,
        toX: 0,
        toY: 0,
        width: 0,
        height: 0
    };
    defaultSize: ShapeSize = {
        width: 100,
        height: 100
    }
    // @ts-ignore
    $control: JQuery;

    constructor(options: ShapeOptions) {
        if (options.bound) {
            this.updateBound(options.bound);
        }

        if (options.state) {
            this.updateState(options.state);
        }

        this.ctx = options.ctx;
        this.id = options.id ?? getRandomId();
    }

    public move({ x, y }: Partial<ShapeTransformPointer>) {
        this.updateBound({
            fromX: x ?? this.bound.fromX,
            fromY: y ?? this.bound.fromY,
            width: this.bound.width,
            height: this.bound.height
        }, false);
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

    render() {}
    
    private updateBound(bound: Partial<ShapeBound>, updateSize = true) {
        this.bound = {
            ...this.bound,
            ...bound
        };

        if (bound.width) {
            this.bound.toX = this.bound.fromX + bound.width;
        }
        else {
            this.bound.width = Math.abs(this.bound.toX - this.bound.fromX);
        }

        if (bound.height) {
            this.bound.toY = this.bound.fromY + bound.height;
        }
        else {
            this.bound.height = Math.abs(this.bound.toY - this.bound.fromY);
        }
    }

    updateState(states: Partial<ShapeState>) {
        this.state = {
            ...this.state,
            ...states
        }

        // Мега костыль
        if (states.created) {
            this.normalizeBound();

            ShapeControls.createControl(this);
        }

        ShapeControls.updateContol(this);
    }

    normalizeBound() {
        const { fromX, fromY, toX, toY } = this.bound;

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
        Object.entries(this.state).forEach(([, stateValue]) => {
            stateValue = false;
        });

        ShapeControls.updateContol(this);
    }

    destroy() {
        if (this.$control) {
            this.$control.remove();
        }
    }
}
