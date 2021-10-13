import { BaseComponent, IBaseProps } from '../../base';
export interface MbscInputOptions extends IBaseProps {
    autoComplete?: string;
    clearIcon?: string;
    defaultValue?: string;
    disabled?: boolean;
    dropdown?: boolean;
    dropdownIcon?: string;
    endIcon?: string;
    endIconSrc?: string;
    endIconSvg?: string;
    error?: boolean;
    errorMessage?: string;
    hideIcon?: string;
    hideIconSvg?: string;
    inputClass?: string;
    inputStyle?: 'underline' | 'box' | 'outline';
    label?: string;
    labelStyle?: 'stacked' | 'inline' | 'floating';
    /** @hidden */
    notch?: boolean;
    onChange?: any;
    onInput?: any;
    passwordToggle?: boolean;
    pickerMap?: any;
    pickerValue?: any;
    placeholder?: string;
    readOnly?: boolean;
    /** @hidden */
    ripple?: boolean;
    rows?: number;
    showIcon?: string;
    showIconSvg?: string;
    startIcon?: string;
    startIconSrc?: string;
    startIconSvg?: string;
    tags?: boolean;
    type?: string;
    value?: string;
}
/** @hidden */
export interface MbscInputState {
    disabled?: boolean;
    files?: string;
    hasFocus?: boolean;
    hasHover?: boolean;
    height?: number;
    isActive?: boolean;
    isFloatingActive?: boolean;
    value?: string;
}
/**
 * @hidden
 */
export declare class InputBase extends BaseComponent<MbscInputOptions, MbscInputState> {
    static defaults: MbscInputOptions;
    protected static _name: string;
    value: any;
    _cssClass: string;
    _disabled: boolean;
    _dummyElmClass: string;
    _endIconClass: string;
    _errorClass: string;
    _fieldSetClass: string;
    _hasEndIcon: boolean;
    _hasError: boolean;
    _hasStartIcon: boolean;
    _hidePass: boolean;
    _iconShow: boolean;
    _iconHide: boolean;
    _innerClass: string;
    _labelClass: string;
    _legendClass: string;
    _nativeElmClass: string;
    _passIconClass: string;
    _rippleClass: string;
    _selectIconClass: string;
    _startIconClass: string;
    _tabIndex: number | undefined;
    _tagsArray: string[];
    protected _tag: string;
    private _animateFloating;
    private _preventFocus;
    private _prevValue;
    private _shouldSize;
    private _unsubscribe;
    private _valueChecked;
    private _unlisten;
    _onClick: () => void;
    _onMouseDown: (ev: any) => void;
    _onTagClear: (ev: any, index: number) => void;
    protected _checkFloating(): void;
    protected _mounted(): void;
    protected _render(s: MbscInputOptions, state: MbscInputState): void;
    protected _updated(): void;
    protected _destroy(): void;
    private _onAutoFill;
    private _sizeTextArea;
}
