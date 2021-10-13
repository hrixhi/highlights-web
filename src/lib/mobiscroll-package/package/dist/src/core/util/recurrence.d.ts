import { DateType, IDatetimeProps } from './datetime';
export interface IOccurrence {
    i: number;
    d: Date;
}
export interface MbscRecurrenceRule {
    repeat?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval?: number;
    count?: number;
    from?: DateType;
    until?: DateType;
    month?: number;
    day?: number;
    weekDays?: string;
}
export declare function parseRule(ruleStr: string): MbscRecurrenceRule;
/**
 * Updates a recurring rule, based on a new start date and / or shifts with the specifed days.
 * @param recurringRule
 * @param start
 * @param dayDelta
 */
export declare function updateRule(recurringRule: MbscRecurrenceRule | string, start: Date, dayDelta: number): MbscRecurrenceRule;
/**
 * Returns the first date on which occurs something from the list of rules/dates
 *
 * For example it returns the next invalid date from the list of invalid and a given start date
 */
export declare function getNextOccurence(list: any[], start: Date, s: IDatetimeProps, displayFormat?: string): Date | null;
/** @hidden */
export declare function getExceptionList(exception?: string | {} | Date): Array<string | {} | Date>;
/** @hidden */
export declare function getOccurrences(rule: MbscRecurrenceRule | string, dtStart: Date, start: Date, end: Date, s: IDatetimeProps, exception?: string | Date, exceptionRule?: MbscRecurrenceRule | string): IOccurrence[];
/** @hidden */
export declare function getEventMap(list: any[], start: Date, end: Date, s: IDatetimeProps, overwrite?: boolean): {} | undefined;
