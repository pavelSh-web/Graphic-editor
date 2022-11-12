import BaseShape, { ShapeOptions } from './BaseShape';

export default class Rect extends BaseShape {
    override type = 'rectange';

    constructor(options: ShapeOptions) {
        super(options);
    }

    override render() {
        const { fromX, fromY, toY, toX } = this.bound;

        this.ctx.fillRect(fromX, fromY, toX - fromX, toY - fromY);
    }
}
