import Image from "next/image";
import { BUILDING_NAME, BUILDING_SUBTITLE } from "@/lib/branding";

type AppLogoProps = {
  variant?: "header" | "auth";
  className?: string;
  priority?: boolean;
};

const variantClassName: Record<NonNullable<AppLogoProps["variant"]>, string> = {
  header: "h-10 w-auto",
  auth: "mx-auto h-44 w-auto max-w-full sm:h-52 md:h-56",
};

export function AppLogo({
  variant = "header",
  className = "",
  priority = false,
}: AppLogoProps) {
  return (
    <Image
      src="/logo.jpeg"
      alt={`${BUILDING_NAME}, ${BUILDING_SUBTITLE}`}
      width={380}
      height={380}
      priority={priority}
      className={`object-contain ${variantClassName[variant]} ${className}`.trim()}
    />
  );
}
