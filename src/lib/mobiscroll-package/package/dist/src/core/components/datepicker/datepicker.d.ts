import { IPickerState, PickerBase } from '../../shared/picker/picker';
import { DateType } from '../../util/datetime';
import { MbscCalendarOptions } from '../calendar/calendar';
import { MbscDatetimeOptions } from '../datetime/datetime';
export declare const modules: {
    [key: string]: any;
};
export declare type TDatepickerControl = 'calendar' | 'date' | 'time' | 'datetime' | 'timegrid';
interface IValueRepresentation {
    [key: string]: Date;
}
interface IDValueRepresentation {
    date?: IValueRepresentation;
    start?: number;
    end?: number;
}
export interface MbscDatepickerOptions extends MbscCalendarOptions, MbscDatetimeOptions {
    calendarSize?: number;
    controls?: TDatepickerControl[];
    clearIcon?: string;
    defaultValue?: any;
    firstSelectDay?: number;
    rangeHighlight?: boolean;
    modules?: any[];
    tabs?: boolean | 'auto';
    rangeEndInvalid?: boolean;
    selectCounter?: boolean;
    select?: 'date' | 'range' | 'preset-range';
    selectSize?: number;
    startInput?: any;
    endInput?: any;
    inRangeInvalid?: boolean;
    showRangeLabels?: boolean;
    enableStartOnly?: boolean;
    maxRange?: number;
    maxTime?: DateType;
    minRange?: number;
    minTime?: DateType;
    rangeEndHelp?: string;
    rangeEndLabel?: string;
    rangeStartHelp?: string;
    rangeStartLabel?: string;
    onTempChange?(args: {
        value: DateType | DateType[];
    }, inst: any): void;
    onActiveDateChange?(args: {
        active: 'start' | 'end';
    }): void;
}
/** @hidden */
export interface MbscDatepickerState extends IPickerState {
    activeTab?: string;
    hoverDate?: number;
    isLarge?: boolean;
    maxPopupWidth?: number;
    widthType?: 'sm' | 'md';
}
/** @hidden */
export declare class DatepickerBase extends PickerBase<MbscDatepickerOptions, MbscDatepickerState> {
    /** @hidden */
    static defaults: MbscDatepickerOptions;
    protected static _name: string;
    _activeTab: string | undefined;
    _activeSelect: 'start' | 'end' | undefined;
    _controls: any[];
    _controlsClass: string;
    /** Whether of not to show the rangepicker start and end selection controls */
    _renderControls: boolean;
    _renderTabs: boolean | undefined;
    _selectedTime: Date | undefined;
    _tempValueRep: IDValueRepresentation;
    _cssClass: string | undefined;
    /** @hidden
     * The formatted start value that appears on the start/end selection control
     */
    _tempStartText: string;
    /** @hidden
     * The formatted end value that appears on the start/end selection control
     */
    _tempEndText: string;
    protected _needsWidth: boolean;
    private _startEndTimeout;
    /** Reference to the start input element in case of the range picker */
    private _startInput?;
    /** Reference to the end input element in case of the range picker */
    private _endInput?;
    private _iso;
    private _hasCalendar;
    private _hasDate;
    private _hasTime;
    private _hasTimegrid;
    private _max;
    private _min;
    /** Holds the minimum time that can be selected for each day.
     * It's a Date object that we use only the time part of.
     */
    private _minTime;
    /** Holds the maximum time that can be selected for each day.
     * It's a Date object that we use only the time part of.
     */
    private _maxTime;
    /** We pass this date to the calendar, when we want to navigate it to a certain date.
     * The calendar takes this into account only once every time the _active value changes.
     * Otherwise when navigated from UI, this value is disregarded.
     */
    private _active?;
    private _valueFormat;
    /** Holds the limited max option which is manipulated in the case of range selection based on invalids */
    private _maxLimited?;
    /** Holds the limited min option which is manipulated in the case of range selection on the datetime control based on the start date */
    private _minLimited?;
    /** Holds the limited min option which is passed to the time control
     * It's required because in the case of the calendar the min setting should not be limited, but
     * for the time control it does. So in case when there is a time and a calendar, the two passed options differ.
     */
    private _minTimeLimited?;
    private _nextInvalid;
    /** Holds the previously selected start date as a timestamp in case of the range picker */
    private _prevStart?;
    /** Holds the last selected date in the case of the calendar
     * NOTE: It's needed in the case of the range picker, when both of the start and end dates are selected, and we change the end selection
     * we can't decide which date was clicked otherwise, because the calendar change only knows the selected dates. So if we click the same
     * day (start or end), we can't tell if the start or the end date was clicked.
     * TODO: simplify the onCalendarChange function based on this value - currently it calculates this value from the current selection if
     * it can, otherwise uses this value
     */
    private _lastSelected?;
    /** We store the readonly state of the start input in this variable. We need this to restore the input to the original state
     * when required.
     */
    private _startInputReadOnly?;
    /** We store the readonly state of the end input in this variable. We need this to restore the input to the original state
     * when required.
     */
    private _endInputReadOnly?;
    private _shouldInitInputs?;
    /** In the case of the rangepicker it specifies if we are making a new selection.
     * When true, it means we need to cycle the active selection. Otherwise we refine the
     * selection and we don't have to cycle it.
     * Generally, we make a new selection when we open the picker (doesn't matter if there was
     * already a selected date or not).
     */
    private _newSelection?;
    private _selectedDate?;
    _onActiveChange: (ev: any) => void;
    _onResize: (ev: any) => void;
    _onDayHoverIn: ({ date, hidden }: {
        date: Date;
        hidden: boolean;
    }) => void;
    _onDayHoverOut: ({ date }: {
        date: Date;
    }) => void;
    /** Saves the last clicked date on the calendar */
    _onCellClick: (args: any) => void;
    _onCalendarChange: (ev: any) => void;
    _onDatetimeChange: (ev: any) => void;
    _onTimePartChange: (ev: any) => void;
    /** @hidden */
    _changeActiveTab: (ev: any) => void;
    /** @hidden */
    _changeActiveSelect: (ev: any) => void;
    /**
     * Sets which date or time is currently selected (start or end).
     * @param active Specifies which one should be active start or end selection.
     */
    setActiveDate(active: 'start' | 'end'): void;
    /** Returns the temporary value selected on the datepicker. */
    getTempVal(): null | DateType | DateType[] | [DateType | null, DateType | null];
    /**
     * Sets the datepicker temporary value. This temp value is shown on the picker until the selection.
     * In the case of inline mode or when the touchUi setting is false the value will be set to the Model as well,
     * since in these cases there's no temporary value.
     * @param value The value to set to the datepicker as temporary value
     */
    setTempVal(value: null | DateType | Array<DateType | null>): void;
    /**
     * Navigates the calendar to the specified date.
     * @param date
     */
    navigate(date: DateType): void;
    _onInputClickRange: (ev: any) => void;
    _onInputKeyRange: (ev: any) => void;
    _onInputFocusRange: (ev: any) => void;
    _onInputChangeRange: (ev: any) => void;
    _clearEnd: () => void;
    _clearStart: () => void;
    _shouldValidate(s: MbscDatepickerOptions, prevS: MbscDatepickerOptions): boolean;
    _valueEquals(v1: any, v2: any): boolean;
    protected _activateBasedOnInput: (inp: HTMLInputElement) => void;
    protected _init(): void;
    protected _render(s: MbscDatepickerOptions, state: MbscDatepickerState): void;
    protected _updated(): void;
    protected _onEnterKey(args: any): void;
    protected _setupInput(i: 'start' | 'end', input: any): void;
    protected _destroy(): void;
    protected _setupInputHandlers(el: HTMLInputElement): void;
    protected _clearInputHandlers(el: HTMLInputElement | undefined, readOnly?: boolean): void;
    protected _setHeader(): void;
    protected _validate(): void;
    protected _copy(value: any): any;
    /**
     * Formats the value representation to a string
     * IMPORTANT: The order of the dates in the formatted string is definition order!
     * @param valueRep The value representation object
     */
    protected _format(valueRep: IDValueRepresentation): string;
    protected _proxy: (args: any) => void;
    protected _parse(value: any): IDValueRepresentation;
    protected _getDate(value: IDValueRepresentation): null | Date | Array<Date | null>;
    /**
     * Returns the value from the value representation
     * NOTE: In the case of the range, if the start date is selected only, the end will be null
     * @param value The value representation for the datepicker
     */
    protected _get(value: IDValueRepresentation): null | DateType | DateType[] | [DateType | null, DateType | null];
    protected _onClosed(): void;
    protected _onOpen(): void;
    /** The formatted end value in the case of the range picker */
    private _getValueText;
    /**
     * Checks if the temp selection is NOT ready yet for set
     * In the case of the range picker the selection is not ready when
     *  - no value is selected OR
     *  - only one value is selected and the labels are shown
     *    if the labels are not shown, we allow the selection in the case of date control or the calendar together with
     *    time - there's no way to switch to second value otherwise
     */
    private _selectionNotReady;
    /** Sets the _activeSelect property and triggers the 'onActiveDateChange' event if the active select changed */
    private _setActiveSelect;
}
export {};
