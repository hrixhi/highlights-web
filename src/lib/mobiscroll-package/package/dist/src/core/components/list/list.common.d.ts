import { ListBase, MbscListOptions } from './list';
import '../../base.scss';
import './list.scss';
/**
 * The List component
 *
 * Usage:
 *
 * ```
 * <List theme="ios">
 *   <ListItem>Items inside</ListItem>
 * </List>
 * ```
 */
export declare class List extends ListBase {
    protected _template(s: MbscListOptions): JSX.Element;
}
