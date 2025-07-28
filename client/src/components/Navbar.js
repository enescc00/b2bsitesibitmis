import React, { useState, useEffect, useContext, useRef } from "react";
import { API_BASE_URL, assetUrl } from "../config/api";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";
import { toast } from "react-toastify";
import "./Navbar.css";
import "./DarkMode.css";

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const { cartItems } = useContext(CartContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [menuItems, setMenuItems] = useState([]);
  const [keyword, setKeyword] = useState("");

  const [suggestions, setSuggestions] = useState([]);
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark"
  );
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setIsSuggestionsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchContainerRef]);

  useEffect(() => {
    if (keyword.trim() === "") {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/products/search-suggestions?keyword=${keyword}`
        );
        const data = await res.json();
        if (res.ok) {
          setSuggestions(data);
          setIsSuggestionsOpen(true);
        }
      } catch (error) {
        console.error("Arama önerileri alınamadı:", error);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [keyword]);

  useEffect(() => {
    const fetchAndProcessCategories = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/categories`);
        if (!res.ok) {
          const errorData = await res
            .json()
            .catch(() => ({ msg: "Kategori bilgileri sunucudan alınamadı." }));
          throw new Error(errorData.msg);
        }
        const categories = await res.json();
        const topLevelCategories = categories.filter((cat) => !cat.parent);
        const subCategories = categories.filter((cat) => cat.parent);
        const processedMenu = topLevelCategories.map((parent) => ({
          ...parent,
          children: subCategories.filter(
            (child) => String(child.parent) === String(parent._id)
          ),
        }));
        setMenuItems(processedMenu);
      } catch (error) {
        console.error("Kategoriler çekilirken hata oluştu:", error);
        toast.error(error.message);
      }
    };
    fetchAndProcessCategories();
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const searchHandler = (e) => {
    e.preventDefault();
    setIsSuggestionsOpen(false);
    if (keyword.trim()) {
      navigate(`/search/${keyword}`);
    } else {
      navigate("/products");
    }
  };

  const onSuggestionClick = () => {
    setKeyword("");
    setSuggestions([]);
    setIsSuggestionsOpen(false);
  };

  const totalCartItems = cartItems.reduce((acc, item) => acc + item.qty, 0);

  return (
    <header className="header-container">
      <nav className="navbar">
        <div className="navbar-top">
          <Link to="/" className="navbar-brand">
            B2B Platform
          </Link>

          <form
            className="search-container"
            onSubmit={searchHandler}
            ref={searchContainerRef}
          >
            <input
              type="text"
              className="search-input"
              placeholder="Ne aramıştınız?"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onFocus={() => setIsSuggestionsOpen(true)}
            />
            <button type="submit" className="search-button">
              <i className="fas fa-search"></i>
            </button>

            {isSuggestionsOpen && suggestions.length > 0 && (
              <div className="search-suggestions">
                {suggestions.map((product) => (
                  <Link
                    key={product._id}
                    to={`/product/${product._id}`}
                    className="suggestion-item"
                    onClick={onSuggestionClick}
                  >
                    <img
                      src={
                        product.images && product.images.length > 0
                          ? assetUrl(product.images[0])
                          : "https://placehold.co/300?text=Görsel+Yok"
                      }
                      alt={product.name}
                      className="suggestion-image"
                    />
                    <span className="suggestion-name">{product.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </form>

          <div className="nav-actions">
            <button
              className="dark-toggle"
              onClick={() => setDarkMode((prev) => !prev)}
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
            {user ? (
              <div className="account-menu">
                <div className="account-menu-trigger nav-action-item">
                  <i className="fas fa-user"></i>
                  <span>Hesabım</span>
                </div>
                <div className="dropdown-content">
                  <div className="dropdown-header">Merhaba, {user.name}</div>
                  <Link to="/profile/info" className="dropdown-link">
                    Kullanıcı Bilgilerim
                  </Link>
                  <Link to="/profile/orders" className="dropdown-link">
                    Siparişlerim
                  </Link>
                  <Link to="/profile/wishlist" className="dropdown-link">
                    Favorilerim
                  </Link>
                  <Link to="/profile/quotes" className="dropdown-link">
                    Tekliflerim
                  </Link>
                  <Link to="/new-quote" className="dropdown-link">
                    Yeni Teklif
                  </Link>

                  {/* === YENİ EKLENEN KISIM: Satış Temsilcisi Portalı Linki === */}
                  {user.role === "supplier" && (
                    <Link
                      to="/supplier/dashboard"
                      className="dropdown-link supplier-link"
                    >
                      Tedarikçi Portalı
                    </Link>
                  )}
                  {user.role === "sales_rep" && (
                    <Link
                      to="/portal/dashboard"
                      className="dropdown-link sales-rep-link"
                    >
                      Pazarlamacı Portalı
                    </Link>
                  )}

                  {user.role === "admin" && (
                    <Link
                      to="/admin/dashboard"
                      className="dropdown-link admin-link"
                    >
                      Admin Paneli
                    </Link>
                  )}
                  <div className="dropdown-divider"></div>
                  <button
                    onClick={handleLogout}
                    className="dropdown-link-button"
                  >
                    Çıkış Yap
                  </button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="nav-link nav-action-item">
                <i className="fas fa-user"></i>
                <span>Üyelik</span>
              </Link>
            )}

            <Link to="/cart" className="nav-link nav-action-item">
              <i className="fas fa-shopping-cart"></i>
              <span>Sepetim</span>
              {totalCartItems > 0 && (
                <span className="cart-badge">{totalCartItems}</span>
              )}
            </Link>
          </div>
        </div>
        <div className="navbar-bottom">
          <Link to="/products" className="nav-link main-category">
            TÜM ÜRÜNLER
          </Link>
          {menuItems.map((category) => (
            <div key={category._id} className="mega-menu-item">
              <Link
                to={`/category/${category._id}`}
                className="nav-link main-category"
              >
                {category.name}
              </Link>
              {category.children.length > 0 && (
                <div className="mega-menu-content">
                  {category.children.map((child) => (
                    <Link
                      key={child._id}
                      to={`/category/${child._id}`}
                      className="sub-category-link"
                    >
                      {child.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
