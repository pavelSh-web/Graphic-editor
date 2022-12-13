import { getRandomId } from '../helpers';
import { makeObservable, observable } from 'mobx';
import { ShapeBound } from './BaseShape';

export type LineDot = {
    id: number,
    point: {
        x: number,
        y: number
    }
}

export type LineOptions = {
    id?: number
}

export type LinePositionType = 'pixels' | 'percents';


export default class BaseLine {
    id?: number = 0;
    options: LineOptions = {
        id: 0
    };

    data: { dots: LineDot[], positionType: LinePositionType } = {
        positionType: 'pixels',
        dots: []
    };

    constructor(options: Partial<LineOptions>) {
        this.options = options;
        this.id = options.id ?? getRandomId();

        makeObservable(this.data, {
            dots: observable
        });
    }

    addDot(point: { x: number, y: number }) {
        const dot = {
            point,
            id: getRandomId()
        };

        this.data.dots = [...this.data.dots, dot];
    }

    updateDotPosition(id: number, point: { x: number, y: number }) {
        const dot = this.data.dots.find(dot => dot.id === id);

        if (dot) {
            dot.point = point;
        }
    }

    setDotPositionType(positionType: LinePositionType, bound: ShapeBound) {
        if (positionType === this.data.positionType) {
            return;
        }

        const { fromX, fromY, toX, toY, width, height } = bound;

        if (positionType === 'percents') {
            this.data.dots.forEach((dot) => {
                const currentPoint = dot.point;
                const newPoint = {
                    x: (currentPoint.x - Math.min(fromX, toX)) / width * 100,
                    y: (currentPoint.y - Math.min(fromY, toY)) / height * 100
                }

                this.updateDotPosition(dot.id, newPoint);
            });
        }
        // TODO pashtet
        else {}

        this.data.positionType = positionType;
    }

    getNormalizedDotPoints(bound: ShapeBound) {
        const { fromX, fromY, toX, toY, width, height } = bound;

        if (this.data.positionType === 'percents') {
            return this.data.dots.map((dot) => {

                const { x, y } = dot.point;

                return {
                    x: (x * width / 100) + Math.min(fromX, toX),
                    y: (y * height / 100) + Math.min(fromY, toY),
                };
            });
        }

        return this.data.dots.map(dot => dot.point);
    }
}
