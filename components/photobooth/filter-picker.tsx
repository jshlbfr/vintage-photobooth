import Image from "next/image";
import { FILTER_PREVIEWS, SAMPLE_PORTRAIT, type FilterId } from "@/lib/design-data";

export function FilterPicker({ value, onChange, disabled = false }: { value: FilterId; onChange: (id: FilterId) => void; disabled?: boolean }) {
  return <div className="filter-picker" role="group" aria-label="Preview a film look">{FILTER_PREVIEWS.map((filter, index) => <button className="filter-option" disabled={disabled} key={filter.name} aria-label={`FL ${index + 1}: ${filter.name}`} aria-pressed={value === filter.id} onClick={() => onChange(filter.id)} type="button"><span className="filter-thumbnail"><Image src={SAMPLE_PORTRAIT} alt="" fill sizes="80px" style={{ filter: filter.css }} /></span><span>FL {index + 1}</span></button>)}</div>;
}
