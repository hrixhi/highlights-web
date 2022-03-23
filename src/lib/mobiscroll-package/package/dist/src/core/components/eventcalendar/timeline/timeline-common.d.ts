import { ITimelineOptions, ITimelineState, TimelineBase } from './timeline';
import '../shared/schedule-timeline-base.scss';
import './timeline.scss';
export declare class Timeline extends TimelineBase {
    protected _setCont: (el: HTMLElement) => void;
    protected _setResCont: (el: HTMLElement) => void;
    protected _setGridCont: (el: HTMLElement) => void;
    protected _setHeaderCont: (el: HTMLElement) => void;
    protected _template(s: ITimelineOptions, state: ITimelineState): JSX.Element;
}
