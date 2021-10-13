import { InputBase, MbscInputOptions, MbscInputState } from './input';
import '../../shared/form-controls/form-controls.scss';
import './input.scss';
export declare class Input extends InputBase {
    value: boolean;
    protected _template(s: MbscInputOptions, state: MbscInputState): JSX.Element;
}
