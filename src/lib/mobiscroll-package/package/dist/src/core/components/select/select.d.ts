import { BaseComponent, IBaseEvent } from '../../base';
import { IScrollerProps, IScrollerValidateArgs, MbscScrollerWheel, ScrollerBase } from '../scroller/scroller';
export interface MbscSelectOnFilterEvent extends IBaseEvent {
    filterText: string;
}
export interface MbscSelectOptions extends IScrollerProps {
    clearIcon?: string;
    data?: any[];
    filter?: boolean;
    selectMultiple?: boolean;
    inputElement?: HTMLElement;
    selectElement?: HTMLSelectElement;
    filterPlaceholderText?: string;
    filterEmptyText?: string;
    onFilter?(ev: MbscSelectOnFilterEvent, inst: any): boolean;
}
interface ISelectData {
    group?: string;
    text: string;
    value: any;
    disabled?: boolean;
}
export declare class SelectBase extends BaseComponent<MbscSelectOptions, any> {
    static defaults: MbscSelectOptions;
    protected static _name: string;
    /** @hidden */
    _checkMarks: boolean;
    /** @hidden */
    _filterInput: HTMLInputElement;
    /** @hidden */
    _filterText: string;
    /** @hidden
     * Value and Label map for the option items
     * Values are the keys and the labels are the values of the map
     */
    _map: Map<any, string>;
    /** @hidden
     * It's the reverse map of the _map property.
     * Used to get the value from the value text, when parsing the input text
     * Keys are the labels and values are the value of the option items
     */
    _reMap: Map<string, any>;
    /** @hidden */
    _noResults?: boolean;
    /** @hidden */
    _rows: number;
    /** @hidden */
    _scrollerClass: string;
    /** @hidden */
    _selectOnScroll: boolean;
    /** @hidden */
    _spaceAround: boolean;
    /** @hidden */
    _value: any;
    /** @hidden */
    _wheels: MbscScrollerWheel[][];
    /** @hidden
     * We specify a fix wheel width for the select when the filtering is on.
     * In this case, we anticipate a large list, so we don't need the select to change it's width dynamically.
     * This is required for custom filtering to work smoothly, without changing the width on content change.
     */
    _wheelWidth?: number | number[];
    /** In case of angular directives, this property will hold the dynamically created instance of the component. */
    protected _inst: SelectBase;
    protected _options: ISelectData[];
    /** Option elements changed */
    protected _optionsReloaded: boolean;
    protected _scroller: ScrollerBase;
    private _debounce;
    private _disabled;
    private _isSelect;
    /** Serves as a gateway, that doesn't let the getVal method return a value that was created by the scroller's
     * validation logic, unless there was actually a value in the first place (which was not null/undefined)
     */
    private _parsedValue;
    /** Event handler for the filter input change */
    _onFilterChange: (e: any) => void;
    /** Event handler for the clear filter input button */
    _onFilterClear: () => void;
    _shouldValidate: (s: MbscSelectOptions, prevS: MbscSelectOptions) => boolean;
    _writeValue: (elm: HTMLInputElement, text: string, value: any) => boolean;
    /** Reloads option elements from the DOM, when
     * the Select Component is initialized on a select element
     */
    reloadOptionElements(): void;
    setVal(value: any): void;
    getVal(): any;
    setTempVal(value: any): void;
    getTempVal(): any;
    open(): void;
    close(): void;
    _onResize: (args: any) => void;
    _onChange: (args: any) => void;
    _format: (valueRep: any[]) => string;
    /**
     * Parses the value into a value representation
     * The select passes this function to the scroller, so the value
     * representation is basically an array of values. Each index in the array represents
     * one wheel. If a wheel has multiselect, the value on that index will be an array too.
     * @param value The selected value or array of values in case of multiselect
     * @returns The value representation of the scroller. See above description for more info.
     */
    _parse: (value: any) => any[];
    _get: (valueRep: any[]) => any;
    _valueEquals: (v1: any, v2: any) => boolean;
    _validate: ({ values, direction, wheels }: IScrollerValidateArgs) => {
        disabled?: {}[];
        valid?: any[];
    };
    _onClose: (args: any) => void;
    protected _render(s: MbscSelectOptions): void;
    protected _createOptionList(data: ISelectData[]): void;
    /**
     * Proxies the function call to either the _inst or the _scroller
     * based on which is available.
     * NOTE: In the case of the angular directive, methods should be called on the _inst,
     * while otherwise the _scroller has these methods.
     * @param method The method name you want ot call
     * @param args Array of the arguments passed to the method
     * @returns
     */
    private _proxy;
    private _createWheels;
    /**
     * Sets the optionlist from querying the <option> elements
     */
    private _setOptionsFromElm;
    /**
     * Triggers the onFilter event and sets the filterText to the state,
     * so the next render cycle can do the filtering based on it
     */
    private _filter;
}
export {};
