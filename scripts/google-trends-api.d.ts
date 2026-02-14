declare module "google-trends-api" {
  interface TrendsOptions {
    geo?: string;
    hl?: string;
    timezone?: number;
    category?: number;
  }

  function dailyTrends(options?: TrendsOptions): Promise<string>;
  function realTimeTrends(options?: TrendsOptions): Promise<string>;
  function interestOverTime(options?: TrendsOptions): Promise<string>;

  // eslint-disable-next-line import/no-anonymous-default-export
  export default {
    dailyTrends,
    realTimeTrends,
    interestOverTime,
  };
}
