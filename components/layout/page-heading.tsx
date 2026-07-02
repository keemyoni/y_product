import { Badge } from "@/components/ui";

type PageHeadingProps = {
  eyebrow?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function PageHeading({ eyebrow, title, description, action }: PageHeadingProps) {
  return (
    <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        {eyebrow ? <Badge variant="outline">{eyebrow}</Badge> : null}
        <h1 className="mt-4 text-balance text-3xl font-semibold md:text-5xl">{title}</h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">{description}</p>
      </div>
      {action ? <div className="flex shrink-0 gap-2">{action}</div> : null}
    </div>
  );
}
