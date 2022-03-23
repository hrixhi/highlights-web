import { CalendarViewBase, ICalendarViewHost, ICalendarViewProps, ICalendarViewState } from './calendar-view';
import '../../base.scss';
import './calendar-view.scss';
/** @hidden */
export declare class CalendarView extends CalendarViewBase {
    private _headerElement;
    private _calendarHost?;
    protected _setHeader: (el: HTMLDivElement) => void;
    protected _setBody: (el: any) => void;
    protected _setPickerCont: (el: any) => void;
    protected _renderMonthView: (timestamp: number, props: any) => JSX.Element;
    protected _renderMonth: (item: any, offset: number) => JSX.Element;
    protected _renderYears: (item: any, offset: number) => JSX.Element;
    protected _renderYear: (item: any, offset: number) => JSX.Element;
    protected _renderHeader: (s: ICalendarViewProps, state: ICalendarViewState) => JSX.Element;
    protected _template(s: ICalendarViewProps, state: ICalendarViewState): import("react").FunctionComponentElement<import("react").ConsumerProps<{
        instance?: ICalendarViewHost;
    }>>;
    protected _updated(): void;
}
