import { Button } from "@kaa/ui/components/button";
import { useTranslations } from "next-intl";
import ContactForm from "@/components/common/contact-form/contact-form";
import { dialog } from "@/components/common/dialoger/state";

const CallToAction = () => {
  const t = useTranslations();

  const handleContactUs = () => {
    dialog(<ContactForm dialog />, {
      id: "contact-form",
      drawerOnMobile: false,
      className: "sm:max-w-5xl",
      title: t("common.contact_us"),
      description: t("common.contact_us.text"),
    });
  };

  return (
    <div className="mx-auto grid max-w-4xl">
      <p className="mb-6 text-center text-4xl leading-[3rem]">
        {t("about.call_to_action")}
      </p>
      <div className="z-10 mx-auto mt-6 mb-12">
        <Button
          aria-label="Contact"
          className="glow-button relative rounded-full! bg-background/95 px-20 hover:bg-background! active:bg-background"
          onClick={handleContactUs}
          size="xl"
          variant="ghost"
        >
          {t("common.contact_us")}
        </Button>
      </div>
    </div>
  );
};

export default CallToAction;
