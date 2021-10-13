/** @hidden */
export interface ICalendarWeekDaysProps {
    dayNames: string[];
    dayNamesShort: string[];
    firstDay: number;
    hidden?: boolean;
    rtl: string;
    theme: string;
    showWeekNumbers?: boolean;
}
/** @hidden */
export declare const CalendarWeekDays: (props: ICalendarWeekDaysProps) => JSX.Element;
