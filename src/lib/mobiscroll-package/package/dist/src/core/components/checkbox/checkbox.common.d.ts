import { CheckboxBase, MbscCheckboxOptions } from './checkbox';
import '../../base.scss';
import '../../shared/form-controls/form-controls.scss';
import './checkbox.scss';
/**
 * The Checkbox component.
 *
 * Usage:
 *
 * ```
 * <Checkbox label="Label" />
 * ```
 */
export declare class Checkbox extends CheckboxBase {
    checked: boolean;
    protected _setInput: (input: HTMLInputElement) => void;
    protected _template(s: MbscCheckboxOptions): JSX.Element;
}
