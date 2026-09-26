import Image from "next/image";
import { FILTER_PREVIEWS, SAMPLE_PORTRAIT } from "@/lib/design-data";

export function FilterPicker({ value, onChange }: { value: number; onChange: (index: number) => void }) {
  return <div className="filter-picker" role="group" aria-label="Preview a film look">{FILTER_PREVIEWS.map((filter, index) => <button className="filter-option" key={filter.name} aria-label={`FL ${index + 1}: ${filter.name}`} aria-pressed={value === index} onClick={() => onChange(index)} type="button"><span className="filter-thumbnail"><Image src={SAMPLE_PORTRAIT} alt="" fill sizes="80px" style={{ filter: filter.css }} /></span><span>FL {index + 1}</span></button>)}</div>;
}
