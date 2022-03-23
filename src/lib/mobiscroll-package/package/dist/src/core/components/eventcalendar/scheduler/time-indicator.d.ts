import { BaseComponent } from '../../../base';
import { ITimezonePlugin } from '../../../util/datetime';
export interface MbscTimeIndicatorOptions {
    displayedTime: number;
    displayedDays: number;
    showDayIndicator: boolean;
    orientation: 'x' | 'y';
    rtl?: boolean;
    theme?: string;
    scheduleType?: 'week' | 'day' | 'month';
    startDay: number;
    startTime: number;
    timeFormat?: string;
    displayTimezone?: string;
    timezonePlugin?: ITimezonePlugin;
}
/** @hidden */
export declare class TimeIndicatorBase extends BaseComponent<MbscTimeIndicatorOptions, any> {
    _cssClass: string;
    _dayPos: any;
    _pos: any;
    _time: string;
    private _timer;
    protected _mounted(): void;
    protected _destroy(): void;
    protected _render(s: MbscTimeIndicatorOptions): void;
}
