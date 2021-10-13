import { Base } from '../react/base';
export declare const version = "5.11.0";
/**
 * @hidden
 * Preact with typescript complains about these props missing,
 * so adding it here
 */
export interface IBaseProps {
    context?: any;
    cssClass?: string;
    responsive?: {
        [key: string]: any;
    };
    rtl?: boolean;
    theme?: string;
    themeVariant?: 'light' | 'dark' | 'auto';
    touchUi?: boolean | 'auto';
    locale?: string | {};
    /** @hidden */
    baseTheme?: any;
    /** @hidden */
    children?: any;
    /** @hidden */
    class?: string;
    /** @hidden */
    className?: string;
    /** @hidden */
    dangerouslySetInnerHTML?: any;
    /** @hidden */
    hasChildren?: boolean;
    /** @hidden */
    key?: any;
    /** @hidden */
    ref?: any;
    /** @hidden */
    style?: any;
    onDestroy?(args: any, inst: BaseComponent<IBaseProps, {}>): void;
    onInit?(args: any, inst: BaseComponent<IBaseProps, {}>): void;
}
export interface IBaseEvent {
    inst?: any;
    type?: string;
}
/** @hidden */
export declare class BaseComponent<PropType extends IBaseProps, StateType> extends Base<PropType, StateType> {
    /** @hidden */
    static defaults: any;
    protected static _name: string;
    readonly nativeElement: HTMLElement;
    /** @hidden */
    s: PropType;
    /** @hidden */
    state: StateType;
    /** @hidden */
    _className: string;
    /** @hidden */
    _hb: string;
    /**
     * Used to identify if it's a mobiscroll component
     * @hidden
     */
    _mbsc: boolean;
    /** @hidden */
    _rtl: string;
    /** @hidden */
    _theme: string;
    /** @hidden */
    _touchUi: boolean;
    /** @hidden */
    _v: any;
    /**
     * Needed for preact for dynamic updates, because props is immutable.
     * Merge this into the computed settings as well.
     */
    protected _prevS: PropType;
    protected _respProps: PropType;
    protected _shouldEnhance: HTMLElement | boolean | null | undefined;
    protected _zone: any;
    protected _optChange: number;
    protected _uid: number;
    destroy(): void;
    _hook(name: string, args: any): any;
    protected __init(): void;
    protected __destroy(): void;
    protected _render(s: PropType, state: StateType): void;
    protected _willUpdate(): void;
    private _resp;
    private _merge;
}
