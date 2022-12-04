import React from 'react';
import ReactDOM from "react-dom/client";
import Colorpicker from "../views/Colorpicker";

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
