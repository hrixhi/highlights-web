import { BaseComponent } from '../../base';
import { ILabelDragData, MbscCalendarEventData, MbscResource } from '../../components/eventcalendar/eventcalendar';
import { IDatetimeProps } from '../../util/datetime';
import { MbscRecurrenceRule } from '../../util/recurrence';
import { InstanceServiceBase } from '../instance-service';
import { MbscCalendarDayData } from './calendar-day';
export declare type ViewType = 'month' | 'year' | 'multi-year';
export declare const MONTH_VIEW = "month";
export declare const YEAR_VIEW = "year";
export declare const MULTI_YEAR_VIEW = "multi-year";
export declare const PAGE_WIDTH = 296;
export interface IPageChangeEvent {
    firstDay: Date;
    lastDay: Date;
    viewStart: Date;
    viewEnd: Date;
}
export interface IPageLoadingEvent {
    firstDay: Date;
    lastDay: Date;
    viewChanged: boolean;
    viewStart: Date;
    viewEnd: Date;
    inst: CalendarViewBase;
}
export interface IPageLoadedEvent {
    activeElm: HTMLDivElement;
    firstDay: Date;
    lastDay: Date;
    month: Date;
    viewStart: Date;
    viewEnd: Date;
}
/** Common interface for all kind of labels (standard, more, count, placeholder). */
export interface ICalendarProcessedLabel {
    id: string | number;
    /** Total number of labels for the day, in case when the label is showing the count. */
    count?: number;
    /** Label data in case of standard labels. */
    event?: MbscCalendarLabel;
    /** Last day of the month, needed when outer days are not shown */
    lastDay?: Date;
    /** More text in case of 'x more' labels. */
    more?: string;
    /** Indicates if it's a label spanning across multiple days. */
    multiDay?: boolean;
    /** Indicates if it's just a placeholder label. */
    placeholder?: boolean;
    /** Multiple day labels will have an empty label rendered for each day, without text. */
    showText?: boolean;
    /** Width of the label in case of multiple days. */
    width?: number;
}
/** Label data for one calendar day. */
export interface ICalendarLabelData {
    /** Labels to display on the given day, including placeholders and more label. */
    data: ICalendarProcessedLabel[];
    /** All the labels for the given day. */
    events: MbscCalendarLabel[];
}
/** Common interface for colors, marked and labels */
export interface ICalendarData {
    date?: Date | string | {};
    start?: Date | string | {};
    end?: Date | string | {};
    recurring?: MbscRecurrenceRule | string;
    recurringException?: Array<string | {} | Date> | string | {} | Date;
    recurringExceptionRule?: MbscRecurrenceRule | string;
    [x: string]: any;
}
export interface MbscCalendarLabel extends ICalendarData {
    /** Background color of the label. */
    color?: string;
    /** CSS class for the cell. */
    cellCssClass?: string;
    /** Specifies if an event is editable or not. If false, drag & drop and resize is not allowed. */
    editable?: boolean;
    /** Text of the label */
    text?: string;
    /** Color of the label text. */
    textColor?: string;
}
export interface MbscCalendarMarked extends ICalendarData {
    /** Color of the mark. */
    color?: string;
    /** CSS class for the mark. */
    markCssClass?: string;
    /** CSS class for the cell. */
    cellCssClass?: string;
}
export interface MbscCalendarColor extends ICalendarData {
    /** Background of the circle. */
    highlight?: string;
    /** Background of the cell. */
    background?: string;
    /** CSS class for the cell. */
    cellCssClass?: string;
}
/** @hidden */
export interface ICalendarProps extends IDatetimeProps {
    cssClass?: string;
    colors?: MbscCalendarColor[];
    downIcon?: string;
    hasPicker?: boolean;
    height?: number | string;
    hoverEnd?: number;
    hoverStart?: number;
    labels?: MbscCalendarLabel[];
    marked?: MbscCalendarMarked[];
    mousewheel?: boolean;
    nextIconH?: string;
    nextIconV?: string;
    prevIconH?: string;
    prevIconV?: string;
    rangeStart?: number;
    rangeEnd?: number;
    resourcesMap?: {
        [key: number]: MbscResource;
    };
    showControls?: boolean;
    showLabelCount?: boolean;
    showToday?: boolean;
    upIcon?: string;
    width?: number | string;
    dateText?: string;
    eventText?: string;
    eventsText?: string;
    firstDay?: number;
    moreEventsText?: string;
    moreEventsPluralText?: string;
    nextText?: string;
    prevText?: string;
    timeText?: string;
    onDayHoverIn?(args: any, inst: any): void;
    onDayHoverOut?(args: any, inst: any): void;
    onResize?(args: any, inst: any): void;
}
/** @hidden */
export interface ICalendarViewProps extends ICalendarProps {
    activeDate?: number;
    calendarScroll?: 'horizontal' | 'vertical';
    calendarType?: 'year' | 'month' | 'week';
    clickToCreate?: boolean | 'double' | 'single';
    className?: string;
    dragData?: ILabelDragData;
    dragToCreate?: boolean;
    dragToMove?: boolean;
    dragToResize?: boolean;
    eventOrder?: (event1: MbscCalendarLabel, event2: MbscCalendarLabel) => number;
    eventRange?: 'year' | 'month' | 'week' | 'day';
    eventRangeSize?: number;
    instanceService?: InstanceServiceBase;
    hasContent?: boolean;
    headerTemplate?: any;
    isPicker?: boolean;
    mouseSwipe?: boolean;
    noOuterChange?: boolean;
    pageLoad?: number;
    pages?: number | 'auto';
    responsiveStyle?: boolean;
    selectedDates?: any;
    selectView?: ViewType;
    showCalendar?: boolean;
    showSchedule?: boolean;
    showOuterDays?: boolean;
    showWeekNumbers?: boolean;
    size?: number;
    swipe?: boolean;
    weeks?: number;
    onActiveChange?(args: any, inst: any): void;
    onCellHoverIn?(args: any, inst: any): void;
    onCellHoverOut?(args: any, inst: any): void;
    onDayClick?(args: any, inst: any): void;
    onDayDoubleClick?(args: any, inst: any): void;
    onDayRightClick?(args: any, inst: any): void;
    onGestureStart?(args: any, inst: any): void;
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
    onPageChange?(args: IPageChangeEvent, inst: any): void;
    onPageLoaded?(args: IPageLoadedEvent, inst: any): void;
    onPageLoading?(args: IPageLoadingEvent, inst: any): void;
    onTodayClick?(): void;
    renderDay?(args: MbscCalendarDayData): any;
    renderDayContent?(args: MbscCalendarDayData): any;
    renderHeader?(): any;
    renderLabel?(event: MbscCalendarEventData): any;
    renderLabelContent?(event: MbscCalendarEventData): any;
}
/** @hidden */
export interface ICalendarViewState {
    cellSizes?: number[];
    maxLabels: number;
    pageSize: number;
    pickerSize: number;
    height: 'sm' | 'md';
    width: 'sm' | 'md';
    view?: ViewType;
    viewClosing?: ViewType;
    viewOpening?: ViewType;
}
/** @hidden */
export interface ICalendarViewHost {
    _theme: string;
    _calendarView: CalendarViewBase;
    _instanceService: InstanceServiceBase;
}
export declare const calendarViewDefaults: ICalendarProps;
/** @hidden */
export declare function getPageNr(pages: number | 'auto' | undefined, width: number | undefined): number;
/** @hidden */
export declare function getLabels(s: IDatetimeProps, labelsObj: {
    [key: string]: MbscCalendarLabel[];
}, start: Date, end: Date, maxLabels: number, days: number, allDayOnly: boolean, firstWeekDay: number, rowType: 'month' | 'week' | 'day', eventOrder?: (a: MbscCalendarLabel, b: MbscCalendarLabel) => number, noOuterDays?: boolean, showLabelCount?: boolean, moreEventsText?: string, moreEventsPluralText?: string): {
    [key: string]: ICalendarLabelData;
};
/** @hidden */
export declare function sortEvents(events: MbscCalendarLabel[], eventOrder?: (a: MbscCalendarLabel, b: MbscCalendarLabel) => number): MbscCalendarLabel[];
/** @hidden */
export declare class CalendarViewBase extends BaseComponent<ICalendarViewProps, ICalendarViewState> {
    state: ICalendarViewState;
    _marksMap?: {};
    _labelsMap?: {};
    _headerHTML?: any;
    _headerContent?: any;
    _active: number;
    _activeMonth: number;
    _axis: 'X' | 'Y';
    _body: HTMLElement;
    _cssClass: string;
    _colors: {} | undefined;
    _dayNames: string[];
    _dim: any;
    _firstDay: Date;
    _firstPage: HTMLElement;
    _firstPageDay: Date;
    _hasPicker: boolean;
    _isGrid: boolean;
    _isVertical: boolean;
    _invalid: {} | undefined;
    _pageIndex: number;
    _prevIcon: string;
    _labels: {} | undefined;
    _labelsLayout: {} | undefined;
    _lastDay: Date;
    _lastPageDay: Date;
    _marked: {} | undefined;
    _maxDate: Date | number;
    _maxIndex: number;
    _maxYear: Date | number;
    _maxYearIndex: number;
    _maxYears: number;
    _maxYearsIndex: number;
    _minDate: Date | number;
    _minIndex: number;
    _minYear: Date | number;
    _minYearIndex: number;
    _minYears: number;
    _minYearsIndex: number;
    _months: any[];
    _monthsMulti: number[][];
    _mousewheel: boolean;
    _nextIcon: string;
    _pageNr: number;
    _pickerBtn: HTMLElement;
    _pickerCont: HTMLElement;
    _prevAnim: boolean;
    _rtlNr: number;
    _showOuter: boolean;
    _title: any[];
    _valid: {} | undefined;
    _viewTitle: string;
    _weeks: number;
    _view: ViewType;
    _yearFirst: boolean;
    _yearIndex: number;
    _yearOffset: number;
    _yearsIndex: number;
    _yearsOffset: number;
    MONTH_VIEW: ViewType;
    YEAR_VIEW: ViewType;
    MULTI_YEAR_VIEW: ViewType;
    protected _renderHeader?: (s: ICalendarViewProps, state: ICalendarViewState) => any;
    protected _shouldEnhanceHeader: boolean;
    private _doc;
    private _headerLastHTML;
    private _hoverTimer;
    private _isHover;
    private _isIndexChange;
    private _isLabelClick;
    private _isSwipeChange;
    private _maxLabels;
    private _observer;
    private _offset;
    private _pageChange;
    private _prevClick;
    private _prevPageChange;
    private _viewEnd;
    private _viewStart;
    private _shouldCheckSize;
    private _shouldFocus;
    private _shouldPageLoad;
    private _disableHover;
    /**
     * Navigates to next page
     */
    nextPage: () => void;
    /**
     * Navigates to previous page
     */
    prevPage: () => void;
    _changeView: (newView?: ViewType) => void;
    _getPageDay(pageIndex: number): number;
    _getPageStyle(index: number, offset: number, pageNr?: number): {};
    _getPageYear(pageIndex: number): number;
    _getPageYears(pageIndex: number): number;
    _getPickerClass(view: ViewType): string;
    _isNextDisabled(isModalPicker?: boolean): boolean;
    _isPrevDisabled(isModalPicker?: boolean): boolean;
    _onDayHoverIn: (ev: any) => void;
    _onDayHoverOut: (ev: any) => void;
    _onLabelClick: (args: any) => void;
    _onDayClick: (args: any) => void;
    _onTodayClick: (args: any) => void;
    _onMonthClick: (args: any) => void;
    _onYearClick: (args: any) => void;
    _onPageChange: (args: any) => void;
    _onYearPageChange: (args: any) => void;
    _onYearsPageChange: (args: any) => void;
    _onAnimationEnd: (args: any) => void;
    _onStart: () => void;
    _onGestureStart: (args: any) => void;
    _onGestureEnd: (args: any) => void;
    _onPickerClose: () => void;
    _onPickerOpen: () => void;
    _onPickerBtnClick: (ev: any) => void;
    _onDocClick: (ev: any) => void;
    _onViewAnimationEnd: () => void;
    _onResize: () => void;
    _onKeyDown: (ev: any) => void;
    protected _render(s: ICalendarViewProps, state: ICalendarViewState): void;
    protected _mounted(): void;
    protected _updated(): void;
    protected _destroy(): void;
    private _getActiveCell;
    private _focusActive;
    private _pageLoaded;
    private _activeChange;
    private _activeYearsChange;
    private _activeYearChange;
    private _prevDocClick;
}
