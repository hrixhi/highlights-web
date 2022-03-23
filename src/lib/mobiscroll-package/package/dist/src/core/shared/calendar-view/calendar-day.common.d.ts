import { CalendarDayBase, ICalendarDayProps } from './calendar-day';
import { ICalendarProcessedLabel } from './calendar-view';
/** @hidden */
export declare class CalendarDay extends CalendarDayBase {
    protected _renderEvent(s: ICalendarDayProps, label: ICalendarProcessedLabel, showText?: boolean, hidden?: boolean, isUpdate?: boolean, key?: string | number): JSX.Element;
    protected _renderLabel(s: ICalendarDayProps, label: ICalendarProcessedLabel): JSX.Element | JSX.Element[];
    protected _template(s: ICalendarDayProps): JSX.Element;
}
