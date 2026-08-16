import { PageHeader } from "@/components/page-header";

export function EmbedPage({
  title,
  subtitle,
  src,
}: {
  title: string;
  subtitle?: string;
  src: string;
}) {
  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} />
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <iframe
          src={src}
          title={title}
          className="block h-[calc(100vh-10rem)] w-full"
          allowFullScreen
          allow="fullscreen"
        />
      </div>
    </div>
  );
}