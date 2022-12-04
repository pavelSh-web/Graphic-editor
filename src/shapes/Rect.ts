import BaseShape, { ShapeOptions } from './BaseShape';

export default class Rect extends BaseShape {
    override type = 'rectangle';

    constructor(options: ShapeOptions) {
        super(options);
    }

    override render() {
        super.render();

        const { fromX, fromY, toY, toX } = this.data.bound;

        this.ctx.save();

        const path = new Path2D();

        path.rect(fromX, fromY, toX - fromX, toY - fromY);

        this.applyPathStyle(path);

        this.ctx.restore();
    }
}
