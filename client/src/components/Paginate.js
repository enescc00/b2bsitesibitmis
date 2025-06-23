import React from 'react';
import { Link } from 'react-router-dom';
import './Paginate.css';

/**
 * Paginate Bileşeni
 * Sayfalama arayüzünü oluşturur.
 * İki modda çalışabilir:
 * 1. URL Değiştirme Modu (varsayılan): react-router-dom Link'leri oluşturur.
 * 2. Fonksiyon Tetikleme Modu: Eğer 'onPageChange' prop'u verilirse, Link yerine buton oluşturur ve bu fonksiyonu çağırır.
 * * @param {object} props
 * @param {number} props.pages - Toplam sayfa sayısı
 * @param {number} props.page - Aktif sayfa numarası
 * @param {function} [props.onPageChange] - Sayfa değiştiğinde çağrılacak fonksiyon (opsiyonel)
 * @param {boolean} [props.isAdmin] - Admin paneli URL yapısı için flag
 * @param {string} [props.keyword] - Arama kelimesi (URL için)
 * @param {string} [props.baseUrl] - Admin URL'leri için temel yol
 */
const Paginate = ({ pages, page, isAdmin = false, keyword = '', baseUrl = '/products', onPageChange }) => {
  if (pages <= 1) {
    return null;
  }

  // URL tabanlı sayfalama için link oluşturan fonksiyon
  const getPageUrl = (x) => {
    const pageNum = x + 1;
    if (isAdmin) {
      return `${baseUrl}/page/${pageNum}`;
    } else {
      if (keyword) {
        return `/search/${keyword}/page/${pageNum}`;
      }
      return `/products/page/${pageNum}`;
    }
  };

  return (
    <div className="pagination">
      {[...Array(pages).keys()].map((x) => {
        const pageNum = x + 1;
        // onPageChange prop'u varsa, Link yerine button render et
        if (onPageChange) {
          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={pageNum === page ? 'page-item active' : 'page-item'}
            >
              {pageNum}
            </button>
          );
        }

        // onPageChange yoksa, standart Link'i render et
        return (
          <Link
            key={pageNum}
            to={getPageUrl(x)}
            className={pageNum === page ? 'page-item active' : 'page-item'}
          >
            {pageNum}
          </Link>
        );
      })}
    </div>
  );
};

export default Paginate;