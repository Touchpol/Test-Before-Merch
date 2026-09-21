import { useEffect, useState } from 'react';
import { createProduct, deleteProduct, getProducts, updateProduct } from '../../src/api/products.api';
import { getProductOptions } from '../../src/api/dashboard.api';
import { products as mockProductsList } from '../../src/data/product';
import AdminPanel from '../../src/components/admin/AdminPanel';
import AdminTable from '../../src/components/admin/AdminTable';

const blank = { name: '', description: '', price: '', quantity: '', category: '', artist: '', imageUrl: '', tags: '' };

const defaultOptions = {
  categories: [
    { _id: '681a0f1e2d3c4b5a6970f015', name: 'Merchandise' },
    { _id: '681a0f1e2d3c4b5a6970f010', name: 'เสื้อผ้า' },
    { _id: '681a0f1e2d3c4b5a6970f011', name: 'หมวก' },
    { _id: '681a0f1e2d3c4b5a6970f013', name: 'แฟนไอเทม' },
    { _id: '681a0f1e2d3c4b5a6970f014', name: 'อัลบั้มเพลง' },
    { _id: 'cat-vinyl', name: 'Vinyl' },
    { _id: 'cat-apparel', name: 'Apparel' },
    { _id: 'cat-acc', name: 'Accessories' },
    { _id: 'cat-col', name: 'Collectibles' },
  ],
  artists: [
    { _id: '681a0f1e2d3c4b5a6970f070', name: 'THE PARKINSON' },
    { _id: '681a0f1e2d3c4b5a6970f071', name: 'SMALLROOM' },
    { _id: '681a0f1e2d3c4b5a6970f072', name: 'LAONGFONG' },
    { _id: '681a0f1e2d3c4b5a6970f073', name: 'TAYLOR SWIFT' },
    { _id: '681a0f1e2d3c4b5a6970f074', name: 'JUSTIN BIEBER' },
    { _id: '681a0f1e2d3c4b5a6970f075', name: 'LINKIN PARK' },
    { _id: '681a0f1e2d3c4b5a6970f076', name: 'BILLIE EILISH' },
    { _id: '681a0f1e2d3c4b5a6970f077', name: 'A7X' },
    { _id: '681a0f1e2d3c4b5a6970f078', name: 'SACIT' },
    { _id: '681a0f1e2d3c4b5a6970f079', name: 'CHAKSARN' },
    { _id: '681a0f1e2d3c4b5a6970f07a', name: 'NO ONE ELSE' },
    { _id: '681a0f1e2d3c4b5a6970f07b', name: 'NONT TANONT' },
    { _id: '681a0f1e2d3c4b5a6970f07c', name: 'WHAL & DOLPH' },
    { _id: '681a0f1e2d3c4b5a6970f07d', name: 'UNCLE BEN' },
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
    setError('');
    try {
      const body = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        quantity: Number(form.quantity),
        imageUrl: form.imageUrl,
        category: form.category || undefined,
        artist: form.artist || undefined,
        tags: form.tags ? (typeof form.tags === 'string' ? form.tags.split(',').map((tag) => tag.trim()).filter(Boolean) : form.tags) : [],
      };
      if (form._id) {
        await updateProduct(form._id, body);
      } else {
        await createProduct(body);
      }
      load();
      setForm(null);
    } catch (err) {
      setError(err?.message || 'Failed to save product to database');
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

  const remove = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await deleteProduct(id);
      load();
    } catch {
      setProducts((all) => all.filter((p) => p._id !== id && p.id !== id));
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

  const resolveCategoryName = (category) => {
    if (!category) return '—';
    if (typeof category === 'object' && category.name) return category.name;
    const found = safeCategories.find((c) => String(c._id) === String(category));
    return found ? found.name : String(category);
  };

  const resolveArtistName = (artist) => {
    if (!artist) return '—';
    if (typeof artist === 'object' && artist.name) return artist.name;
    const found = safeArtists.find((a) => String(a._id) === String(artist));
    return found ? found.name : String(artist);
  };

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
              <td>{resolveArtistName(item.artist)}</td>
              <td>{resolveCategoryName(item.category)}</td>
              <td>฿{Number(item.price || 0).toLocaleString()}</td>
              <td>{item.quantity ?? 0}</td>
              <td>
                <button className="link-btn" onClick={() => edit(item)}>
                  Edit
                </button>
                <button
                  className="link-btn danger"
                  onClick={() => remove(item._id || item.id)}
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
