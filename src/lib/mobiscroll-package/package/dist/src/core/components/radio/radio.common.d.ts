import { MbscRadioOptions, MbscRadioState, RadioBase } from './radio';
import '../../base.scss';
import '../../shared/form-controls/form-controls.scss';
import './radio.scss';
export declare class Radio extends RadioBase {
    checked: boolean;
    protected _setInput: (inp: HTMLInputElement) => void;
    protected _template(s: MbscRadioOptions, state: MbscRadioState): import("react").FunctionComponentElement<import("react").ConsumerProps<{}>>;
}
