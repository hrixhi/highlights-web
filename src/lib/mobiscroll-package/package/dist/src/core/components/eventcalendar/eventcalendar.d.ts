import { BaseComponent } from '../../base';
import { CalendarViewBase, ICalendarProps, IPageChangeEvent, IPageLoadedEvent, IPageLoadingEvent, MbscCalendarLabel, MbscCalendarMarked } from '../../shared/calendar-view/calendar-view';
import { DateType, formatDate, IDatetimeProps, parseDate } from '../../util/datetime';
import { MbscCalendarDayData } from '../../shared/calendar-view/calendar-day';
export { getJson } from '../../util/http';
export { formatDate, parseDate };
export * from '../../util/luxon';
export * from '../../util/moment';
export interface MbscSelectedDateChangeEvent {
    date: DateType;
}
export interface MbscCellClickEvent {
    date: Date;
    domEvent: any;
    events: MbscCalendarEvent[];
    resource: number | string;
    selected: boolean;
    source: 'calendar' | 'schedule' | 'timeline';
    target: HTMLElement;
}
export interface MbscCellHoverEvent {
    date: Date;
    domEvent: any;
    events: MbscCalendarEvent[];
    labels: MbscCalendarLabel[];
    marked: MbscCalendarMarked[];
    selected: boolean;
    target: HTMLElement;
}
export interface MbscEventClickEvent {
    date: Date;
    domEvent: any;
    event: MbscCalendarEvent;
    inst: EventcalendarBase;
    resource: number | string;
    source: 'agenda' | 'calendar' | 'popover' | 'schedule' | 'timeline';
}
export interface MbscEventDeleteEvent {
    domEvent: any;
    event: MbscCalendarEvent;
    inst: EventcalendarBase;
    source: 'calendar' | 'schedule' | 'timeline';
    target?: HTMLElement;
}
export interface MbscEventDeletedEvent {
    domEvent: any;
    event: MbscCalendarEvent;
    inst: EventcalendarBase;
    source: 'calendar' | 'schedule' | 'timeline';
}
export interface MbscEventCreateEvent {
    action: 'click' | 'drag' | 'externalDrop';
    domEvent: any;
    event: MbscCalendarEvent;
    inst: EventcalendarBase;
    source: 'calendar' | 'schedule' | 'timeline';
}
export interface MbscEventCreatedEvent {
    action: 'click' | 'drag' | 'externalDrop';
    event: MbscCalendarEvent;
    inst: EventcalendarBase;
    source: 'calendar' | 'schedule' | 'timeline';
    target?: HTMLElement;
}
export interface MbscEventUpdateEvent {
    domEvent: any;
    event: MbscCalendarEvent;
    oldEvent: MbscCalendarEvent;
    inst: EventcalendarBase;
    source: 'calendar' | 'schedule' | 'timeline';
}
export interface MbscEventUpdatedEvent {
    event: MbscCalendarEvent;
    oldEvent: MbscCalendarEvent;
    inst: EventcalendarBase;
    source: 'calendar' | 'schedule' | 'timeline';
    target?: HTMLElement;
}
export interface MbscLabelClickEvent {
    date: Date;
    domEvent: any;
    event: MbscCalendarEvent;
    inst: EventcalendarBase;
}
export interface MbscNewEventData {
    resource?: string | number;
    start: Date;
}
export interface MbscPageChangeEvent {
    firstDay: Date;
    lastDay: Date;
    month?: Date;
    inst: EventcalendarBase;
}
export interface MbscPageLoadingEvent {
    firstDay: Date;
    lastDay: Date;
    month?: Date;
    inst: EventcalendarBase;
}
export interface MbscPageLoadedEvent {
    firstDay: Date;
    lastDay: Date;
    month?: Date;
    inst: EventcalendarBase;
}
export interface MbscEventUpdateFailedEvent {
    event: MbscCalendarEvent;
    oldEvent: MbscCalendarEvent;
    inst: EventcalendarBase;
    invalid: MbscCalendarEvent;
    source: 'calendar' | 'schedule' | 'timeline';
}
export interface MbscEventCreateFailedEvent {
    action: 'click' | 'drag' | 'externalDrop';
    event: MbscCalendarEvent;
    inst: EventcalendarBase;
    invalid: MbscCalendarEvent;
    source: 'calendar' | 'schedule' | 'timeline';
}
export interface MbscEventcalendarView {
    agenda?: {
        type?: 'day' | 'week' | 'month' | 'day';
        scrollable?: boolean;
        size?: number;
    };
    calendar?: {
        count?: boolean;
        labels?: boolean;
        outerDays?: boolean;
        popover?: boolean;
        popoverClass?: string;
        scroll?: 'horizontal' | 'vertical';
        size?: number;
        type?: 'year' | 'month' | 'week';
        weekNumbers?: boolean;
    };
    schedule?: {
        endDay?: number;
        endTime?: string;
        startDay?: number;
        startTime?: string;
        type?: 'day' | 'week';
        days?: boolean;
        allDay?: boolean;
        timeCellStep?: number;
        timeLabelStep?: number;
    };
    timeline?: {
        endDay?: number;
        endTime?: string;
        eventList?: boolean;
        startDay?: number;
        startTime?: string;
        type?: 'day' | 'week' | 'month';
        timeCellStep?: number;
        timeLabelStep?: number;
        days?: boolean;
        allDay?: boolean;
    };
}
export interface ILabelDragDataSet {
    event?: MbscCalendarLabel;
    width?: number;
}
export interface ILabelDragData {
    /**
     * The dates of the event which is dragged.
     * We need to display the event boxes in case of touch drag, when we enter drag mode,
     * and continue to display during drag, but invisible, otherwise, if we loose the
     * element on which the touch started, the touch events will stop firing.
     */
    originDates?: {
        [key: string]: ILabelDragDataSet;
    };
    /** The dates of the dragged event. Only containing the start of the event on every week and the
     * width of the event on that week
     */
    draggedDates?: {
        [key: string]: ILabelDragDataSet;
    };
    /** The dragged event, displayed during drag. */
    draggedEvent?: MbscCalendarEvent;
}
export interface IDragData {
    /**
     * The dates of the event which is dragged.
     * We need to display the event boxes in case of touch drag, when we enter drag mode,
     * and continue to display during drag, but invisible, otherwise, if we loose the
     * element on which the touch started, the touch events will stop firing.
     */
    originDates?: {
        [key: string]: {
            [key: number]: MbscCalendarEventData;
        };
    };
    /** The dates of the dragged event. */
    draggedDates?: {
        [key: string]: {
            [key: number]: MbscCalendarEventData;
        };
    };
    /** The dragged event, displayed during drag. */
    draggedEvent?: MbscCalendarEventData;
    resource?: number | string;
}
export interface MbscEventcalendarOptions extends ICalendarProps {
    actionableEvents?: boolean;
    chevronIconDown?: string;
    clickToCreate?: boolean | 'double' | 'single';
    colorEventList?: boolean;
    data?: MbscCalendarEvent[];
    dragTimeStep?: number;
    dragToCreate?: boolean;
    dragToMove?: boolean;
    dragToResize?: boolean;
    defaultSelectedDate?: DateType;
    eventOrder?: (event1: MbscCalendarEvent, event2: MbscCalendarEvent) => number;
    /** @hidden */
    eventTemplate?: any;
    extendDefaultEvent?: (args: MbscNewEventData) => MbscCalendarEvent;
    externalDrop?: boolean;
    groupBy?: 'date' | 'resource';
    invalidateEvent?: 'start-end' | 'strict';
    resources?: MbscResource[] | null | undefined;
    selectedDate?: DateType;
    view?: MbscEventcalendarView;
    allDayText?: string;
    newEventText?: string;
    noEventsText?: string;
    toText?: string;
    renderAgenda?(events: MbscEventList[], options: MbscEventcalendarOptions, dayRefs: {
        [key: number]: HTMLElement | null;
    }): any;
    renderDay?(args: MbscCalendarDayData): any;
    renderDayContent?(args: MbscCalendarDayData): any;
    renderEvent?(data: MbscCalendarEventData): any;
    renderEventContent?(data: MbscCalendarEventData): any;
    renderHeader?(): any;
    renderLabel?(event: MbscCalendarEventData): any;
    renderLabelContent?(event: MbscCalendarEventData): any;
    renderResource?(resource: MbscResource): any;
    renderScheduleEvent?(event: MbscCalendarEventData): any;
    renderScheduleEventContent?(event: MbscCalendarEventData): any;
    onCellClick?(args: MbscCellClickEvent, inst: EventcalendarBase): void;
    onCellDoubleClick?(args: MbscCellClickEvent, inst: EventcalendarBase): void;
    onCellHoverIn?(args: MbscCellHoverEvent, inst: EventcalendarBase): void;
    onCellHoverOut?(args: MbscCellHoverEvent, inst: EventcalendarBase): void;
    onCellRightClick?(args: MbscCellClickEvent, inst: EventcalendarBase): void;
    onEventClick?(args: MbscEventClickEvent, inst: EventcalendarBase): void;
    onEventCreate?(args: MbscEventCreateEvent, inst: EventcalendarBase): void;
    onEventCreated?(args: MbscEventCreatedEvent, inst: EventcalendarBase): void;
    onEventDelete?(args: MbscEventDeleteEvent, inst: EventcalendarBase): void;
    onEventDeleted?(args: MbscEventDeletedEvent, inst: EventcalendarBase): void;
    onEventDoubleClick?(args: MbscEventClickEvent, inst: EventcalendarBase): void;
    onEventRightClick?(args: MbscEventClickEvent, inst: EventcalendarBase): void;
    onEventHoverIn?(args: MbscEventClickEvent, inst: EventcalendarBase): void;
    onEventHoverOut?(args: MbscEventClickEvent, inst: EventcalendarBase): void;
    onEventUpdate?(args: MbscEventUpdateEvent, inst: EventcalendarBase): void;
    onEventUpdated?(args: MbscEventUpdatedEvent, inst: EventcalendarBase): void;
    onEventUpdateFailed?(args: MbscEventUpdateFailedEvent, inst: EventcalendarBase): void;
    onEventCreateFailed?(args: MbscEventCreateFailedEvent, inst: EventcalendarBase): void;
    onLabelClick?(args: MbscLabelClickEvent, inst: EventcalendarBase): void;
    onPageChange?(args: MbscPageChangeEvent, inst: EventcalendarBase): void;
    onPageLoading?(args: MbscPageLoadingEvent, inst: EventcalendarBase): void;
    onPageLoaded?(args: MbscPageLoadedEvent, inst: EventcalendarBase): void;
    onSelectedDateChange?(args: MbscSelectedDateChangeEvent, inst: EventcalendarBase): void;
}
/** @hidden */
export interface MbscEventcalendarState {
    activeDate?: number;
    eventList?: MbscEventList[];
    height?: number;
    isListScrollable?: boolean;
    isTouchDrag?: boolean;
    popoverDate?: number | undefined;
    popoverList?: MbscCalendarEventData[];
    selectedDate?: number;
    showPopover?: boolean;
    labelDragData?: ILabelDragData;
    width?: number;
}
export interface MbscCalendarEvent extends MbscCalendarLabel {
    /** Specifies if the event is all day or not. */
    allDay?: boolean;
    /** A unique id for the event. If not specifed, the event will get a generated id. */
    id?: string | number;
    /** Resource or resources of the event. */
    resource?: number | string | Array<number | string>;
    /** The title of the event. */
    title?: string;
}
export interface MbscCalendarEventData {
    allDay?: boolean;
    allDayText?: string;
    color?: string;
    cssClass?: string;
    currentResource?: MbscResource;
    end?: string;
    endDate: Date;
    html?: any;
    id?: any;
    isMultiDay?: boolean;
    lastDay?: string;
    original?: MbscCalendarEvent;
    position?: any;
    resource?: number | string | Array<number | string>;
    start?: string;
    startDate: Date;
    style?: any;
    title?: string;
    uid?: string;
}
export interface MbscEventList {
    date: string;
    events: MbscCalendarEventData[];
    timestamp: number;
}
export interface MbscResource {
    id: number | string;
    name?: string;
    collapsed?: boolean;
    color?: string;
    [x: string]: any;
    children?: Array<{
        id: number | string;
        name?: string;
        collapsed?: boolean;
        color?: string;
        [x: string]: any;
    }>;
}
/** @hidden */
export declare function getDataInRange(data: any[], s: MbscEventcalendarOptions, firstDay: Date, lastDay: Date, start?: DateType, end?: DateType): MbscCalendarEvent[];
/** @hidden */
export declare function getEventId(): string;
/** @hidden */
export declare function getEventData(s: IDatetimeProps, event: MbscCalendarEvent, eventDay: number, colorEvent: boolean, timeFormat: string, allDayText: string, toText: string, resource?: MbscResource, isTimeline?: boolean): MbscCalendarEventData;
/** @hidden */
export declare class EventcalendarBase extends BaseComponent<MbscEventcalendarOptions, MbscEventcalendarState> {
    /** @hidden */
    static defaults: MbscEventcalendarOptions;
    protected static _name: string;
    state: MbscEventcalendarState;
    eventList: MbscEventList[] | undefined;
    /** @hidden */
    _active: number;
    /** @hidden */
    _anchor: HTMLDivElement;
    /** @hidden */
    _calendarScroll: 'horizontal' | 'vertical' | undefined;
    /** @hidden */
    _calendarSize: number;
    /** @hidden */
    _calendarType: 'year' | 'month' | 'week';
    /** @hidden */
    _calendarView: CalendarViewBase;
    /** @hidden */
    _colorEventList: boolean;
    /** @hidden */
    _colorsMap: {
        [key: number]: MbscCalendarEvent[];
    } | undefined;
    /** @hidden */
    _cssClass: string;
    /** @hidden */
    _eventListType: 'year' | 'month' | 'week' | 'day';
    /** @hidden */
    _eventListSize: number;
    /** @hidden */
    _eventMap: {
        [key: string]: MbscCalendarEvent[];
    };
    /** @hidden */
    _invalidsMap: {
        [key: number]: MbscCalendarEvent[];
    } | undefined;
    /** @hidden */
    _list: HTMLElement | null;
    /** @hidden */
    _listDays: {
        [key: number]: HTMLElement | null;
    } | null;
    /** @hidden */
    _maxDate: number;
    /** @hidden */
    _minDate: number;
    /** @hidden */
    _pageLoad: number;
    /** @hidden */
    _popoverClass: string;
    /** @hidden */
    _resourcesMap: {
        [key: number]: MbscResource;
    };
    /** @hidden */
    _scheduleType: 'week' | 'day';
    /** @hidden */
    _scheduleEndDay: number;
    /** @hidden */
    _scheduleStartDay: number;
    /** @hidden */
    _scheduleEndTime: string | undefined;
    /** @hidden */
    _scheduleStartTime: string | undefined;
    /** @hidden */
    _scheduleTimeCellStep: number;
    /** @hidden */
    _scheduleTimeLabelStep: number;
    /** @hidden */
    _timelineType: 'month' | 'week' | 'day';
    /** @hidden */
    _timelineEndDay: number;
    /** @hidden */
    _timelineStartDay: number;
    /** @hidden */
    _timelineEndTime: string | undefined;
    /** @hidden */
    _timelineStartTime: string | undefined;
    /** @hidden */
    _timelineTimeCellStep: number;
    /** @hidden */
    _timelineTimeLabelStep: number;
    /** @hidden */
    _timelineListing: boolean | undefined;
    /** @hidden */
    _selected: number;
    /** @hidden */
    _selectedDateHeader: string;
    /** @hidden */
    _selectedDates: {
        [key: number]: boolean;
    };
    /** @hidden */
    _selectedDateTime: number;
    /** @hidden */
    _shouldScrollSchedule: number;
    /** @hidden */
    _showCalendar: boolean | undefined;
    /** @hidden */
    _showDate: boolean | undefined;
    /** @hidden */
    _showEventCount: boolean | undefined;
    /** @hidden */
    _showEventLabels: boolean | undefined;
    /** @hidden */
    _showEventList: boolean | undefined;
    /** @hidden */
    _showEventPopover: boolean | undefined;
    /** @hidden */
    _showOuterDays: boolean | undefined;
    /** @hidden */
    _showSchedule: boolean | undefined;
    /** @hidden */
    _showScheduleAllDay: boolean | undefined;
    /** @hidden */
    _showScheduleDays: boolean | undefined;
    /** @hidden */
    _showTimeline: boolean | undefined;
    /** @hidden */
    _showWeekNumbers: boolean | undefined;
    /** @hidden */
    _validsMap: {
        [key: number]: MbscCalendarEvent[];
    } | undefined;
    _firstDay: Date;
    _firstWeekDay: number;
    _lastDay: Date;
    /** @hidden */
    _onScroll: (...args: any[]) => void;
    protected _eventListHTML: any;
    protected _shouldLoadDays: boolean;
    private _tempDay;
    private _tempWeek;
    private _tempEvent;
    private _calCellHeight;
    private _calCellWidth;
    private _areaTop;
    private _areaLeft;
    private _areaBottom;
    private _areaRight;
    private _onCalendar;
    private _triggerCreated;
    private _triggerUpdated;
    private _triggerDeleted;
    private _defaultDate;
    private _events;
    private _hoverTimer;
    private _isHover;
    private _isListScrolling;
    private _isPageChange;
    private _moreLabelClicked;
    private _refresh;
    private _shouldAnimateScroll;
    private _shouldScroll;
    private _shouldSkipScroll;
    private _skipScheduleScroll;
    private _unsubscribe;
    private _viewChanged;
    /**
     * Sets the events for the calendar.
     * @param events Array containing the events.
     */
    addEvent(events: MbscCalendarEvent | MbscCalendarEvent[]): string[];
    /**
     * Returns the events between start/end.
     */
    getEvents(start?: DateType, end?: DateType): MbscCalendarEvent[];
    /**
     * Returns the invalids between start/end.
     */
    getInvalids(start?: DateType, end?: DateType): MbscCalendarEvent[];
    /**
     * Sets the events for the calendar.
     * @param events Array containing the events.
     */
    setEvents(events: MbscCalendarEvent[]): string[];
    /**
     * Removes one or more events from the calendar.
     * @param events
     */
    removeEvent(events: string | number | MbscCalendarEvent | string[] | number[] | MbscCalendarEvent[]): void;
    /**
     * Navigates the calendar to the specified date.
     * @param date
     */
    navigate(date: DateType, animate?: boolean): void;
    /**
     * Updates one or more events in the calendar.
     * @param events
     */
    updateEvent(events: MbscCalendarEvent | MbscCalendarEvent[]): void;
    /**
     * Refreshes the view.
     */
    refresh(): void;
    /** @hidden */
    _isToday(d: number): boolean;
    /** @hidden */
    _onWeekDayClick: (d: number) => void;
    /** @hidden */
    _onDayClick: (args: any) => void;
    /** @hidden */
    _onActiveChange: (args: any) => void;
    /** @hidden */
    _onGestureStart: (args: any) => void;
    /** @hidden */
    _onDayDoubleClick: (args: any) => void;
    /** @hidden */
    _onDayRightClick: (args: any) => void;
    /** @hidden */
    _onCellHoverIn: (args: any) => void;
    /** @hidden */
    _onCellHoverOut: (args: any) => void;
    /** @hidden */
    _onEventHoverIn: (args: any) => void;
    /** @hidden */
    _onEventHoverOut: (args: any) => void;
    /** @hidden */
    _onEventClick: (args: any) => void;
    /** @hidden */
    _onEventDoubleClick: (args: any) => void;
    /** @hidden */
    _onEventRightClick: (args: any) => void;
    /** @hidden */
    _onLabelHoverIn: (args: any) => void;
    /** @hidden */
    _onLabelHoverOut: (args: any) => void;
    /** @hidden */
    _onLabelClick: (args: any) => void;
    /** @hidden */
    _onLabelDoubleClick: (args: any) => void;
    /** @hidden */
    _onLabelRightClick: (args: any) => void;
    /** @hidden */
    _onCellClick: (args: any) => void;
    /** @hidden */
    _onCellDoubleClick: (args: any) => void;
    /** @hidden */
    _onCellRightClick: (args: any) => void;
    /** @hidden */
    _onPageChange: (args: IPageChangeEvent) => void;
    /** @hidden */
    _onPageLoading: (args: IPageLoadingEvent) => void;
    /** @hidden */
    _onPageLoaded: (args: IPageLoadedEvent) => void;
    /** @hidden */
    _onPopoverClose: () => void;
    /** @hidden */
    _onResize: (ev: any) => void;
    /** @hidden */
    _getDragDates: (start: Date, end: Date, event: MbscCalendarEventData) => {
        [key: number]: ILabelDragDataSet;
    };
    _onLabelUpdateModeOn: (args: any) => void;
    _onLabelUpdateModeOff: (args: any) => void;
    _onLabelUpdateStart: (args: any) => void;
    _onLabelUpdateMove: (args: any) => void;
    _onLabelUpdateEnd: (args: any) => void;
    _onEventDragEnd: (args: any) => boolean;
    _onExternalDrag: (args: any) => void;
    /** @hidden */
    _onEventDelete: (args: any) => void;
    protected _render(s: MbscEventcalendarOptions, state: MbscEventcalendarState): void;
    protected _mounted(): void;
    protected _updated(): void;
    protected _destroy(): void;
    private _getAgendaEvents;
    private _getEventData;
    private _setEventList;
    private _hidePopover;
    private _scrollToDay;
    private _selectedChange;
    private _cellClick;
    private _dayClick;
    private _labelClick;
    private _eventClick;
}
