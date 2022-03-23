import { BaseComponent } from '../../base';
import { MbscButtonOptions } from '../button/button';
import { MbscRadioGroupOptions } from './radio-group';
export interface MbscRadioOptions extends MbscButtonOptions {
    checked?: boolean;
    defaultChecked?: boolean;
    description?: string;
    label?: string;
    name?: string;
    value?: string;
    onChange?: any;
    position?: 'start' | 'end';
}
/** @hidden */
export interface MbscRadioState {
    checked?: boolean;
    disabled?: boolean;
    hasFocus?: boolean;
    isActive?: boolean;
}
/** @hidden */
export declare class RadioBase extends BaseComponent<MbscRadioOptions, MbscRadioState> {
    static defaults: MbscRadioOptions;
    protected static _name: string;
    _boxClass: string;
    _checked: boolean;
    _cssClass: string;
    _disabled: boolean;
    _name: string;
    _id: string;
    _input: HTMLInputElement;
    _value: any;
    _onGroupChange: (ev: any, value: any) => void;
    private _unlisten;
    private _unsubscribe;
    _onChange: (ev: any) => void;
    _onValueChange: (value: any) => void;
    protected _mounted(): void;
    protected _change(checked: boolean): void;
    protected _toggle(checked: boolean): void;
    protected _groupOptions({ color, disabled, name, onChange, position, rtl, value }: MbscRadioGroupOptions): void;
    protected _updated(): void;
    protected _destroy(): void;
}
