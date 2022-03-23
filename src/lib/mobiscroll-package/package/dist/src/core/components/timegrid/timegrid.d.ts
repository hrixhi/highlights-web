import { BaseComponent } from '../../base';
import { MbscDatetimeOptions, MbscDatetimeState } from '../datetime/datetime';
export interface ITimeSlot {
    value: number;
    formattedValue: string;
}
export declare class TimegridBase extends BaseComponent<MbscDatetimeOptions, MbscDatetimeState> {
    /** @hidden */
    static defaults: MbscDatetimeOptions;
    protected static _name: string;
    /** @hidden */
    _cssClass: string;
    _invalids: {
        [key: number]: any[];
    } | undefined;
    _timeSlots: ITimeSlot[][];
    _value: number;
    _gridContEl: HTMLElement;
    private _min;
    private _max;
    private _validTimes;
    private _selectedDate;
    private _valueChanged;
    private _lastValue?;
    _setTime: (timeSlot: ITimeSlot) => void;
    _isDisabled: (d: number) => boolean;
    _onKeyDown: (ev: any) => void;
    protected _render(s: MbscDatetimeOptions, state: MbscDatetimeState): void;
    protected _updated(): void;
}
