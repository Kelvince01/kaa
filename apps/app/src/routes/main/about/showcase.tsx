import { config } from "@kaa/config";
import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { lazy, Suspense } from "react";
import Spinner from "@/components/common/spinner";

const DeviceMockup = lazy(() => import("../device-mockup"));

const showcaseItems = [{ id: "raak", url: "https://raak.dev" }];

// Slides for light and dark themes
const lightSlides = [
  { url: "/static/images/showcases/raak-1.png", contentType: "image/png" },
  { url: "/static/images/showcases/raak-2.png", contentType: "image/png" },
];
const darkSlides = [
  { url: "/static/images/showcases/raak-1-dark.png", contentType: "image/png" },
  { url: "/static/images/showcases/raak-2-dark.png", contentType: "image/png" },
];

const Showcase = () => {
  const t = useTranslations();

  return (
    <div className="relative mx-auto mt-20 mb-12 flex max-w-3xl items-center gap-8 max-sm:flex-col lg:mb-16">
      <div className="w-full">
        <div className="flex flex-wrap">
          {showcaseItems.map((item, index) => {
            const title = `about.showcase.title_${index + 1}`;
            const text = `about.showcase.text_${index + 1}`;

            return (
              <div className="w-full" key={item.id}>
                <div className="flex">
                  <div className="w-full">
                    <a href={item.url} rel="noreferrer" target="_blank">
                      <h3 className="group mb-2 font-medium text-xl 2xl:text-[1.38rem]">
                        {t(title)}
                        <ArrowUpRight
                          className="-mt-2 ml-1 inline-block text-primary opacity-50 group-hover:opacity-100"
                          size={16}
                          strokeWidth={config.theme.strokeWidth}
                        />
                      </h3>
                    </a>
                    <p className="leading-relaxed">{t(text)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="">
        <Suspense fallback={<Spinner className="mt-[40vh] h-10 w-10" />}>
          <DeviceMockup
            className=""
            darkSlides={darkSlides}
            lightSlides={lightSlides}
            type="mobile"
          />
        </Suspense>
      </div>
    </div>
  );
};

export default Showcase;
