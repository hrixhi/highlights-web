import { MbscSegmentedOptions, MbscSegmentedState, SegmentedBase } from './segmented-item';
import './segmented.scss';
export declare class Segmented extends SegmentedBase {
    checked: boolean;
    protected _setBox: (box: HTMLElement) => void;
    protected _template(s: MbscSegmentedOptions, state: MbscSegmentedState): import("react").FunctionComponentElement<import("react").ConsumerProps<{}>>;
}
export declare const SegmentedItem: typeof Segmented;
