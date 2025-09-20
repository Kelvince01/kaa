import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@kaa/ui/components/accordion";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { faqsData } from "../marketing-config";

const FAQ = () => {
  const t = useTranslations();
  return (
    <div className="mx-auto max-w-[48rem]">
      <Accordion className="w-full" collapsible type="single">
        {faqsData.map((faq, index) => {
          const question = `about.faq.question_${index + 1}`;
          const answer = `about.faq.answer_${index + 1}`;

          return (
            <AccordionItem key={faq.id} value={faq.id}>
              <AccordionTrigger>
                <span className="text-left text-lg">{t(question)}</span>
              </AccordionTrigger>
              <AccordionContent>
                <FaqAnswer answer={answer} faq={faq} />
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
};

const FaqAnswer = ({
  faq,
  answer,
}: {
  faq: { link?: string };
  answer: string;
}) => {
  const t = useTranslations();

  return t.rich(answer, {
    // biome-ignore lint/correctness/noNestedComponentDefinitions: We need to use the Link component from next/link
    Link: (chunks: React.ReactNode) => (
      <Link
        aria-label={`Visit ${faq.link}`}
        className="underline"
        href={faq.link ?? ""}
        rel="noopener noreferrer"
        target="_blank"
      >
        {chunks}
      </Link>
    ),
  });
};

export default FAQ;
