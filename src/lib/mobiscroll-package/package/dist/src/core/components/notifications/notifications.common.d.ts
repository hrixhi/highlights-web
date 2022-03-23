import { MbscAlertOptions, MbscConfirmOptions, MbscPromptOptions, MbscSnackbarOptions, MbscToastOptions } from './notifications';
import './notifications.scss';
export declare function toast(options: MbscToastOptions): Promise<undefined>;
export declare function snackbar(options: MbscSnackbarOptions): Promise<undefined>;
export declare function alert(options: MbscAlertOptions): Promise<undefined>;
export declare function confirm(options: MbscConfirmOptions): Promise<boolean>;
export declare function prompt(options: MbscPromptOptions): Promise<string | null>;
