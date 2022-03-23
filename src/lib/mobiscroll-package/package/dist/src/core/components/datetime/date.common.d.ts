import { Scroller } from '../scroller/scroller.common';
import { DatetimeBase, MbscDatetimeOptions, MbscDatetimeState } from './datetime';
import './datetime.scss';
export declare class Date extends DatetimeBase {
    protected _setScroller: (scroller: Scroller) => void;
    protected _template(s: MbscDatetimeOptions, state: MbscDatetimeState): JSX.Element;
}
