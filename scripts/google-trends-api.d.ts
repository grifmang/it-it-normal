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

  export default {
    dailyTrends,
    realTimeTrends,
    interestOverTime,
  };
}
