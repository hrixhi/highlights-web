import { MbscResource } from '../eventcalendar';
import { ISTOptions, ISTState, STBase } from '../shared/schedule-timeline-base';
export interface ITimelineOptions extends ISTOptions {
    monthNames?: string[];
    monthNamesShort?: string[];
    type: 'week' | 'day' | 'month';
}
export interface ITimelineState extends ISTState {
    scrollDay?: Date;
}
/** @hidden */
export declare class TimelineBase extends STBase<ITimelineOptions, ITimelineState> {
    _isTimeline: boolean;
    private _headerDate;
    private _headerDateElm;
    private _headerDateWidth;
    _onScroll: () => void;
    _onParentClick(resource: MbscResource): void;
    protected _render(s: ITimelineOptions, state: ITimelineState): void;
}
