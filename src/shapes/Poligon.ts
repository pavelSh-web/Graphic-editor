import BaseShape, { ShapeOptions } from './BaseShape';

export default class Poligon extends BaseShape {
    override type = 'rectangle';

    constructor(options: ShapeOptions) {
        super(options);
    }

    override render() {
        super.render();

        this.ctx.save();

        const { fromX, fromY, toY, toX } = this.rotate();

        const path = new Path2D();

        path.rect(fromX, fromY, toX - fromX, toY - fromY);

        this.applyPathStyle(path);

        this.ctx.restore();
    }
}
