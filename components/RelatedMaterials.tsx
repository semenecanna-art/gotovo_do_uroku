import { MaterialCard } from "@/components/MaterialCard";
import { SectionHeading } from "@/components/SectionHeading";
import type { Material } from "@/lib/types";

export function RelatedMaterials({ items }: { items: Material[] }) {
  if (!items.length) return null;
  return (
    <section className="related-section section-space">
      <SectionHeading
        eyebrow="Може сподобатися"
        title="Схожі матеріали"
        description="Ще кілька матеріалів за тією самою темою, предметом або для цього класу."
      />
      <div className="material-grid">
        {items.map((item) => (
          <MaterialCard key={item.id} material={item} />
        ))}
      </div>
    </section>
  );
}
