import { MbscDatetimeOptions } from '../datetime/datetime';
import { TimegridBase } from './timegrid';
import './timegrid.scss';
export declare class Timegrid extends TimegridBase {
    protected _setCont: (el: HTMLDivElement) => void;
    protected _template(s: MbscDatetimeOptions): JSX.Element;
}
