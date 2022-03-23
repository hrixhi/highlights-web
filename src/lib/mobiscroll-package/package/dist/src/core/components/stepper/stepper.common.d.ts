import { MbscStepperOptions, StepperBase } from './stepper';
import '../../base.scss';
import '../../shared/form-controls/form-controls.scss';
import './stepper.scss';
export declare class Stepper extends StepperBase {
    value: number;
    protected _onLabelClick: (ev: any) => void;
    protected _setInput: (input: HTMLInputElement) => void;
    protected _template(s: MbscStepperOptions): JSX.Element;
}
