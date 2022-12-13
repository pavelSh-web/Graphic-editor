import BaseShape, { ShapeOptions } from './BaseShape';
import BaseLine from './BaseLine';
import { reaction } from 'mobx';

export default class Bezier extends BaseShape {
    line: BaseLine;
    override allowRotate = false;

    constructor(options: ShapeOptions) {
        super(options);

        this.line = new BaseLine({});

        $(document).on('keydown.shape-escape', (e: any) => {
            if (e.code === 'Escape' || e.code === 'Enter') {
                $(document).off('.shape-escape');

                this.created();
            }
        });

        reaction(
            () => this.line.data.dots,
            (dots) => {
                const Xs = dots.map(dot => dot.point.x);
                const Ys = dots.map(dot => dot.point.y);

                this.updateBound({
                    fromX: Math.min(...Xs),
                    fromY: Math.min(...Ys),
                    toX: Math.max(...Xs),
                    toY: Math.max(...Ys)
                });
            }
        );
    }

    created() {
        this.ctx.closePath();
        this.line.setDotPositionType('percents', this.data.bound);
        this.updateState({
            focus: true,
            created: true
        });
    }

    override createDown(e: any) {
        if (this.hasState('created')) {
            return;
        }

        this.line.addDot({
            x: e.pageX,
            y: e.pageY
        });
    }

    override createDoubleClick(e: any) {
        this.created();
    }

    override createMove(e: Event, initialPointer: any) {
        if (this.hasState('created')) {
            return;
        }

        requestAnimationFrame(() => {
            this.renderPreviewLine(e, initialPointer);
        });
    }

    override createUp() {}

    override render() {
        super.render();

        this.ctx.save();

        const points = this.line.getNormalizedDotPoints(this.data.bound);

        if (points.length) {
            this.ctx.beginPath();
            // this.ctx.moveTo(x, y);

            points.forEach((point, index) => {
                const { x: fromX, y: fromY } = point;

                this.ctx.bezierCurveTo(fromX, fromY, fromX, fromY, fromX, fromY);
            });
        }

        this.ctx.stroke();

        this.ctx.restore();
    }

    renderPreviewLine(e: any, initialPointer: any) {
        this.ctx.save();

        this.ctx.strokeStyle = '#477eff';
        this.ctx.lineWidth = 1;

        const points = this.line.getNormalizedDotPoints(this.data.bound);

        const { x, y } = initialPointer;
        const { pageX, pageY } = e;
        const fromX = points.length ? points[points.length - 1].x : x;
        const fromY = points.length ? points[points.length - 1].y : y;

        this.ctx.beginPath();
        this.ctx.moveTo(fromX, fromY);

        this.ctx.bezierCurveTo(pageX, pageY, pageX, pageY, pageX, pageY);

        this.ctx.setLineDash([5, 10]);
        this.ctx.stroke();

        this.ctx.restore();
    }
}
