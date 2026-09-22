import { useEffect, useState } from 'react';
import { createProduct, deleteProduct, getProducts, updateProduct } from '../../src/api/products.api';
import { getProductOptions } from '../../src/api/dashboard.api';
import { products as mockProductsList } from '../../src/data/product';
import AdminPanel from '../../src/components/admin/AdminPanel';
import AdminTable from '../../src/components/admin/AdminTable';

const blank = { name: '', description: '', price: '', quantity: '', category: '', artist: '', imageUrl: '', tags: '' };

const defaultOptions = {
  categories: [
    { _id: 'cat-vinyl', name: 'Vinyl' },
    { _id: 'cat-apparel', name: 'Apparel' },
    { _id: 'cat-acc', name: 'Accessories' },
    { _id: 'cat-col', name: 'Collectibles' },
  ],
  artists: [
    { _id: 'art-parkinson', name: 'THE PARKINSON' },
    { _id: 'art-smallroom', name: 'SMALLROOM' },
    { _id: 'art-bird', name: 'Thongchai McIntyre' },
    { _id: 'art-mr', name: 'MERCHROOM' },
  ],
};

const getFallbackProducts = () =>
  (mockProductsList || []).map((p) => ({
    _id: p.id,
    name: p.name,
    artist: { name: p.brand || 'MERCHROOM' },
    category: { name: 'Merchandise' },
    price: p.price,
    quantity: 25,
    imageUrl: p.image || '',
  }));

export default function ProductManagement() {
  const [products, setProducts] = useState(getFallbackProducts);
  const [options, setOptions] = useState(defaultOptions);
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    getProducts()
      .then((data) => {
        if (data && Array.isArray(data.products) && data.products.length > 0) {
          setProducts(data.products);
        } else {
          setProducts(getFallbackProducts());
        }
      })
      .catch(() => {
        setProducts(getFallbackProducts());
      });
  };

  useEffect(() => {
    load();
    getProductOptions()
      .then((opts) => {
        if (opts && Array.isArray(opts.categories) && Array.isArray(opts.artists)) {
          setOptions(opts);
        }
      })
      .catch(() => {
        setOptions(defaultOptions);
      });
  }, []);

  const save = async (event) => {
    event.preventDefault();
    try {
      const body = {
        ...form,
        price: Number(form.price),
        quantity: Number(form.quantity),
        tags: form.tags ? form.tags.split(',').map((tag) => tag.trim()).filter(Boolean) : [],
      };
      const data = form._id ? await updateProduct(form._id, body) : await createProduct(body);
      const savedProduct = data?.product || { ...body, _id: form._id || `prod-${Date.now()}` };
      setProducts((items) =>
        form._id ? items.map((item) => (item._id === savedProduct._id ? savedProduct : item)) : [savedProduct, ...items]
      );
      setForm(null);
    } catch {
      // Local fallback update
      const localProduct = {
        ...form,
        _id: form._id || `prod-${Date.now()}`,
        price: Number(form.price),
        quantity: Number(form.quantity),
      };
      setProducts((items) =>
        form._id ? items.map((item) => (item._id === localProduct._id ? localProduct : item)) : [localProduct, ...items]
      );
      setForm(null);
    }
  };

  const edit = (item) =>
    setForm({
      ...item,
      category: item.category?._id || item.category || '',
      artist: item.artist?._id || item.artist || '',
      tags: Array.isArray(item.tags) ? item.tags.join(', ') : item.tags || '',
    });

  const safeProducts = Array.isArray(products) ? products : [];
  const safeCategories = Array.isArray(options?.categories) ? options.categories : defaultOptions.categories;
  const safeArtists = Array.isArray(options?.artists) ? options.artists : defaultOptions.artists;

  return (
    <div className="admin-page">
      <AdminPanel
        title="Product Management"
        action={
          <button className="primary-btn" onClick={() => setForm(blank)}>
            Add product
          </button>
        }
      >
        {error && <p className="form-error">{error}</p>}
        <AdminTable columns={['Product', 'Artist', 'Category', 'Price', 'Stock', '']}>
          {safeProducts.map((item) => (
            <tr key={item._id || item.id}>
              <td>{item.name}</td>
              <td>{item.artist?.name || (typeof item.artist === 'string' ? item.artist : '—')}</td>
              <td>{item.category?.name || (typeof item.category === 'string' ? item.category : '—')}</td>
              <td>฿{Number(item.price || 0).toLocaleString()}</td>
              <td>{item.quantity ?? 0}</td>
              <td>
                <button className="link-btn" onClick={() => edit(item)}>
                  Edit
                </button>
                <button
                  className="link-btn danger"
                  onClick={async () => {
                    if (window.confirm('Delete this product?')) {
                      try {
                        await deleteProduct(item._id);
                      } catch {
                        // ignore error and proceed with local state deletion
                      }
                      setProducts((all) => all.filter((p) => p._id !== item._id));
                    }
                  }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </AdminTable>
      </AdminPanel>

      {form && (
        <div className="modal">
          <form className="product-form" onSubmit={save}>
            <button type="button" className="close" onClick={() => setForm(null)}>
              ×
            </button>
            <h2>{form._id ? 'Edit product' : 'Add product'}</h2>
            <input
              required
              placeholder="Name"
              value={form.name || ''}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <textarea
              placeholder="Description"
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <input
              required
              type="number"
              min="0"
              placeholder="Price"
              value={form.price ?? ''}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
            <input
              required
              type="number"
              min="0"
              placeholder="Quantity"
              value={form.quantity ?? ''}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
            <select
              required
              value={form.category || ''}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="">Category</option>
              {safeCategories.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name}
                </option>
              ))}
            </select>
            <select value={form.artist || ''} onChange={(e) => setForm({ ...form, artist: e.target.value })}>
              <option value="">No artist</option>
              {safeArtists.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name}
                </option>
              ))}
            </select>
            <input
              placeholder="Image URL"
              value={form.imageUrl || ''}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            />
            <input
              placeholder="Tags, separated by commas"
              value={form.tags || ''}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
            />
            <button className="primary-btn">Save product</button>
          </form>
        </div>
      )}
    </div>
  );
}
