export type DeviceType = "mobile" | "tablet" | "pc";

type DeviceFrameProps = {
  type: DeviceType;
  inView: boolean;
  renderCarousel: (className: string) => React.ReactElement;
};

const DeviceFrame = ({ type, inView, renderCarousel }: DeviceFrameProps) => {
  switch (type) {
    case "tablet":
      return (
        <div className="relative mx-auto aspect-3/4 rounded-[2.5rem] border-[.88rem] border-gray-300 bg-gray-300">
          <div className="-start-4 absolute top-20 h-8 w-1 rounded-s-lg bg-gray-300 dark:bg-gray-800" />
          <div className="-start-4 absolute top-32 h-12 w-1 rounded-s-lg bg-gray-300 dark:bg-gray-800" />
          <div className="-start-4 absolute top-44 h-12 w-1 rounded-s-lg bg-gray-300 dark:bg-gray-800" />
          <div className="-end-4 absolute top-36 h-16 w-1 rounded-e-lg bg-gray-300 dark:bg-gray-800" />
          <div className="h-full w-full cursor-pointer rounded-8 bg-white dark:bg-gray-800">
            {inView && renderCarousel("rounded-[2rem]")}
          </div>
        </div>
      );
    case "pc":
      return (
        <div className="w-full">
          <div className="relative mx-auto mb-[.05rem] aspect-video max-w-[85%] rounded-t-xl border-[.25rem] border-gray-400/75 dark:border-gray-700">
            <div className="h-full w-full cursor-pointer rounded-lg bg-background">
              {inView && renderCarousel("rounded-t-[.5rem]")}
            </div>
          </div>
          <div className="relative mx-auto h-4 rounded-t-sm rounded-b-xl bg-gray-300 md:h-5 dark:bg-gray-800">
            <div className="-translate-x-1/2 absolute top-0 left-1/2 h-1 w-14 rounded-b-xl border border-background border-t-0 bg-gray-500/25 md:h-2 md:w-24 dark:bg-gray-900/25" />
          </div>
        </div>
      );
    case "mobile":
      return (
        <div className="relative mx-auto aspect-9/16 h-[32rem] rounded-[1.5rem] border-[.6rem] border-gray-300 sm:h-[40rem] dark:border-gray-700">
          <div className="-start-3 absolute top-20 h-8 w-[.19rem] rounded-s-lg bg-gray-200 dark:bg-gray-800" />
          <div className="-start-3 absolute top-32 h-12 w-[.19rem] rounded-s-lg bg-gray-200 dark:bg-gray-800" />
          <div className="-start-3 absolute top-44 h-12 w-[.19rem] rounded-s-lg bg-gray-200 dark:bg-gray-800" />
          <div className="-end-3 absolute top-36 h-12 w-[.19rem] rounded-e-lg bg-gray-200 dark:bg-gray-800" />
          <div className="h-full w-full cursor-pointer rounded-[1rem] bg-gray-200 dark:bg-gray-800">
            {inView && renderCarousel("rounded-[1rem]")}
          </div>
        </div>
      );
    default:
      return null;
  }
};

export default DeviceFrame;
