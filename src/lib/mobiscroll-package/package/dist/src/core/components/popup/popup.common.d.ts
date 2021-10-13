import { MbscPopupOptions, MbscPopupState, PopupBase } from './popup';
import '../../base.scss';
import './popup.scss';
export declare class Popup extends PopupBase {
    protected _setActive: (el: HTMLDivElement) => void;
    protected _setContent: (el: HTMLDivElement) => void;
    protected _setLimitator: (el: HTMLDivElement) => void;
    protected _setPopup: (el: HTMLDivElement) => void;
    protected _setWrapper: (el: HTMLDivElement) => void;
    protected _template(s: MbscPopupOptions, state: MbscPopupState): JSX.Element;
}
