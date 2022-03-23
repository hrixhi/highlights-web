import { ButtonBase, MbscButtonOptions } from './button';
import '../../base.scss';
import './button.scss';
/**
 * The Button component.
 *
 * Usage:
 *
 * ```
 * <Button icon="home">A button</Button>
 * ```
 */
export declare class Button extends ButtonBase {
    protected _template(s: MbscButtonOptions): JSX.Element;
}
