import { MbscCalendarEventData, MbscResource } from '../../../core/components/eventcalendar/eventcalendar';
import { BaseComponent, IBaseProps } from '../../base';
import { ITimezonePlugin } from '../../util/datetime';
import { MbscCalendarLabel } from './calendar-view';
/** @hidden */
export interface ICalendarLabelProps extends IBaseProps {
    count?: string;
    date?: number;
    dataTimezone?: string;
    displayTimezone?: string;
    drag?: boolean;
    event?: MbscCalendarLabel;
    exclusiveEndDates?: boolean;
    firstDay?: number;
    hidden?: boolean;
    id?: any;
    inactive?: boolean;
    isActiveMonth?: boolean;
    isPicker?: boolean;
    isUpdate?: boolean;
    lastDay?: Date;
    more?: string;
    resourcesMap?: {
        [key: number]: MbscResource;
    };
    rtl?: boolean;
    showText?: boolean;
    theme?: string;
    timeFormat?: string;
    timezonePlugin?: ITimezonePlugin;
    contentTemplate?: any;
    template?: any;
    resize?: boolean;
    width?: number;
    renderContent?(event: MbscCalendarEventData): any;
    render?(event: MbscCalendarEventData): any;
    onClick?(args: any): void;
    onDoubleClick?(args: any): void;
    onRightClick?(args: any): void;
    onHoverIn?(args: any): void;
    onHoverOut?(args: any): void;
    onDelete?(args: any, inst: any): void;
    onDragStart?(args: any): void;
    onDragMove?(args: any): void;
    onDragEnd?(args: any): void;
    onDragModeOn?(args: any): void;
    onDragModeOff?(args: any): void;
}
/** @hidden */
export interface ICalendarLabelState {
    hasFocus?: boolean;
    hasHover?: boolean;
}
/** @hidden */
export declare class CalendarLabelBase extends BaseComponent<ICalendarLabelProps, {}> {
    _color: string | undefined;
    _content: any;
    _cssClass: string;
    _data: any;
    _hasResizeStart: boolean | undefined;
    _hasResizeEnd: boolean | undefined;
    _html: any;
    _textColor: string | undefined;
    _title: string | undefined;
    _tabIndex: number | undefined;
    private _doc;
    private _isDrag;
    private _touchTimer;
    private _unlisten;
    private _unsubscribe;
    _onClick: (ev: any) => void;
    _onRightClick: (ev: any) => void;
    protected _onDocTouch: (ev: any) => void;
    protected _mounted(): void;
    protected _destroy(): void;
    protected _render(s: ICalendarLabelProps, state: ICalendarLabelState): void;
    private _updateState;
    private _triggerEvent;
}
