import React from 'react';
import ReactDOM from "react-dom/client";
import Colorpicker from "../views/Colorpicker";

const stickingAngles = [0, 45, 90, 135, 180, 225, 270, 315, -45, -90, -135, -180, -225, -270, -315];

type Point = {
    x: number,
    y: number
}

export const inRange = (range: number[], num: number) => {
    range = range.sort((a, b) => a - b);

    return num >= range[0] && num <= range[1];
}

export const stickAngle = (angle: number, step = 5) => {
    let resultAngle = angle;

    stickingAngles.some((stickAngle) => {
        if (inRange([stickAngle - step, stickAngle + step], angle)) {
            resultAngle = stickAngle;

            return true;
        }

        return false;
    });

    return resultAngle;
}

export const getRandomId = () => {
    return Math.floor(Math.random() * 10000);
}

export function RGBToHex(rgb: string) {
    // Choose correct separator
    let sep = rgb.indexOf(",") > -1 ? "," : " ";
    // Turn "rgb(r,g,b)" into [r,g,b]
    // @ts-ignore
    rgb = rgb.substr(4).split(")")[0].split(sep);

    let r = (+rgb[0]).toString(16),
        g = (+rgb[1]).toString(16),
        b = (+rgb[2]).toString(16);

    if (r.length == 1)
        r = "0" + r;
    if (g.length == 1)
        g = "0" + g;
    if (b.length == 1)
        b = "0" + b;

    return "#" + r + g + b;
}

// vectors
export const getVector = (p1: Point, p2: Point) => {
    return {
        x: p2.x - p1.x,
        y: p2.y - p1.y
    };
};

export const dotProduct = (v1: Point , v2: Point) => {
    return v1.x * v2.x + v1.y * v2.y;
};

export const crossProduct = (v1: Point , v2: Point) => {
    return v1.x * v2.y - v1.y * v2.x;
};

export const getAngle =  (v1: Point , v2: Point) => {
    var dot = dotProduct(v1, v2);
    var cross = crossProduct(v1, v2);

    return Math.atan2(cross, dot);
};

export const openColorpicker = (event: any, editor: any, options: any, onClose = (color?: any) => {}) => {
    const $colorpickerWrap = $('<div class="colorpicker-overlay"/>');
    const { top, left } = event.target.closest('.settings-editor').getBoundingClientRect();

    $colorpickerWrap.on('pointerdown', (e) => {
         if ($(e.target).hasClass('colorpicker-overlay')) {
            $colorpickerWrap.remove();
            onClose();
         }
         else {
             e.stopPropagation();
         }
    });

    $('body').append($colorpickerWrap);

    const colorpickerRoot = ReactDOM.createRoot($colorpickerWrap[0]);

    colorpickerRoot.render(React.createElement(Colorpicker, {
        editor,
        options,
        onClose: (color: any) => {
            $colorpickerWrap.remove();
            onClose(color);
        }
    }, null));


    requestAnimationFrame(() => {
        $colorpickerWrap.find('.colorpicker').css({
            top,
            left
        });
    });
}
