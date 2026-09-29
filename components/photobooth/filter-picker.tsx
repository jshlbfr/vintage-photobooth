import { FilterThumbnail } from "@/components/filters/filtered-image";
import { FILTER_PREVIEWS, SAMPLE_PORTRAIT, type FilterId } from "@/lib/design-data";

export function FilterPicker({ value, onChange, disabled = false }: { value: FilterId; onChange: (id: FilterId) => void; disabled?: boolean }) {
  return <div className="filter-picker" role="group" aria-label="Preview a film look">{FILTER_PREVIEWS.map((filter) => <button className="filter-option" disabled={disabled} key={filter.name} aria-label={filter.name} aria-pressed={value === filter.id} onClick={() => onChange(filter.id)} type="button"><span className="filter-thumbnail"><FilterThumbnail src={SAMPLE_PORTRAIT} filterId={filter.id} /></span><span>{filter.name}</span></button>)}</div>;
}
