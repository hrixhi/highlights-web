import { BaseComponent, IBaseProps } from '../../base';
import { DisplayType, IPopupButton, MbscPopupButton, MbscPopupPredefinedButton, PopupBase } from '../../components/popup/popup';
/**
 * Options for all picker components
 */
export interface IPickerProps extends IBaseProps {
    activeElm?: HTMLElement | string;
    defaultSelection?: any;
    defaultValue?: any;
    disabled?: boolean;
    element?: any;
    inputComponent?: any;
    inputProps?: any;
    invalid?: any[];
    selectMultiple?: boolean;
    showInput?: boolean;
    showOnFocus?: boolean;
    showOnClick?: boolean;
    valid?: any[];
    value?: any;
    valueMap?: any;
    dropdown?: boolean;
    endIcon?: string;
    endIconSrc?: string;
    endIconSvg?: string;
    error?: boolean;
    errorMessage?: string;
    inputStyle?: 'underline' | 'outline' | 'box';
    label?: string;
    labelStyle?: 'floating' | 'stacked' | 'inline';
    name?: string;
    placeholder?: string;
    startIcon?: string;
    startIconSrc?: string;
    startIconSvg?: string;
    tagInput?: boolean;
    anchor?: HTMLElement;
    anchorAlign?: 'start' | 'end' | 'center';
    animation?: 'pop' | 'slide-down' | 'slide-up' | boolean;
    buttons?: Array<MbscPopupButton | MbscPopupPredefinedButton | string>;
    closeOnEsc?: boolean;
    closeOnOverlayClick?: boolean;
    closeOnScroll?: boolean;
    display?: DisplayType;
    focusOnClose?: boolean;
    focusTrap?: boolean;
    fullScreen?: boolean;
    headerText?: string;
    height?: string | number;
    isOpen?: boolean;
    maxHeight?: string | number;
    maxWidth?: string | number;
    scrollLock?: boolean;
    showArrow?: boolean;
    showOverlay?: boolean;
    width?: string | number;
    cancelText?: string;
    clearText?: string;
    closeText?: string;
    okText?: string;
    setText?: string;
    onCancel?(args: any, inst: any): void;
    onChange?(args: any, inst: any): void;
    onTempChange?(args: any, inst: any): void;
    onClose?(args: any, inst: any): void;
    onOpen?(args: any, inst: any): void;
    onResize?(args: any, inst: any): void;
}
export interface IPickerState {
    isOpen?: boolean;
    value?: any;
    width?: number;
}
/** @hidden */
export declare class PickerBase<PropType extends IPickerProps, StateType extends IPickerState> extends BaseComponent<PropType, StateType> {
    static defaults: any;
    value: any;
    /** @hidden */
    _anchor: any;
    /** @hidden */
    _anchorAlign: 'start' | 'end' | 'center';
    /** @hidden */
    _buttons?: IPopupButton[];
    /** @hidden */
    _cssClass: any;
    /** @hidden */
    _focusElm: HTMLElement;
    /** @hidden */
    _headerText: string | undefined;
    /** @hidden */
    _isOpen: boolean;
    /** @hidden */
    _live: boolean;
    /** @hidden */
    _maxWidth: string | number | undefined;
    /** @hidden */
    _scrollLock?: boolean;
    /** @hidden */
    _showInput: boolean;
    /** @hidden */
    _tempValueRep: any;
    /** @hidden */
    _tempValueText: string;
    /** @hidden */
    _value: any;
    /** @hidden */
    _valueRep: any;
    /** @hidden */
    _valueText: string;
    /** @hidden */
    _wrapper: HTMLElement | null;
    dropdown: boolean;
    /**
     * In case of angular directives, this property will hold the dynamically
     * create instance of the component. In other cases this will be undefined.
     */
    protected _inst: PickerBase<PropType, StateType>;
    protected _isMbsc: boolean;
    protected _popup: PopupBase | null;
    protected _valueTextChange: boolean;
    protected _oldValueText: string;
    protected _win: any;
    protected _shouldInitInput: boolean;
    /** Flag for skipping the value parsing on open. When the tempValue is set programmatically, the selected value
     * shouldn't be parsed and put to the temp, because it would overwrite the temporarily set value.
     */
    protected _tempValueSet: boolean;
    /** Does the picker support the null value
     * If the null value is not supported by the picker, it will trigger a change when the value differs after parse.
     * If the null value is supported by the picker, it will not trigger a change when the tempValueRep changes after parse.
     */
    protected _nullSupport: boolean;
    protected _inputTimeout: any;
    protected _preventChange: boolean;
    private _input;
    private _observer;
    private _preventShow;
    private _readOnly;
    private _unlisten;
    private _handler;
    private _tempValue;
    open(): void;
    close(): void;
    set(): void;
    position(): void;
    isVisible(): boolean;
    getVal(): any;
    setVal(value: any): void;
    /** Returns the temporary value selected on the picker. */
    getTempVal(): any;
    /**
     * Sets the Picker temporary value. This temp value is shown on the picker until the selection.
     * In the case of inline mode or when the touchUi setting is false the value will be set to the Model as well,
     * since in these cases there's no temporary value.
     * @param value The value to set to the datepicker as temporary value
     */
    setTempVal(value: any): void;
    _onInputClick: (ev: any) => void;
    _onInputFocus: (ev: any) => void;
    _onInputMouseDown: (ev: any) => void;
    _onInputKey: (ev: any) => void;
    _onInputChange: (ev: any, val?: any) => void;
    _onResize: (args: any) => void;
    _onWrapperResize: () => void;
    _onPopupClose: (args: any) => void;
    _onPopupClosed: (args: any) => void;
    _onPopupKey: (args: any) => void;
    _onPopupOpen: (args: any) => void;
    _onWinFocus: () => void;
    _onButtonClick: ({ domEvent, button }: {
        domEvent: any;
        button: IPopupButton;
    }) => void;
    _setInput: (inp: any) => void;
    _setPopup: (popup: PopupBase) => void;
    _setWrapper: (wrapper: HTMLElement) => void;
    _shouldValidate(s: IPickerProps, prevS: IPickerProps): boolean;
    _valueEquals(v1: any, v2: any): boolean;
    protected _render(s: IPickerProps, state: IPickerState): void;
    protected _updated(): void;
    /**
     * Writes the value to the element and returns if the value was changed
     * @param elm The HTML element the value should be written to
     * @param text The value text that's written into the element
     */
    protected _writeValue(elm: HTMLInputElement, text: string, value: any): boolean;
    protected _destroy(): void;
    protected _setHeader(): void;
    protected _setOrUpdate(preventChange?: boolean): void;
    /**
     * Returns a copy of the value representation.
     * Is used to copy the temporary value to the final value and vica versa.
     * @param value The value to copy.
     */
    protected _copy(value: any): any;
    /**
     * Formats the value representation into a string to display the selection.
     * @param value The value to format.
     */
    protected _format(value: any): string;
    /**
     * Transforms the value representation into the actual value.
     * E.g. in case of date scroller the value is represented as an array like [5, 28, 2020],
     * this function will transform it into a date object.
     * @param value The value to transform.
     */
    protected _get(value: any): any;
    /**
     * Parses a string or actual value into the value representation.
     * E.g. in case of the date scroller the '05/28/2020' string should be parsed into [5, 28, 2020].
     * @param valueText The value to parse.
     */
    protected _parse(valueText: any): any;
    protected _validate(): void;
    protected _onClosed(): void;
    protected _onOpen(): void;
    protected _onParse(): void;
    /**
     * Default behavior for the enter key in a picker to set the selection and close the picker
     * @param args
     */
    protected _onEnterKey(args: any): void;
    private _change;
    private _readValue;
    private _initEl;
    private _resetEl;
    private _write;
}
