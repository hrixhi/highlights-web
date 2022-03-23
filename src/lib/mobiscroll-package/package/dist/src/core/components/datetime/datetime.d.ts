import { BaseComponent } from '../../base';
import { DateType, IDatetimeProps } from '../../util/datetime';
import { IScrollerProps, MbscScrollerWheel, ScrollerBase } from '../scroller/scroller';
export interface MbscDatetimeOptions extends IDatetimeProps, IScrollerProps {
    dateDisplay?: string;
    dateWheelFormat?: string;
    dateWheels?: string;
    defaultValue?: DateType;
    mode?: 'date' | 'datetime' | 'time';
    stepHour?: number;
    stepMinute?: number;
    stepSecond?: number;
    timeWheels?: string;
    nowText?: string;
}
/** @hidden */
export interface MbscDatetimeState {
    value?: DateType;
}
/**
 * @hidden
 */
export declare class DatetimeBase extends BaseComponent<MbscDatetimeOptions, MbscDatetimeState> {
    /** @hidden */
    static defaults: MbscDatetimeOptions;
    protected static _name: string;
    /** @hidden */
    _wheels: MbscScrollerWheel[][];
    /** @hidden */
    _minWheelWidth: number | number[];
    /** @hidden */
    _value: DateType;
    protected _preset: string;
    protected _scroller: ScrollerBase;
    private _dateDisplay;
    private _dateTemplate;
    private _dateWheels;
    private _format;
    private _getDatePart;
    private _hasAmPm;
    private _hasDay;
    private _max;
    private _min;
    private _innerValues;
    private _invalids;
    private _timeDisplay;
    private _timeStep;
    private _timeWheels;
    private _valids;
    private _wheelOrder;
    getVal(): DateType;
    setVal(value: DateType): void;
    position(): void;
    isVisible(): boolean;
    _onChange: (args: any) => void;
    _parseDate: (value: string) => any[];
    _formatDate: (values: any[]) => string;
    _getDate: (values: any[]) => Date;
    _validate: ({ direction, index, values, wheels }: any) => {
        disabled: Map<any, boolean>[];
        init: boolean;
        valid: number[];
    };
    _shouldValidate: (s: any, prevS: any) => boolean;
    _valueEquals(v1: any, v2: any): boolean;
    protected _render(s: MbscDatetimeOptions, state: MbscDatetimeState): void;
    protected _getYearValue: (i: number) => any;
    protected _getYearIndex: (i: any) => any;
    protected _getDateIndex: (i: any) => any;
    protected _getDateItem: (i: number) => {
        disabled: any;
        display: string;
        value: string;
    };
    private _getWheels;
    private _getDateWheel;
    private _getTimeWheel;
    private _getArray;
    private _getArrayPart;
    private _getHours;
    private _getMinutes;
    private _getSeconds;
    private _getFullTime;
}
