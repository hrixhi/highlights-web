import { ISTOptions, ISTState, STBase } from '../shared/schedule-timeline-base';
import { MbscCalendarDayData } from '../../../shared/calendar-view/calendar-day';
export interface ISchedulerOptions extends ISTOptions {
    groupBy?: 'date' | 'resource';
    type: 'week' | 'day';
    renderDay?(args: MbscCalendarDayData): any;
    renderDayContent?(args: MbscCalendarDayData): any;
    onWeekDayClick(arg: any): void;
}
export interface ISchedulerState extends ISTState {
    showShadow?: boolean;
}
/** @hidden */
export declare class SchedulerBase extends STBase<ISchedulerOptions, ISchedulerState> {
    _largeDayNames: boolean;
    protected _allDayCont: HTMLElement | null;
    protected _timeCont: HTMLElement | null;
    _onScroll: () => void;
    _getLastDay(timestamp: number): Date;
    protected _render(s: ISchedulerOptions, state: ISchedulerState): void;
}
