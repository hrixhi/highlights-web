import { MbscPageOptions, PageBase } from './page';
import '../../base.scss';
import './page.scss';
export declare class Page extends PageBase {
    protected _template(s: MbscPageOptions): import("react").ReactElement<{
        className: string;
        ref: (el: any) => void;
    }, string | ((props: any) => import("react").ReactElement<any, any>) | (new (props: any) => import("react").Component<any, any, any>)>;
}
