import React, { useState } from "react";

function DropdownWithSearch({ title, items, onClickList, renderListItem }) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredItems =
    items?.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  return (
    <div className="btn-group w-100 mb-3">
      <button
        type="button"
        className="btn bg-white dropdown-toggle d-flex justify-content-between align-items-center w-100 border p-2"
        data-bs-toggle="dropdown"
        aria-expanded="false"
      >
        <span className="text-start text">{title}</span>
        <span className="dropdown-toggle-icon">
          <i className="bi bi-caret-down-fill"></i>
        </span>
      </button>
      <ul className="dropdown-menu w-100 p-2">
        <li>
          <input
            className="w-100"
            placeholder="Arama Yap..."
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            autoFocus={true}
          />
        </li>
        {filteredItems.map((item) => (
          <li
            key={item._id}
            role="button"
            onClick={() => {
              onClickList(item);
              setSearchQuery("");
            }}
            className="dropdown-item"
          >
            {renderListItem(item)}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default DropdownWithSearch;
