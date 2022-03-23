import { ISchedulerOptions, ISchedulerState, SchedulerBase } from './scheduler';
import '../shared/schedule-timeline-base.scss';
import './scheduler.scss';
export declare class Scheduler extends SchedulerBase {
    protected _setCont: (el: HTMLElement) => void;
    protected _setTimeCont: (el: HTMLElement) => void;
    protected _setAllDayCont: (el: HTMLElement) => void;
    protected _setGridCont: (el: HTMLElement) => void;
    protected _setHeaderCont: (el: HTMLElement) => void;
    protected _template(s: ISchedulerOptions, state: ISchedulerState): JSX.Element;
}
