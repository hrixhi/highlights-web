import { BaseComponent, IBaseProps } from '../../base';
export declare type MbscPopupPredefinedButton = 'set' | 'cancel' | 'ok' | 'close';
export declare type DisplayType = 'center' | 'bottom' | 'top' | 'anchored' | 'inline' | 'bubble';
export interface IPopupButtonBase {
    color?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'dark' | 'light';
    cssClass?: string;
    icon?: string;
    keyCode?: number | 'enter' | 'esc' | 'space' | Array<number | 'enter' | 'esc' | 'space'>;
    name?: MbscPopupPredefinedButton;
    text?: string;
    variant?: 'standard' | 'flat' | 'outline';
    disabled?: boolean;
}
export interface MbscPopupButton extends IPopupButtonBase {
    handler?: MbscPopupPredefinedButton | ((event: any) => void);
}
export interface IPopupButton extends IPopupButtonBase {
    handler: (event: any) => void;
}
export interface MbscPopupOptions extends IBaseProps {
    activeElm?: HTMLElement | string;
    anchor?: HTMLElement;
    anchorAlign?: 'start' | 'end' | 'center';
    animation?: 'pop' | 'slide-down' | 'slide-up' | boolean;
    buttons?: Array<MbscPopupButton | MbscPopupPredefinedButton | string>;
    buttonVariant?: 'standard' | 'flat' | 'outline';
    closeOnEsc?: boolean;
    closeOnOverlayClick?: boolean;
    closeOnScroll?: boolean;
    contentPadding?: boolean;
    disableLeftRight?: boolean;
    display?: DisplayType;
    focusElm?: any;
    focusOnClose?: boolean;
    focusOnOpen?: boolean;
    focusTrap?: boolean;
    fullScreen?: boolean;
    headerText?: string;
    height?: string | number;
    isOpen?: boolean;
    maxHeight?: string | number;
    maxWidth?: string | number;
    scrollLock?: boolean;
    showArrow?: boolean;
    showOverlay?: boolean;
    windowWidth?: number;
    width?: string | number;
    cancelText?: string;
    closeText?: string;
    okText?: string;
    setText?: string;
    onButtonClick?(args: any, inst: any): void;
    onClose?(args: any, inst: any): void;
    onClosed?(args: any, inst: any): void;
    onKeyDown?(args: any, inst: any): void;
    onOpen?(args: any, inst: any): void;
    onPosition?(args: any, inst: any): void;
    onResize?(args: any, inst: any): void;
}
/** @hidden */
export interface MbscPopupState {
    arrowPos?: {
        left?: string;
        top?: string;
    };
    bubblePos?: 'top' | 'bottom' | 'left' | 'right';
    isOpen?: boolean;
    isReady?: boolean;
    /** Top position of the popup */
    modalTop?: number;
    /** Left position of the popup */
    modalLeft?: number;
    /** Show or hide the popup arrow in anchored mode */
    showArrow?: boolean;
    /** Viewport width */
    width?: number;
    /** Viewport height */
    height?: number;
}
/** @hidden */
export declare function processButtons(inst: any, buttons?: Array<IPopupButton | MbscPopupButton | string>): IPopupButton[] | undefined;
/**
 * @hidden
 */
export declare class PopupBase extends BaseComponent<MbscPopupOptions, MbscPopupState> {
    /** @hidden */
    static defaults: MbscPopupOptions;
    _active: HTMLElement;
    _animation: string;
    _buttons: IPopupButton[] | undefined;
    _ctx: any;
    _content: HTMLElement;
    _flexButtons: boolean;
    _hasContext: boolean;
    _headerText: any;
    _isClosing: boolean;
    _isModal: boolean;
    _isOpening: boolean;
    _isOpen: boolean;
    _isVisible: boolean;
    _limitator: HTMLElement;
    _limits: any;
    _popup: HTMLElement;
    _round: boolean;
    _style: any;
    _wrapper: HTMLElement;
    protected _justClosed: boolean;
    protected _justOpened: boolean;
    private _doc;
    private _hasWidth;
    private _lastFocus;
    private _lock;
    private _maxHeight;
    private _maxWidth;
    private _needsLock;
    private _observer;
    private _preventClose;
    private _prevFocus;
    private _prevModal;
    private _scrollCont;
    private _shouldPosition;
    private _target;
    private _vpWidth;
    private _vpHeight;
    private _win;
    _onOverlayClick: () => void;
    _onDocClick: () => void;
    _onMouseDown: (ev: any) => void;
    _onMouseUp: (ev: any) => void;
    _onPopupClick: () => void;
    _onAnimationEnd: (ev: any) => void;
    _onButtonClick: ({ domEvent, button }: {
        domEvent: any;
        button: MbscPopupButton;
    }) => void;
    _onFocus: (ev: any) => void;
    _onKeyDown: (ev: any) => void;
    _onContentScroll: (ev: any) => void;
    _onScroll: (ev: any) => void;
    _onWndKeyDown: (ev: any) => void;
    _onResize: () => void;
    /**
     * Open
     */
    open(): void;
    /**
     * Close
     */
    close(): void;
    /**
     * Is open?
     */
    isVisible(): boolean;
    position(): void;
    protected _render(s: MbscPopupOptions, state: MbscPopupState): void;
    protected _updated(): void;
    protected _destroy(): void;
    protected _onOpen(): void;
    protected _onClose(): void;
    protected _onOpened(): void;
    protected _onClosed(): void;
    private _unlisten;
    private _close;
}
