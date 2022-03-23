import { BaseComponent, IBaseProps } from '../../../base';
import { ITimezonePlugin } from '../../../util/datetime';
import { MbscCalendarEventData } from '../eventcalendar';
export interface MbscScheduleEventOptions extends IBaseProps {
    contentTemplate?: any;
    displayTimezone?: string;
    drag?: boolean;
    event: MbscCalendarEventData;
    exclusiveEndDates?: boolean;
    gridEndTime: number;
    gridStartTime: number;
    hidden?: boolean;
    inactive?: boolean;
    isDrag?: boolean;
    isListing?: boolean;
    isTimeline?: boolean;
    lastDay?: Date;
    resize?: boolean;
    resource?: number | string;
    timestamp: number;
    timezonePlugin?: ITimezonePlugin;
    onClick?(arg: any): void;
    onDoubleClick?(arg: any): void;
    onHoverIn?(arg: any): void;
    onHoverOut?(arg: any): void;
    onRightClick?(arg: any): void;
    onDelete?(arg: any): void;
    onDragEnd?(arg: any): void;
    onDragModeOff?(args: any): void;
    onDragModeOn?(args: any): void;
    onDragMove?(arg: any): void;
    onDragStart?(arg: any): void;
    renderContent?(event: MbscCalendarEventData): any;
    render?(event: MbscCalendarEventData): any;
}
export interface MbscScheduleEventState {
    hasHover?: boolean;
    hasFocus?: boolean;
}
/** @hidden */
export declare class ScheduleEventBase extends BaseComponent<MbscScheduleEventOptions, MbscScheduleEventState> {
    _content: any;
    _cssClass: string;
    _html: any;
    _isStart: boolean | undefined;
    _isEnd: boolean | undefined;
    _rangeText: string | undefined;
    _style: any;
    _isAllDay: boolean | undefined;
    private _doc;
    private _host;
    private _isDrag;
    private _unlisten;
    private _unsubscribe;
    _onClick: (ev: any) => void;
    _onRightClick: (ev: any) => void;
    protected _onDocTouch: (ev: any) => void;
    protected _render(s: MbscScheduleEventOptions, state: MbscScheduleEventState): void;
    protected _mounted(): void;
    protected _destroy(): void;
    private _updateState;
    private _triggerClick;
}
