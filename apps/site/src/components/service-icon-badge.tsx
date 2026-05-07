import Image from "next/image";

// Always-light badge so the dark-inked SVG service icons stay legible in
// dark mode too. `bg-background/90` flips to dark in dark mode and hides
// them — see commit c36b095. Two sizes: "sm" for the homepage strip,
// "lg" for the /services list.
export function ServiceIconBadge({
  src,
  size = "sm",
}: {
  src: string;
  size?: "sm" | "lg";
}) {
  const badge = size === "lg" ? "h-14 w-14" : "h-12 w-12";
  const icon = size === "lg" ? "h-8 w-8" : "h-7 w-7";
  const dim = size === "lg" ? 32 : 28;
  return (
    <div
      className={`absolute bottom-3 left-3 flex ${badge} items-center justify-center rounded-xl border border-white/40 bg-white/95 backdrop-blur`}
    >
      <Image
        src={src}
        alt=""
        width={dim}
        height={dim}
        aria-hidden
        className={`${icon} object-contain`}
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
