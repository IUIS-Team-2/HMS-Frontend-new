import { INVESTIGATION_GROUPS, REPORT_TEMPLATES } from "../../constants/billing/reportTemplates";
import SearchMultiDropdown from "./SearchMultiDropdown";

export default function InvestigationsDropdown({ value, onChange }) {
  const groups = INVESTIGATION_GROUPS.map(g => ({
    group: g.group,
    color: g.color,
    items: g.items.map(key => REPORT_TEMPLATES[key]?.label || key),
  }));

  return (
    <SearchMultiDropdown
      value={value}
      onChange={onChange}
      groups={groups}
      placeholder="Select investigations / reports..."
      chipColor="#0369a1"
      chipBg="#e0f2fe"
      chipBorder="#7dd3fc"
      allowCustom={false}
    />
  );
}