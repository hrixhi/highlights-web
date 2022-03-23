import { BaseComponent, IBaseProps } from '../../base';
import { ILabelDragData, MbscCalendarEventData, MbscResource } from '../../components/eventcalendar/eventcalendar';
import { DateType, ITimezonePlugin } from '../../util/datetime';
import { ICalendarLabelData, MbscCalendarMarked } from './calendar-view';
import { MbscCalendarDayData } from './calendar-day';
/** @hidden */
export interface IMonthViewProps extends IBaseProps {
    activeDate: number;
    calendarType: 'year' | 'month' | 'week';
    cellSizes?: number[];
    clickToCreate?: boolean | 'double' | 'single';
    colors?: {
        [key: string]: any[];
    };
    dragToCreate?: boolean;
    dragToMove?: boolean;
    dragToResize?: boolean;
    dayNames: string[];
    dayNamesShort: string[];
    dataTimezone?: string;
    displayTimezone?: string;
    eventText: string;
    eventsText: string;
    exclusiveEndDates?: boolean;
    firstDay: number;
    firstPageDay: number;
    hasMarks?: boolean;
    hoverEnd?: number;
    hoverStart?: number;
    isActive: boolean;
    isPicker?: boolean;
    invalid?: {
        [key: string]: any[];
    };
    labels?: {
        [key: string]: ICalendarLabelData[];
    };
    dragData?: ILabelDragData;
    marked?: {
        [key: string]: MbscCalendarMarked[];
    };
    max?: DateType;
    min?: DateType;
    monthNames: string[];
    monthNamesShort: string[];
    rangeEnd?: number;
    rangeStart?: number;
    resourcesMap?: {
        [key: number]: MbscResource;
    };
    selectedDates?: any;
    showOuter?: boolean;
    showSingleMark?: boolean;
    showWeekDays: boolean;
    showWeekNumbers?: boolean;
    todayText: string;
    timeFormat?: string;
    timezonePlugin?: ITimezonePlugin;
    valid?: {
        [key: string]: any[];
    };
    weeks: number;
    getDate(y: number, m: number, d: number): Date;
    getDay(d: Date): number;
    getMonth(d: Date): number;
    getWeekNumber(d: Date): number;
    getYear(d: Date): number;
    onDayClick?(args: any, inst: any): void;
    onDayDoubleClick?(args: any, inst: any): void;
    onDayRightClick?(args: any, inst: any): void;
    onLabelClick?(args: any, inst: any): void;
    onLabelDoubleClick?(args: any, inst: any): void;
    onLabelRightClick?(args: any, inst: any): void;
    onLabelHoverIn?(args: any, inst: any): void;
    onLabelHoverOut?(args: any, inst: any): void;
    onLabelDelete?(args: any): void;
    onLabelUpdateStart?(args: any): void;
    onLabelUpdateMove?(args: any): void;
    onLabelUpdateEnd?(args: any): void;
    onLabelUpdateModeOn?(args: any): void;
    onLabelUpdateModeOff?(args: any): void;
    onDayHoverIn?(args: any, inst: any): void;
    onDayHoverOut?(args: any, inst: any): void;
    renderDay?(event: MbscCalendarDayData): any;
    renderDayContent?(event: MbscCalendarDayData): any;
    renderLabel?(event: MbscCalendarEventData): any;
    renderLabelContent?(event: MbscCalendarEventData): any;
}
/** @hidden */
export declare class MonthViewBase extends BaseComponent<IMonthViewProps, any> {
    _days: number[];
    _rows: any[];
    _isActive(d: number): boolean;
    _isInvalid(d: number): any;
    _isSelected(d: number): boolean;
    _getWeekNr(s: IMonthViewProps, date: number): number;
    protected _render(s: IMonthViewProps): void;
}
