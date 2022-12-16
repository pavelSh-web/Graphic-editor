import React from 'react';
import { observer } from "mobx-react";
import {RGBToHex} from "../helpers";

const Colorpicker = observer((props: any) => {
    const { onClose, options } = props;
    const colorList = ['#469EC3', '#02747F', '#42A8AA', '#C7986A', '#A5BBAF', '#ff9e3d', '#E4B460', '#f22424'];

    const select = (color: string) => {
        onClose?.(color);
    }

    const picker = async () => {
        // @ts-ignore
        if (!/Opera|OPR\//.test(navigator.userAgent) && typeof EyeDropper === 'function') {
            // @ts-ignore
            const picker = new EyeDropper();

            try {
                const { sRGBHex } = await picker.open();

                select(RGBToHex(sRGBHex))
            }
            catch(err) { /* canceled */ }
        }
    }

    return (
        <div className="colorpicker">
            <div className="colorpicker-pallete">
                <div className="color-list">
                    { colorList.map(color => <div className="color-item" style={{ background: color }} onClick={ () => select(color) }/>) }
                </div>
                <div className="color-list settings-list">
                    <div className="color-item transparent" onClick={ () => select('transparent') }/>
                    <div className="color-item picker" onClick={ () => picker() }/>
                </div>
            </div>
        </div>
    );
});

export default Colorpicker;
