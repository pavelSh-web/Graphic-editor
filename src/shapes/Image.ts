import BaseShape, { ShapeOptions } from './BaseShape';
import { computed, makeObservable, observable } from 'mobx';

type ImageData = {
    interpolation: 'linear' | 'stepwise',
    proportion: number,
    dataUrl: string,
    width: number,
    height: number
}

export default class ImageShape extends BaseShape {
    override type = 'image';
    // @ts-ignore
    image: ImageData = {
        interpolation: 'linear'
    };

    override defaultSize = {
        width: 600,
        height: 600
    };

    constructor(options: ShapeOptions) {
        super(options);

        makeObservable(this, {
            image: observable
        });
    }

    setImage(imageData: Partial<ImageData>) {
        this.image = {
            ...this.image,
            ...imageData
        };
    }

    override render() {
        super.render();

        this.ctx.save();

        const { fromX, fromY, toX, toY, width, height } = this.rotate();
        const x = Math.min(fromX, toX);
        const y = Math.min(fromY, toY);

        const imageObj = new Image(width, height);

        imageObj.src = this.image.dataUrl;

        const fillPath = new Path2D();
        const borderPath = new Path2D();

        fillPath.rect(x, y, width, height);
        this.ctx.fill(fillPath);

        if (this.image.interpolation !== 'linear') {
            this.ctx.imageSmoothingEnabled = false;
        }

        this.ctx.drawImage(
            imageObj,
            x,
            y,
            width,
            height
        );

        borderPath.rect(x, y, width, height);
        this.ctx.clip(borderPath);
        this.ctx.lineWidth *= 2;
        this.ctx.stroke(borderPath);

        this.ctx.restore();
    }
}



//         super.render();
//
//         this.ctx.save();
//
//         const { fromX, fromY, toX, toY, width, height } = this.rotate();
//         const x = Math.min(fromX, toX);
//         const y = Math.min(fromY, toY);
//
//         let imageWidth = width;
//         let imageHeight = width * (this.image.proportion + 1);
//
//         if (imageHeight > height) {
//             imageWidth = height * (this.image.proportion + 1);
//             imageHeight = height;
//         }
//
//         console.log({
//             imageWidth,
//             imageHeight,
//             width,
//             height
//         })
//
//         const imageObj = new Image(width, height);
//         const imageCenterPoint = {
//             x: imageWidth / 2,
//             y: imageHeight / 2
//         };
//         const shapeCenterPoint = {
//             x: width / 2,
//             y: height / 2
//         };
//
//         imageObj.src = this.image.dataUrl;
//
//         const path = new Path2D();
//
//         path.rect(x, y, width, height);
//         this.applyPathStyle(path);
//
//         this.ctx.drawImage(
//             imageObj,
//             // Math.abs(imageCenterPoint.x - shapeCenterPoint.x),
//             // Math.abs(imageCenterPoint.y - shapeCenterPoint.y),
//             0,
//             0,
//             Math.min(width, imageWidth),
//             Math.min(height, imageHeight),
//             x,
//             y,
//             width,
//             height
//         );
//
//         this.ctx.restore();

