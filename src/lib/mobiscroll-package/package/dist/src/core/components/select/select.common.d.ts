import { Input } from '../input/input.common';
import { Scroller } from '../scroller/scroller.common';
import { MbscSelectOptions, SelectBase } from './select';
import './select.scss';
export declare class Select extends SelectBase {
    protected _setScroller: (scroller: Scroller) => void;
    protected _setInput: (input: Input) => void;
    protected _filterRenderer: () => JSX.Element;
    protected _filterEmptyRenderer: () => JSX.Element;
    protected _template(s: MbscSelectOptions): any;
}
