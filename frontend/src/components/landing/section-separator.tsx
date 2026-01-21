import { Scales } from "@/components/ui/scales";

export function SectionSeparator() {
  return (
    <div className="section-rails relative h-8 overflow-hidden bg-black" aria-hidden="true">
      {/* Full-width continuous separator lines extending to both ends of the screen */}
      <div className="absolute inset-x-0 top-0 h-px bg-white/[.08]" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-white/[.08]" />

      {/* Diagonal striped rectangle fitted inside vertical rails with 0 margin to the lines */}
      <div
        className="absolute inset-y-0 overflow-hidden"
        style={{
          left: "max(1.25rem, calc(50% - 40rem))",
          right: "max(1.25rem, calc(50% - 40rem))",
        }}
      >
        <Scales orientation="diagonal" size={9} color="rgba(255,255,255,.14)" />
      </div>
    </div>
  );
}
