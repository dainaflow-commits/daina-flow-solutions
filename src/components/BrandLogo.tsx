import logo from "@/assets/dainaflow-logo.png";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  textClassName?: string;
  className?: string;
}

const SIZES = {
  sm: "h-7 w-7",
  md: "h-9 w-9",
  lg: "h-11 w-11",
  xl: "h-16 w-16",
};

const TEXT = {
  sm: "text-base",
  md: "text-lg",
  lg: "text-xl",
  xl: "text-3xl",
};

export function BrandLogo({ size = "md", showText = true, textClassName, className }: BrandLogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <img src={logo} alt="Daina Flow" className={`${SIZES[size]} object-contain shrink-0`} />
      {showText && (
        <span className={`font-display font-bold tracking-tight ${TEXT[size]} ${textClassName ?? ""}`}>
          <span className="text-primary">Daina</span> <span className="text-[#f59e0b]">Flow</span>
        </span>
      )}
    </span>
  );
}
