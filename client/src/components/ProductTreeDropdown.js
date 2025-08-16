import DropdownWithSearch from "./DropdownWithSearch";

export const ProductTreeDropdown = ({ label, items, selected, onSelect }) => (
  <div className="form-group">
    <label>{label}</label>
    <DropdownWithSearch
      title={items?.find((item) => item._id === selected?._id)?.name || label}
      items={items}
      onClickList={onSelect}
      renderListItem={(item) => <span>{item.name}</span>}
    />
  </div>
);
