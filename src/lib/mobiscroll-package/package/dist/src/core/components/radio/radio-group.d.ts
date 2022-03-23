import { BaseComponent, IBaseProps } from '../../base';
export interface MbscRadioGroupOptions extends IBaseProps {
    color?: string;
    disabled?: boolean;
    name?: string;
    value?: any;
    position?: 'start' | 'end';
    onChange?: any;
}
/** @hidden */
export declare class RadioGroupBase extends BaseComponent<MbscRadioGroupOptions, any> {
    static defaults: MbscRadioGroupOptions;
    value: any;
    _groupClass: string;
    _name: string;
    private _id;
    _onChange: (ev: any, val: any) => void;
    protected _render(s: MbscRadioGroupOptions): void;
}
