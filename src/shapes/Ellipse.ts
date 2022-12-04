import BaseShape, { ShapeOptions } from './BaseShape';

export default class Ellipse extends BaseShape {
    override type = 'ellipse';

    constructor(options: ShapeOptions) {
        super(options);
    }

    override render() {
        super.render();

        const { fromX, fromY, toY, toX, width, height } = this.data.bound;

        const centerX = Math.max(fromX, toX) - width / 2;
        const centerY = Math.max(fromY, toY) - height / 2;

        this.ctx.save();

        const path = new Path2D();

        path.ellipse(centerX, centerY, width / 2, height / 2, 0, 0, 2 * Math.PI);

        this.applyPathStyle(path);

        this.ctx.restore();
    }
}
