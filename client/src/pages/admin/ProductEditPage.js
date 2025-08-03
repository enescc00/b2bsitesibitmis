import React, { useState, useEffect, useContext } from "react";
import { API_BASE_URL } from "../../config/api";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { AuthContext } from "../../context/AuthContext";
import axios from "axios";
import "./AdminForm.css";

function ProductEditPage() {
  const { id: productId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { authToken } = useContext(AuthContext);

  const isNewProduct = !productId;

  const [formData, setFormData] = useState({
    name: "",
    images: [],
    description: "",
    category: "",
    components: [],
    sku: "",
    warrantyPeriod: "2 Yıl",
    specifications: [],
    boxContents: [],
    costPrice: 0,
    profitMargin: 20,
    salePrice: 0,
    stock: 0,
    isActive: true,
    isManufactured: false,
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newImageFiles, setNewImageFiles] = useState([]); // For new file uploads

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const catRes = await fetch(`${API_BASE_URL}/api/categories`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        if (!catRes.ok) throw new Error("Kategoriler alınamadı.");
        const catData = await catRes.json();
        setCategories(catData);

        if (isNewProduct) {
          const { newProductFromTree, inventoryItem } = location.state || {};
          if (newProductFromTree) {
            setFormData((prev) => ({
              ...prev,
              name: newProductFromTree.name,
              costPrice: newProductFromTree.costPrice,
              components: newProductFromTree.components,
            }));
          } else if (inventoryItem) {
            setFormData((prev) => ({
              ...prev,
              name: inventoryItem.name,
              costPrice: inventoryItem.unitPrice,
              components: [{ inventoryItem: inventoryItem._id, quantity: 1 }],
            }));
          }
        } else {
          const productRes = await fetch(
            `${API_BASE_URL}/api/products/${productId}`,
            {
              headers: {
                Authorization: `Bearer ${authToken}`,
              },
            }
          );
          if (!productRes.ok) throw new Error("Ürün verileri alınamadı.");
          const productToEdit = await productRes.json();
          productToEdit.images = productToEdit.images || [];
          productToEdit.specifications = productToEdit.specifications || [];
          productToEdit.boxContents = productToEdit.boxContents || [];
          setFormData({
            ...formData,
            ...productToEdit,
            category: productToEdit.category?._id,
          });
        }
      } catch (error) {
        toast.error(error.message);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    if (authToken) fetchInitialData();
  }, [productId, isNewProduct, authToken, location.state]);

  useEffect(() => {
    const cost = parseFloat(formData.costPrice) || 0;
    const margin = parseFloat(formData.profitMargin) || 0;
    setFormData((prev) => ({ ...prev, salePrice: cost * (1 + margin / 100) }));
  }, [formData.costPrice, formData.profitMargin]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setNewImageFiles((prevFiles) => [...prevFiles, ...newFiles]);

      setFormData((prevFormData) => ({
        ...prevFormData,
        images: [...prevFormData.images, ...newFiles],
      }));
    }
  };

  const handleRemoveImage = (image) => {
    // If it's a string, it's an existing image URL from the server
    if (typeof image === "string") {
      setFormData((prev) => ({
        ...prev,
        images: prev.images.filter((img) => img !== image),
      }));
    } else {
      // If it's an object, it's a new File object to be uploaded
      setNewImageFiles((prevFiles) =>
        prevFiles.filter((file) => file !== image)
      );
    }
  };

  const handleDynamicChange = (e, index, field, listName) => {
    const updatedList = [...formData[listName]];
    updatedList[index][field] = e.target.value;
    setFormData((prev) => ({ ...prev, [listName]: updatedList }));
  };

  const handleAddRow = (listName, newRowObject) => {
    setFormData((prev) => ({
      ...prev,
      [listName]: [...prev[listName], newRowObject],
    }));
  };

  const handleRemoveRow = (index, listName) => {
    const updatedList = [...formData[listName]];
    updatedList.splice(index, 1);
    setFormData((prev) => ({ ...prev, [listName]: updatedList }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    console.log("Form gönderimi başlıyor...");

    try {
      // Form validation - check for required fields
      const requiredFields = [
        "name",
        "description",
        "category",
        "costPrice",
        "stock",
      ];
      const missingFields = requiredFields.filter((field) => {
        const value = formData[field];
        // Sayısal değerler 0 olabilir, bu geçerli bir değerdir
        if (typeof value === "number") return false;
        return value === undefined || value === null || value === "";
      });

      if (missingFields.length > 0) {
        throw new Error(
          `Lütfen bu alanları doldurun: ${missingFields.join(", ")}`
        );
      }

      const formDataToSend = new FormData();

      // Her alan tipini doğru şekilde FormData'ya ekle
      Object.keys(formData).forEach((key) => {
        if (key === "images") return; // Resimleri ayrı işleyeceğiz

        // Dizileri JSON string olarak ekle
        if (Array.isArray(formData[key])) {
          console.log(`${key} (array):`, formData[key]);
          formDataToSend.append(key, JSON.stringify(formData[key]));
        }
        // Boolean değerleri string olarak ekle
        else if (typeof formData[key] === "boolean") {
          console.log(`${key} (boolean):`, formData[key]);
          formDataToSend.append(key, formData[key] ? "true" : "false");
        }
        // Sayısal değerleri string'e çevir
        else if (
          typeof formData[key] === "number" ||
          key === "costPrice" ||
          key === "stock"
        ) {
          console.log(`${key} (number):`, formData[key]);
          formDataToSend.append(key, String(formData[key]));
        }
        // Diğer değerleri olduğu gibi ekle
        else {
          console.log(`${key}:`, formData[key]);
          formDataToSend.append(key, formData[key]);
        }
      });

      // Mevcut resimleri ekle
      if (Array.isArray(formData.images) && formData.images.length > 0) {
        formData.images.forEach((image) => {
          if (typeof image === "string") {
            console.log("Mevcut resim ekleniyor:", image);
            formDataToSend.append("existingImages", image);
          }
        });
      } else {
        // En az bir resim olması için varsayılan placeholder resim URL'si ekle
        const placeholderImage = "https://placehold.co/300?text=Görsel+Yok";
        console.log(
          "Varsayılan placeholder resim ekleniyor:",
          placeholderImage
        );
        formDataToSend.append("existingImages", placeholderImage);
      }

      // Yeni dosyaları yükle
      if (newImageFiles.length > 0) {
        console.log(`${newImageFiles.length} yeni resim ekleniyor`);
        newImageFiles.forEach((file) => {
          formDataToSend.append("images", file);
        });
      }

      // API URL'lerini oluştur (API_BASE_URL kullanmak yerine direkt URL tanımla)
      const baseServerUrl = "https://b2bsitesibitmis.onrender.com";
      const apiUrl = productId
        ? `${baseServerUrl}/api/products/${productId}`
        : `${baseServerUrl}/api/products`;

      console.log(
        `API isteği gönderiliyor: ${productId ? "PUT" : "POST"} ${apiUrl}`
      );

      // axios konfigürasyonu
      const axiosConfig = {
        method: productId ? "put" : "post",
        url: apiUrl,
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "multipart/form-data",
        },
        data: formDataToSend,
        // İstek ve yanıt detaylarını görmek için
        validateStatus: function (status) {
          // Her durum kodunu kabul et ve hata yakalama bloğunda işle
          return true;
        },
      };

      // Axios ile istek at
      const response = await axios(axiosConfig);
      console.log("API yanıtı:", response.status, response.data);

      // Yanıt durumunu kontrol et
      if (response.status >= 200 && response.status < 300) {
        toast.success(
          `Ürün başarıyla ${isNewProduct ? "oluşturuldu" : "güncellendi"}.`
        );
        navigate("/admin/products");
      } else {
        // Hata yanıtı
        const errorMessage =
          response.data?.message || response.data?.msg || "İşlem başarısız.";
        const errorDetails = response.data?.errors
          ? `\nDetay: ${response.data.errors}`
          : "";
        throw new Error(`${errorMessage}${errorDetails}`);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Yükleniyor...</div>;
  if (error) return <div className="error-container">Hata: {error}.</div>;

  return (
    <div className="admin-page-container">
      <button onClick={() => navigate("/admin/products")} className="back-btn">
        {" "}
        &larr; Satış Ürünleri Listesine Dön
      </button>
      <h1>{isNewProduct ? "Yeni Satış Ürünü Ekle" : "Ürünü Düzenle"}</h1>
      <form onSubmit={handleSubmit} className="admin-form">
        <div className="form-section">
          <h3>Temel Bilgiler</h3>
          <div className="form-group">
            <label>Ürün Resimleri</label>
            <div className="image-previews">
              {/* Display existing images */}
              {newImageFiles.map((file, index) => (
                <div key={`new-${index}`} className="image-preview-item">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Yeni Resim ${index + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(file)}
                    className="delete-img-btn"
                  >
                    X
                  </button>
                </div>
              ))}
            </div>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="file-input"
              accept="image/*"
            />
          </div>
          <div className="form-grid">
            <div className="form-group">
              {" "}
              <label>Ürün Adı</label>{" "}
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />{" "}
            </div>
            <div className="form-group">
              {" "}
              <label>Kategori</label>{" "}
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                {" "}
                <option value="">Kategori Seçiniz</option>{" "}
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}{" "}
              </select>{" "}
            </div>
            <div className="form-group">
              {" "}
              <label>Stok Kodu (SKU)</label>{" "}
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
              />{" "}
            </div>
            <div className="form-group">
              {" "}
              <label>Garanti Süresi</label>{" "}
              <input
                type="text"
                name="warrantyPeriod"
                value={formData.warrantyPeriod}
                onChange={handleChange}
              />{" "}
            </div>
            <div className="form-group grid-span-2">
              {" "}
              <label>Açıklama</label>{" "}
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="5"
                required
              ></textarea>{" "}
            </div>
          </div>
        </div>
        <div className="form-section">
          <h3>Teknik Özellikler</h3>
          {formData.specifications.map((spec, index) => (
            <div key={index} className="dynamic-form-row">
              {/* === DÜZELTME: required özelliği eklendi === */}
              <input
                type="text"
                placeholder="Özellik Adı (örn: Renk)"
                value={spec.key}
                onChange={(e) =>
                  handleDynamicChange(e, index, "key", "specifications")
                }
                required
              />
              <input
                type="text"
                placeholder="Özellik Değeri (örn: Siyah)"
                value={spec.value}
                onChange={(e) =>
                  handleDynamicChange(e, index, "value", "specifications")
                }
                required
              />
              <button
                type="button"
                onClick={() => handleRemoveRow(index, "specifications")}
                className="remove-row-btn"
              >
                Sil
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              handleAddRow("specifications", { key: "", value: "" })
            }
            className="add-row-btn"
          >
            Özellik Ekle
          </button>
        </div>
        <div className="form-section">
          <h3>Kutu İçeriği</h3>
          {formData.boxContents.map((content, index) => (
            <div key={index} className="dynamic-form-row">
              {/* === DÜZELTME: required özelliği eklendi === */}
              <input
                type="text"
                placeholder="Ürün (örn: Tepe Duşu)"
                value={content.item}
                onChange={(e) =>
                  handleDynamicChange(e, index, "item", "boxContents")
                }
                required
              />
              <input
                type="number"
                placeholder="Adet"
                value={content.quantity}
                onChange={(e) =>
                  handleDynamicChange(e, index, "quantity", "boxContents")
                }
                style={{ maxWidth: "100px" }}
                required
              />
              <button
                type="button"
                onClick={() => handleRemoveRow(index, "boxContents")}
                className="remove-row-btn"
              >
                Sil
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              handleAddRow("boxContents", { item: "", quantity: 1 })
            }
            className="add-row-btn"
          >
            Kutu İçeriği Ekle
          </button>
        </div>
        <div className="form-section">
          <h3>Fiyatlandırma ve Stok</h3>
          <div className="form-grid">
            <div className="form-group">
              {" "}
              <label>Maliyet Fiyatı (TL)</label>{" "}
              <input
                type="number"
                name="costPrice"
                value={formData.costPrice}
                onChange={handleChange}
                required
              />{" "}
            </div>
            <div className="form-group">
              {" "}
              <label>Kâr Marjı (%)</label>{" "}
              <input
                type="number"
                name="profitMargin"
                value={formData.profitMargin}
                onChange={handleChange}
              />{" "}
            </div>
            <div className="form-group">
              {" "}
              <label>Hesaplanan Satış Fiyatı (TL)</label>{" "}
              <input
                type="text"
                value={formData.salePrice.toFixed(2)}
                readOnly
              />{" "}
            </div>
            <div className="form-group">
              {" "}
              <label>Stok Adedi</label>{" "}
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                required
              />{" "}
            </div>
          </div>
        </div>
        <div className="form-check">
          <input
            type="checkbox"
            id="isActive"
            name="isActive"
            className="form-check-input"
            checked={formData.isActive}
            onChange={handleChange}
          />
          <label htmlFor="isActive" className="fw-bold">
            Satışta Aktif mi?
          </label>
        </div>
        <div className="form-check">
          <input
            type="checkbox"
            id="isManufactured"
            name="isManufactured"
            className="form-check-input"
            checked={formData.isManufactured}
            onChange={handleChange}
          />
          <label htmlFor="isManufactured" className="fw-bold">
            Üretildi Mi?
          </label>
        </div>
        <button type="submit" className="submit-btn" disabled={loading}>
          {isNewProduct ? "Ürünü Oluştur" : "Değişiklikleri Kaydet"}
        </button>
      </form>
    </div>
  );
}

export default ProductEditPage;
