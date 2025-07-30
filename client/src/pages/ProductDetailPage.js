import React, { useState, useEffect, useContext } from "react";
import { assetUrl } from "../config/api";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";
import Rating from "../components/Rating";
import apiRequest from "../utils/apiHelper";
import "./ProductDetailPage.css";

// İsimleri anonimleştirmek için yardımcı fonksiyon
const anonymizeName = (name) => {
  if (!name || typeof name !== "string") {
    return "Gizli Kullanıcı";
  }
  const parts = name.trim().split(" ");
  const anonymizedParts = parts.map((part) => {
    if (part.length <= 1) {
      return "*";
    }
    return part.charAt(0) + "*".repeat(part.length - 1);
  });
  return anonymizedParts.join(" ");
};

function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, authToken } = useContext(AuthContext);
  const { addToCart } = useContext(CartContext);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImage, setActiveImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("info");

  // Zoom için state'ler
  const [showZoom, setShowZoom] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });

  // Yorum formu için state'ler
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const fetchProduct = async () => {
    setLoading(true);
    try {
      const res = await apiRequest(`/products/${id}`);
      const data = await res.json();
      setProduct(data);
      if (data.images && data.images.length > 0) {
        setActiveImage(data.images[0]);
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    toast.success(`${quantity} adet "${product.name}" sepete eklendi!`);
    addToCart({ ...product, qty: quantity });
  };

  // Mouse hareketlerini takip eden fonksiyon
  const handleMouseMove = (e) => {
    const { left, top, width, height } =
      e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left) / width) * 100;
    const y = ((e.pageY - top) / height) * 100;
    setCursorPosition({ x, y });
  };

  const reviewSubmitHandler = async (e) => {
    e.preventDefault();
    setReviewLoading(true);
    try {
      const res = await apiRequest(`/products/${id}/reviews`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ rating, comment }),
      });
      const data = await res.json();

      toast.success("Yorumunuz başarıyla gönderildi!");
      setRating(0);
      setComment("");
      fetchProduct();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading)
    return <div className="loading-container">Ürün Yükleniyor...</div>;
  if (error) return <div className="error-container">Hata: {error}</div>;
  if (!product) return <div>Ürün bulunamadı.</div>;

  const imageArray =
    product.images && product.images.length > 0 ? product.images : [];

  return (
    <div className="product-detail-page">
      <div className="product-detail-main">
        <div className="product-gallery">
          <div
            className="main-image-container"
            onMouseEnter={() => setShowZoom(true)}
            onMouseLeave={() => setShowZoom(false)}
            onMouseMove={handleMouseMove}
          >
            <img
              src={assetUrl(activeImage)}
              alt={product.name}
              className="main-image-display"
              style={{ opacity: showZoom ? 0 : 1 }}
            />
            {showZoom && activeImage && (
              <div
                className="zoom-lens"
                style={{
                  backgroundImage: `url(${assetUrl(activeImage)})`,
                  backgroundPosition: `${cursorPosition.x}% ${cursorPosition.y}%`,
                }}
              />
            )}
          </div>
          <div className="thumbnail-container">
            {imageArray.map((img, index) => (
              <div
                key={index}
                className={`thumbnail-item ${
                  img === activeImage ? "active" : ""
                }`}
                onClick={() => setActiveImage(img)}
              >
                <img src={assetUrl(img)} alt={`Thumbnail ${index + 1}`} />
              </div>
            ))}
          </div>
        </div>
        <div className="product-info">
          <h1 className="product-title">{product.name}</h1>
          <div className="product-rating">
            <Rating
              value={product.rating}
              text={`${product.numReviews} yorum`}
            />
          </div>
          <div className="product-meta">
            <span>
              SKU: <strong>{product.sku || "Belirtilmemiş"}</strong>
            </span>
            <span>
              Garanti: <strong>{product.warrantyPeriod || "N/A"}</strong>
            </span>
          </div>
          <div className="product-price-section">
            <span className="current-price">
              {(product.salePrice || 0).toFixed(2)} ₺
            </span>
          </div>
          <div className="product-actions">
            <div className="quantity-selector">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
                -
              </button>
              <input
                type="number"
                value={quantity}
                min="1"
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
              <button onClick={() => setQuantity((q) => q + 1)}>+</button>
            </div>
            <button
              className="add-to-cart-button"
              onClick={handleAddToCart}
              disabled={product.stock < 1}
            >
              {product.stock < 1 ? "Stokta Yok" : "Sepete Ekle"}
            </button>
          </div>
        </div>
      </div>

      <div className="product-detailed-info">
        <div className="tab-buttons">
          <button
            className={activeTab === "info" ? "active" : ""}
            onClick={() => setActiveTab("info")}
          >
            Ürün Bilgileri
          </button>
          <button
            className={activeTab === "reviews" ? "active" : ""}
            onClick={() => setActiveTab("reviews")}
          >
            Ürün Yorumları ({product.numReviews})
          </button>
        </div>
        <div className="tab-content">
          {activeTab === "info" && (
            <div className="info-tab">
              <h2>Ürün Açıklaması</h2>
              <p>{product.description}</p>
              {product.specifications && product.specifications.length > 0 && (
                <>
                  <h3>Teknik Özellikler</h3>
                  <table className="specs-table">
                    <tbody>
                      {product.specifications.map((spec, index) => (
                        <tr key={index}>
                          <td>{spec.key}</td>
                          <td>{spec.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
              {product.boxContents && product.boxContents.length > 0 && (
                <>
                  <h3>Kutu İçeriği</h3>
                  <table className="specs-table">
                    <tbody>
                      {product.boxContents.map((content, index) => (
                        <tr key={index}>
                          <td>{content.quantity} Adet</td>
                          <td>{content.item}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          )}
          {activeTab === "reviews" && (
            <div className="reviews-tab">
              <h2>Müşteri Yorumları</h2>
              {product.reviews.length === 0 && (
                <p>Bu ürün için henüz yorum yapılmamış.</p>
              )}
              <div className="reviews-list">
                {product.reviews.map((review) => (
                  <div key={review._id} className="review-item">
                    <strong>{anonymizeName(review.name)}</strong>
                    <Rating value={review.rating} />
                    <p className="review-date">
                      {new Date(review.createdAt).toLocaleDateString("tr-TR")}
                    </p>
                    <p>{review.comment}</p>
                  </div>
                ))}
              </div>
              <div className="review-form-container">
                <h3>Yorumunuzu Yazın</h3>
                {user ? (
                  <form onSubmit={reviewSubmitHandler}>
                    <div className="form-group">
                      <label htmlFor="rating">Puanınız</label>
                      <select
                        id="rating"
                        value={rating}
                        onChange={(e) => setRating(e.target.value)}
                        required
                      >
                        <option value="">Seçiniz...</option>
                        <option value="1">1 - Çok Kötü</option>
                        <option value="2">2 - Kötü</option>
                        <option value="3">3 - Orta</option>
                        <option value="4">4 - İyi</option>
                        <option value="5">5 - Çok İyi</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="comment">Yorumunuz</label>
                      <textarea
                        id="comment"
                        rows="4"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        required
                      ></textarea>
                    </div>
                    <button
                      type="submit"
                      className="submit-btn"
                      disabled={reviewLoading}
                    >
                      {reviewLoading ? "Gönderiliyor..." : "Yorumu Gönder"}
                    </button>
                  </form>
                ) : (
                  <p>
                    Yorum yapmak için lütfen <a href="/login">giriş yapın</a>.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductDetailPage;
