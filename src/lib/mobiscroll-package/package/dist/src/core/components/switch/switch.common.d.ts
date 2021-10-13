import { MbscSwitchOptions, SwitchBase } from './switch';
import '../../base.scss';
import '../../shared/form-controls/form-controls.scss';
import './switch.scss';
/**
 * The Switch component.
 *
 * Usage:
 * ```
 * <Switch label="Label" />
 * ```
 */
export declare class Switch extends SwitchBase {
    checked: boolean;
    protected _setInput: (input: HTMLInputElement) => void;
    protected _setHandleCont: (span: HTMLSpanElement) => void;
    protected _setHandle: (span: HTMLSpanElement) => void;
    protected _template(s: MbscSwitchOptions): JSX.Element;
}
