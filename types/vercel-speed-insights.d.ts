declare module "@vercel/speed-insights/next" {
  interface SpeedInsightsProps {
    dsn?: string;
    sampleRate?: number;
    route?: string | null;
    beforeSend?: (data: { type: "vital"; url: string; route?: string }) =>
      | {
          type: "vital";
          url: string;
          route?: string;
        }
      | null
      | undefined
      | false;
    debug?: boolean;
    scriptSrc?: string;
    endpoint?: string;
  }

  type Props = Omit<SpeedInsightsProps, "route">;

  export function SpeedInsights(props: Props): null;
}
