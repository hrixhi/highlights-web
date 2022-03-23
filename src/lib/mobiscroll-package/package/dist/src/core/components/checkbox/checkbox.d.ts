import { BaseComponent, IBaseProps } from '../../base';
export interface MbscCheckboxOptions extends IBaseProps {
    checked?: boolean;
    color?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'dark' | 'light';
    defaultChecked?: boolean;
    description?: string;
    disabled?: boolean;
    onChange?: any;
    inputStyle?: 'underline' | 'box' | 'outline';
    label?: string;
    position?: 'start' | 'end';
}
/** @hidden */
export interface MbscCheckboxState {
    checked?: boolean;
    disabled?: boolean;
    hasFocus?: boolean;
    isActive?: boolean;
}
/** @hidden */
export declare class CheckboxBase extends BaseComponent<MbscCheckboxOptions, MbscCheckboxState> {
    static defaults: MbscCheckboxOptions;
    protected static _name: string;
    _boxClass: string;
    _checked: boolean;
    _cssClass: string;
    _disabled: boolean;
    _input: HTMLInputElement;
    private _unlisten;
    _onChange: (ev: any) => void;
    protected _mounted(): void;
    protected _change(checked: boolean): void;
    protected _render(s: MbscCheckboxOptions, state: MbscCheckboxState): void;
    protected _destroy(): void;
}
