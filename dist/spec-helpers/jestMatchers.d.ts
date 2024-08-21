/// <reference types="jest" />
import CalendarDate from '../src/helpers/CalendarDate';
type OwnMatcher<Params extends unknown[]> = (this: jest.MatcherContext, received: unknown, ...params: Params) => jest.CustomMatcherResult;
declare global {
    namespace jest {
        interface Matchers<R> {
            toMatchDreamModel(expected: any): jest.CustomMatcherResult;
            toMatchDreamModels(expected: any): jest.CustomMatcherResult;
            toBeWithin(precision: number, expected: number): jest.CustomMatcherResult;
            toEqualCalendarDate(expected: any): jest.CustomMatcherResult;
        }
        interface Expect {
            toMatchDreamModel<T>(expected: T): T;
            toEqualCalendarDate<T>(expected: T): T;
        }
        interface ExpectExtendMap {
            toMatchDreamModel: OwnMatcher<[expected: any]>;
            toMatchDreamModels: OwnMatcher<[expected: any]>;
            toBeWithin: OwnMatcher<[precision: number, expected: number]>;
            toEqualCalendarDate: OwnMatcher<[expected: CalendarDate]>;
        }
    }
}
export declare function expectMatchingDreamModels(received: any, expected: any, matcherName: string): jest.CustomMatcherResult;
export {};
