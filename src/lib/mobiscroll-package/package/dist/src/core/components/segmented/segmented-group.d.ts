import { BaseComponent, IBaseProps } from '../../base';
export interface MbscSegmentedGroupOptions extends IBaseProps {
    color?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'dark' | 'light';
    drag?: boolean;
    disabled?: boolean;
    name?: string;
    select?: 'single' | 'multiple';
    value?: any;
    onChange?: any;
}
/** @hidden */
export declare class SegmentedGroupBase extends BaseComponent<MbscSegmentedGroupOptions, any> {
    static defaults: MbscSegmentedGroupOptions;
    protected static _name: string;
    value: any;
    _groupClass: string;
    _name: string;
    private _unlisten?;
    private _id;
    _onChange: (ev: any, val: any) => void;
    protected _setupDrag(): void;
    protected _cleanupDrag(): void;
    protected _render(s: MbscSegmentedGroupOptions): void;
    protected _updated(): void;
    protected _destroy(): void;
}
