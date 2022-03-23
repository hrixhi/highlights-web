import { BaseComponent, IBaseProps } from '../../../base';
import { MbscCalendarDayData } from '../../../shared/calendar-view/calendar-day';
import { MbscCalendarEvent } from '../eventcalendar';
export interface MbscWeekDayOptions extends IBaseProps {
    day: number;
    dayNames: string[];
    events: MbscCalendarEvent[];
    firstDay: number;
    index: number;
    isToday: boolean;
    largeNames: boolean;
    resource?: string | number;
    rtl: boolean;
    selectable: boolean;
    selected: boolean;
    theme: string;
    timestamp: number;
    onClick: any;
    dayTemplate?(args: MbscCalendarDayData): any;
    dayContentTemplate?(args: MbscCalendarDayData): any;
    renderDay?(args: MbscCalendarDayData): any;
    renderDayContent?(args: MbscCalendarDayData): any;
}
export interface MbscWeekDayState {
    hasHover: boolean;
}
/** @hidden */
export declare class WeekDayBase extends BaseComponent<MbscWeekDayOptions, MbscWeekDayState> {
    _cssClass: string;
    _data: MbscCalendarDayData;
    private _unlisten;
    _onClick: () => void;
    protected _render(s: MbscWeekDayOptions, state: MbscWeekDayState): void;
    protected _mounted(): void;
    protected _destroy(): void;
}
