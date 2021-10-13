import { BaseComponent } from '../../base';
import { MbscButtonOptions } from '../button/button';
import { MbscSegmentedGroupOptions } from './segmented-group';
export interface MbscSegmentedOptions extends MbscButtonOptions {
    checked?: boolean;
    defaultChecked?: boolean;
    inputClass?: string;
    name?: string;
    select?: 'single' | 'multiple';
    value?: string;
    onChange?: any;
    rtl?: boolean;
}
/** @hidden */
export interface MbscSegmentedState {
    disabled?: boolean;
    selected?: boolean;
    hasFocus?: boolean;
}
/** @hidden */
export declare class SegmentedBase extends BaseComponent<MbscSegmentedOptions, MbscSegmentedState> {
    static defaults: MbscSegmentedOptions;
    protected static _name: string;
    _box: HTMLElement | null;
    _checked: boolean;
    _color?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'dark' | 'light';
    _cssClass?: string;
    _disabled: boolean;
    _id: string;
    _isMultiple: boolean;
    _index: number;
    _name: string;
    _selectedIndex: number | undefined;
    _value: any;
    _animate: boolean;
    _onGroupChange: (ev: any, value: any) => void;
    private _unsubscribe;
    private _unlisten;
    _onChange: (ev: any) => void;
    _onValueChange: (value: any) => void;
    protected _change(checked: boolean): void;
    protected _toggle(checked: boolean): void;
    protected _groupOptions({ color, disabled, name, onChange, select, value }: MbscSegmentedGroupOptions): void;
    protected _mounted(): void;
    protected _updated(): void;
    protected _destroy(): void;
}
