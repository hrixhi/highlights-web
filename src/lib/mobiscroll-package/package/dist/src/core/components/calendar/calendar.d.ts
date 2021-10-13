import { CalendarViewBase, ICalendarProps, ViewType } from '../../shared/calendar-view/calendar-view';
import { IPickerProps, IPickerState, PickerBase } from '../../shared/picker/picker';
import { MbscCalendarDayData } from '../../shared/calendar-view/calendar-day';
/**
 * Calendar options
 * @interface MbscCalendarOptions
 */
export interface MbscCalendarOptions extends IPickerProps, ICalendarProps {
    active?: number;
    calendarType?: 'year' | 'month' | 'week';
    calendarScroll?: 'horizontal' | 'vertical';
    pages?: number | 'auto';
    selectMax?: number;
    selectMin?: number;
    selectMultiple?: boolean;
    selectRange?: boolean;
    showOuterDays?: boolean;
    showWeekNumbers?: boolean;
    selectView?: ViewType;
    size?: number;
    weeks?: number;
    selectedText?: string;
    selectedPluralText?: string;
    /** @hidden */
    calendarHeaderTemplate?: any;
    dayTemplate?: any;
    dayContentTemplate?: any;
    renderDay?(args: MbscCalendarDayData): any;
    renderDayContent?(args: MbscCalendarDayData): any;
    renderCalendarHeader?(): any;
    onActiveChange?(args: any, inst: any): void;
    onCellClick?(args: any, inst: any): void;
    onCellHoverIn?(args: any, inst: any): void;
    onCellHoverOut?(args: any, inst: any): void;
    onLabelClick?(args: any, inst: any): void;
    onPageChange?(args: any, inst: any): void;
    onPageLoaded?(args: any, inst: any): void;
    onPageLoading?(args: any, inst: any): void;
}
/** @hidden */
export interface MbscCalendarState extends IPickerState {
    activeTab?: string;
    pages?: number;
}
/** @hidden */
export declare class CalendarBase extends PickerBase<MbscCalendarOptions, MbscCalendarState> {
    /** @hidden */
    static defaults: MbscCalendarOptions;
    protected static _name: string;
    /** @hidden */
    _calendarView: CalendarViewBase;
    /** @hidden */
    _onDayClick: (args: any) => void;
    /** @hidden */
    _onTodayClick: () => void;
    /** @hidden */
    _valueEquals(v1: any, v2: any): boolean;
    protected _copy(value: any): any;
    protected _format(value: any): string;
    protected _parse(value: any): {
        [key: number]: Date;
    };
    protected _get(value: {
        [key: number]: Date;
    }): any[] | Date;
}
