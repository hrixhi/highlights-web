import { IScrollviewBaseProps, ScrollviewBase } from './scroll-view';
/** @hidden */
export declare class Scrollview extends ScrollviewBase {
    protected _setInnerEl: (el: any) => void;
    protected _setScrollEl: (el: any) => void;
    protected _setScrollEl3d: (el: any) => void;
    protected _setScrollbarEl: (el: any) => void;
    protected _setScrollbarContEl: (el: any) => void;
    protected _template(s: IScrollviewBaseProps): JSX.Element;
}
