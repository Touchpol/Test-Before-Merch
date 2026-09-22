// ไฟล์: client/pages/Product.jsx

// 1. นำเข้าเครื่องมือ (Tools & Hooks) จาก React และ Library ต่างๆ
// - useState: ตัวสร้าง "กล่องจำค่า" (State) ถ้าค่าเปลี่ยน หน้าเว็บจะเปลี่ยนตามอัตโนมัติ
// - useEffect: ตัวสั่งการให้ทำอะไรบางอย่างเมื่อเกิดเหตุการณ์ เช่น การคลิกข้างนอกเพื่อปิดเมนู
// - useMemo: ตัวช่วยจำผลลัพธ์การคำนวณ เช่น การกรองสินค้า เพื่อไม่ต้องคำนวณใหม่ซ้ำๆ ให้เว็บช้า
// - useRef: ตัวช่วยอ้างอิงตำแหน่งองค์ประกอบบนหน้าเว็บ เช่น ช่องค้นหา หรือปุ่ม Dropdown
import { useEffect, useMemo, useRef, useState } from 'react';

// นำเข้าตัวอ่าน URL Search Parameters (เช่น ?cat=... หรือ ?q=...)
import { useSearchParams } from 'react-router-dom';

// นำเข้าไอคอนจาก Lucide React
import { ChevronDown, Flag, Search, X } from 'lucide-react';

// นำเข้าข้อมูล Mock Data สินค้า และตัวเชื่อม Context ตระกร้าสินค้า
import { products } from '../src/data/product';
import { categoryFilter } from '../src/data/sections';
import { useCart } from '../src/context/CartContext';

// นำเข้า Components ย่อยมาประกอบกัน
import Container from '../src/components/ui/Container';
import ProductCard from '../src/components/ui/ProductCard';
import Breadcrumb from '../src/components/ui/Breadcrumb';

// กำหนดจำนวนสินค้าที่จะแสดงต่อ 1 หน้า (Pagination)
const PER_PAGE = 8;

// กำหนดเงื่อนไขแมปหมวดหมู่กับรหัสลงท้าย ID สินค้า (เช่น ID ลงท้ายด้วย 'th' = สินค้าไทย)
const CATEGORY_SUFFIX = { 'Thai Band': 'th', 'Pop Culture': 'en', Movie: 'en', 'Thai Heritage': 'hr', Artist: null };
const CATEGORY_OPTIONS = ['All', ...Object.keys(CATEGORY_SUFFIX)];
const PRICE_OPTIONS = ['All', '< ฿1,000', '฿1,000 - ฿3,000', '> ฿3,000'];
const SIZE_OPTIONS = ['All', 'S', 'M', 'L', 'XL'];
const STATUS_OPTIONS = ['All', 'In stock', 'Pre-order', 'Limited'];
const COLLECTION_OPTIONS = ['All', 'Concert', 'Album', 'Character', 'Handicraft'];

// ดึงรายชื่อแบรนด์ทั้งหมดจากรายการสินค้าโดยไม่ให้ซ้ำกัน
const BRANDS = [...new Set(products.map((product) => product.brand).filter(Boolean))];
const ARTIST_OPTIONS = ['All', ...BRANDS];
const NATIONAL_OPTIONS = ['All', 'Thailand', 'International'];
const STYLE_OPTIONS = ['All', 'Illustration', 'Photo', 'Typography'];
const MEDIUM_OPTIONS = ['All', 'T-Shirt', 'Vinyl', 'Accessories', 'Home & Living'];
const SORT_OPTIONS = ['Famous', 'Price: Low to High', 'Price: High to Low'];


/* Component ย่อย: Dropdown (ปุ่มเมนูเลือกตัวเลือก)
   - หน้าที่: รับตัวเลือก (options) และค่าปัจจุบัน (value) แล้วแสดงเมนูแบบยืดขยายได้
   - การเชื่อมโยง: เมื่อเลือกตัวเลือก จะส่งค่านั้นกลับไปที่ Component หลักผ่าน onChange()
*/
function Dropdown({ label, value, options, onChange }) {
  // สร้าง State ควบคุมการเปิด-ปิด ตัวเมนู
  const [open, setOpen] = useState(false);
  
  // สร้างการอ้างอิงตำแหน่งกล่อง Dropdown
  const ref = useRef(null);

  // useEffect สำหรับตรวจจับการคลิก "ข้างนอกกล่อง" หรือการกดปุ่ม ESC เพื่อปิดเมนูอัตโนมัติ
  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      // ถ้าจุดที่คลิกไม่ได้อยู่ในกล่อง Dropdown ให้สั่งปิด (setOpen(false))
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    
    // คืนค่าฟังก์ชันทำความสะอาด Event เพื่อไม่ให้เมมโมรี่รั่วไหล
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {/* ปุ่มกดเปิด/ปิด Dropdown */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="inline-flex h-[54px] items-center justify-between gap-[10px] rounded-[9px] border border-[#A5A5A5] bg-white px-[26px] py-[15px] text-sm text-ink transition hover:border-ink"
      >
        <span className="whitespace-nowrap">
          {label}: <span className="font-medium">{value}</span>
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted" aria-hidden="true" />
      </button>

      {/* เมนูตัวเลือก จะปรากฏขึ้นเมื่อ open === true เท่านั้น */}
      {open && (
        <div className="absolute left-0 top-14 z-50 w-48 rounded-[9px] border border-[#A5A5A5]/20 bg-white p-2 shadow-card">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onChange(option); // ส่งค่าที่เลือกกลับไปให้ State ของแม่
                setOpen(false);   // เลือกเสร็จแล้วปิดเมนู
              }}
              className={`block w-full rounded-btn px-3 py-2 text-left text-sm transition hover:bg-cream ${
                option === value ? 'font-semibold text-primary' : 'text-ink'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


/* Component หลัก: Products (หน้าแสดงสินค้าและระบบกรองทั้งหมด) */
export default function Products() {
  // ดึงฟังก์ชันเพิ่มสินค้าเข้าตะกร้าจาก Context กลาง
  const { addToCart } = useCart();

  // อ่าน Query Parameter จาก URL (เช่น ?cat=... หรือ ?q=...)
  const [searchParams, setSearchParams] = useSearchParams();
  const cat = searchParams.get('cat');
  const q = searchParams.get('q') ?? '';

  // แปลงค่า cat จาก URL มาเป็นชื่อหมวดหมู่ทันทีตั้งแต่ตอนเริ่มโหลดหน้าเว็บ
  const initialCategory = cat ? (categoryFilter[cat]?.label ?? 'All') : 'All';

  /* กลุ่ม State (กล่องเก็บข้อมูล): ทำหน้าที่เก็บสถานะปัจจุบันของการกรองทั้งหมด */
  const [query, setQuery] = useState(q);            // ข้อความค้นหา
  const [category, setCategory] = useState(initialCategory); // หมวดหมู่ (ตั้งค่าตาม URL ทันที)
  const [price, setPrice] = useState('All');        // ช่วงราคา
  const [size, setSize] = useState('All');          // ไซส์
  const [status, setStatus] = useState('All');      // สถานะสินค้า
  const [collection, setCollection] = useState('All');// คอลเลกชัน
  
  const [artist, setArtist] = useState('All');      // ศิลปิน
  const [national, setNational] = useState('All');  // สัญชาติ
  const [style, setStyle] = useState('All');        // สไตล์งาน
  const [medium, setMedium] = useState('All');      // ประเภทสื่อ
  const [thaiOnly, setThaiOnly] = useState(false);  // สวิตช์เฉพาะศิลปินไทย

  const [sort, setSort] = useState('Famous');       // การเรียงลำดับ (น้อย-มาก)
  const [page, setPage] = useState(1);              // หน้า Pagination ปัจจุบัน

  /* การซิงค์ข้อมูลเมื่อ URL เปลี่ยนแปลง (เช่น ผู้ใช้กดลิงก์มาจาก Navbar หรือหมวดหมู่อื่น) */
  useEffect(() => {
    const newCategory = cat ? (categoryFilter[cat]?.label ?? 'All') : 'All';
    setCategory(newCategory);
    setPage(1);
  }, [cat]);

  useEffect(() => {
    setQuery(q);
    setPage(1);
  }, [q]);

  /* หัวใจหลักของการกรองสินค้า (Filtering Engine):
     - useMemo จะทำงานคำนวณใหม่เฉพาะเมื่อ State ตัวกรองตัวใดตัวหนึ่งเปลี่ยน */
  const filtered = useMemo(() => {
    const suffix = category !== 'All' ? CATEGORY_SUFFIX[category] : null;

    // นำ Array สินค้าทั้งหมดมาผ่านฟังก์ชัน .filter() ตามเงื่อนไขทุกข้อ
    let result = products.filter((product) => {
      if (suffix && !product.id.endsWith(suffix)) return false;
      if (thaiOnly && !product.id.endsWith('th')) return false;
      if (artist !== 'All' && product.brand !== artist) return false;
      if (price === '< ฿1,000' && product.price >= 1000) return false;
      if (price === '฿1,000 - ฿3,000' && (product.price < 1000 || product.price > 3000)) return false;
      if (price === '> ฿3,000' && product.price <= 3000) return false;
      
      // กรองตามไซส์
      if (size !== 'All' && Array.isArray(product.sizes) && !product.sizes.includes(size)) return false;

      // ค้นหาคำจาก ชื่อ, แบรนด์, คำอธิบาย
      const text = `${product.name} ${product.brand} ${product.description}`.toLowerCase();
      if (query && !text.includes(query.toLowerCase())) return false;
      
      return true; // ถ้าผ่านทุกเงื่อนไข จะเก็บสินค้านี้ไว้
    });

    // เรียงลำดับราคาตามตัวเลือก sort
    if (sort === 'Price: Low to High') result = [...result].sort((a, b) => a.price - b.price);
    if (sort === 'Price: High to Low') result = [...result].sort((a, b) => b.price - a.price);
    
    return result;
  }, [category, thaiOnly, artist, price, size, query, sort]);

  /* คำนวณการแบ่งหน้า (Pagination) */
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  // ดึงเฉพาะสินค้าของ "หน้าที่กำลังดูอยู่" ออกมาแสดง
  const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  /* ระบบ Filter Chips (ป้ายแท็กสีดำเตือนความจำว่าเลือกอะไรไปบ้าง) */
  const chips = [];
  if (category !== 'All') {
    chips.push({
      label: category,
      clear: () => {
        setCategory('All');
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.delete('cat');
          return next;
        });
      },
    });
  }
  if (price !== 'All') chips.push({ label: price, clear: () => setPrice('All') });
  if (size !== 'All') chips.push({ label: `Size: ${size}`, clear: () => setSize('All') });
  if (status !== 'All') chips.push({ label: status, clear: () => setStatus('All') });
  if (collection !== 'All') chips.push({ label: collection, clear: () => setCollection('All') });
  if (artist !== 'All') chips.push({ label: artist, clear: () => setArtist('All') });
  if (national !== 'All') chips.push({ label: national, clear: () => setNational('All') });
  if (style !== 'All') chips.push({ label: style, clear: () => setStyle('All') });
  if (medium !== 'All') chips.push({ label: medium, clear: () => setMedium('All') });
  if (thaiOnly) chips.push({ label: 'Thai artist', clear: () => setThaiOnly(false) });

  // ฟังก์ชันล้างค่าตัวกรองทั้งหมดเป็นค่าเริ่มต้น
  const clearAll = () => {
    setCategory('All');
    setPrice('All');
    setSize('All');
    setStatus('All');
    setCollection('All');
    setArtist('All');
    setNational('All');
    setStyle('All');
    setMedium('All');
    setThaiOnly(false);
    setQuery('');
    setSort('Famous');
    setPage(1);
    setSearchParams({});
  };

  const filterLabel = cat ? (categoryFilter[cat]?.label ?? 'Search') : 'Search';
  const searchRef = useRef(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  /* คำนวณคำแนะนำการค้นหาอัตโนมัติ (Search Auto-suggestions) */
  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const seen = new Set();
    const results = [];
    for (const p of products) {
      const text = `${p.name} ${p.brand} ${p.description}`.toLowerCase();
      if (text.includes(q)) {
        const key = p.name;
        if (!seen.has(key)) {
          seen.add(key);
          results.push({ name: p.name, brand: p.brand });
        }
      }
      if (results.length >= 6) break; // เอาสูงสุดแค่ 6 รายการ
    }
    return results;
  }, [query]);

  // ปิดช่อง Suggestion เมื่อคลิกที่อื่นบนหน้าจอ
  useEffect(() => {
    if (!showSuggestions) return;
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSuggestions(false);
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [showSuggestions]);

  /* ส่วนการแสดงผล */
  return (
    <Container className="py-8">
      {/* แถบนิวอิเกตบอกตำแหน่งหน้าปัจจุบัน */}
      <Breadcrumb
        items={[{ label: 'Home', to: '/' }, { label: 'Shop', to: '/products' }, { label: filterLabel }]}
      />

      {/* 1. ช่องค้นหา (Search Bar) สูง 64px ทรง แคปซูล */}
      <div ref={searchRef} className="relative mt-6">
        <form
          role="search"
          className="flex h-[64px] w-full items-center gap-3 rounded-full border border-[#A5A5A5] bg-white px-6 shadow-sm"
          onSubmit={(e) => {
            e.preventDefault();
            setShowSuggestions(false);
          }}
        >
          <Search className="size-5 shrink-0 text-muted" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);     // อัปเดตข้อความค้นหา
              setPage(1);                   // เด้งกลับไปหน้า 1
              setShowSuggestions(true);     // เปิดกล่องคำแนะนำ
            }}
            onFocus={() => { if (query.trim()) setShowSuggestions(true); }}
            placeholder="Search for products..."
            aria-label="ค้นหาสินค้า"
            aria-autocomplete="list"
            aria-expanded={showSuggestions && suggestions.length > 0}
            className="w-full bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
          />
        </form>

        {/* เมนูแสดงคำแนะนำการค้นหาแบบ Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute left-0 top-full z-50 mt-2 w-full rounded-[18px] border border-[#A5A5A5]/20 bg-white p-2 shadow-card" role="listbox">
            {suggestions.map((s) => (
              <li key={s.name}>
                <button
                  type="button"
                  role="option"
                  onClick={() => {
                    setQuery(s.name);
                    setPage(1);
                    setShowSuggestions(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-btn px-3 py-2 text-left text-sm transition hover:bg-cream"
                >
                  <Search className="size-4 shrink-0 text-muted" aria-hidden="true" />
                  <span className="truncate font-medium text-ink">{s.name}</span>
                  <span className="ml-auto shrink-0 text-xs text-muted">{s.brand}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* หัวข้อหน้าแสดงสินค้า */}
      <div className="mt-8 border-b border-[#A5A5A5]/30 pb-2">
        <div className="flex w-[80px] flex-col items-center gap-1.5">
          <span className="text-base font-semibold text-violet">Product</span>
          <span className="h-1 w-full rounded-full bg-violet" />
        </div>
      </div>

      {/* 2. กล่องควบคุม Filter Panel */}
      <div className="relative mt-6 rounded-[18px] border border-[#A5A5A5] bg-white px-[80px] py-[40px] shadow-none">
        {/* แถวที่ 1: หมวดสินค้าทั่วไป */}
        <div className="relative z-20">
          <p className="text-xs font-normal text-muted">Sort by Product</p>
          <div className="mt-3 flex flex-wrap gap-[10px]">
            <Dropdown
              label="Category"
              value={category}
              options={CATEGORY_OPTIONS}
              onChange={(v) => {
                setCategory(v);
                setPage(1);
                setSearchParams((prev) => {
                  const next = new URLSearchParams(prev);
                  if (v === 'All') {
                    next.delete('cat');
                  } else {
                    const foundKey = Object.keys(categoryFilter).find(
                      (key) => categoryFilter[key].label === v
                    );
                    if (foundKey) next.set('cat', foundKey);
                    else next.delete('cat');
                  }
                  return next;
                });
              }}
            />
            <Dropdown label="Price" value={price} options={PRICE_OPTIONS} onChange={(v) => { setPrice(v); setPage(1); }} />
            <Dropdown label="Size" value={size} options={SIZE_OPTIONS} onChange={(v) => { setSize(v); setPage(1); }} />
            <Dropdown label="Status" value={status} options={STATUS_OPTIONS} onChange={(v) => { setStatus(v); setPage(1); }} />
            <Dropdown label="Collection" value={collection} options={COLLECTION_OPTIONS} onChange={(v) => { setCollection(v); setPage(1); }} />
          </div>
        </div>

        {/* แถวที่ 2: หมวดศิลปินและวัฒนธรรม */}
        <div className="relative z-10 mt-[25px]">
          <p className="text-xs font-normal text-muted">Sort By Artist and Culture</p>
          <div className="mt-3 flex flex-wrap items-center gap-[10px]">
            <Dropdown label="Artist/Company" value={artist} options={ARTIST_OPTIONS} onChange={(v) => { setArtist(v); setPage(1); }} />
            <Dropdown label="National" value={national} options={NATIONAL_OPTIONS} onChange={(v) => { setNational(v); setPage(1); }} />
            <Dropdown label="Style" value={style} options={STYLE_OPTIONS} onChange={(v) => { setStyle(v); setPage(1); }} />
            <Dropdown label="Medium" value={medium} options={MEDIUM_OPTIONS} onChange={(v) => { setMedium(v); setPage(1); }} />

            {/* ปุ่มสวิตช์เลือกเฉพาะศิลปินไทย */}
            <button
              type="button"
              onClick={() => {
                setThaiOnly(!thaiOnly);
                setPage(1);
              }}
              aria-pressed={thaiOnly}
              className={`inline-flex h-[54px] items-center gap-2 rounded-[9px] border px-[26px] py-[15px] text-sm font-medium transition ${
                thaiOnly
                  ? 'border-[#FF5533] bg-[#FF5533] text-white'
                  : 'border-[#FF5533] bg-white text-[#FF5533] hover:bg-[#FF5533]/5'
              }`}
            >
              <Flag className="size-4 shrink-0" aria-hidden="true" />
              <span className="whitespace-nowrap">Thai Artist Only</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. แถบแสดง Active Filter Chips + ปุ่ม Clear All และ Sort By ด้านขวา */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        {/* แสดงป้ายแท็ก (Chips) ของฟิลเตอร์ที่กำลังใช้งาน */}
        <div className="flex flex-wrap items-center gap-3">
          {chips.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={chip.clear}
              aria-label={`ลบ filter ${chip.label}`}
              className="inline-flex h-[42px] items-center gap-2 rounded-full bg-black px-5 text-sm font-medium text-white transition hover:bg-black/80"
            >
              {chip.label}
              <X className="size-4" aria-hidden="true" />
            </button>
          ))}
        </div>

        {/* ส่วนขวา: ปุ่ม Clear All และ Dropdown เรียงลำดับ */}
        <div className="ml-auto flex items-center gap-6">
          {chips.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="text-sm font-normal text-[#A5A5A5] underline underline-offset-4 transition hover:text-ink"
            >
              Clear All
            </button>
          )}

          <Dropdown label="Sort By" value={sort} options={SORT_OPTIONS} onChange={setSort} />
        </div>
      </div>

      {/* 4. ตารางแสดงรายการสินค้า (Grid 4 คอลัมน์) */}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {/* วนลูปนำรายการสินค้าจาก pageItems มาแสดงผลทีละชิ้นผ่าน ProductCard */}
        {pageItems.map((product) => (
          <ProductCard key={product.id} product={product} onAddToCart={addToCart} fluid />
        ))}
        
        {/* กรณีค้นหาแล้วไม่พบสินค้าเลย */}
        {pageItems.length === 0 && (
          <p className="col-span-full py-16 text-center text-muted">
            ไม่พบสินค้าที่ตรงกับ filter — ลองดึงตัวเลือกออกดูนะ
          </p>
        )}
      </div>

      {/* 5. ปุ่มเปลี่ยนหน้า (Pagination Controls) */}
      {totalPages > 1 && (
        <nav className="mt-10 flex items-center justify-center gap-2" aria-label="แบ่งหน้าสินค้า">
          {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => setPage(num)}
              aria-current={page === num ? 'page' : undefined}
              className={`grid size-8 place-items-center rounded-pill text-sm transition ${
                page === num ? 'bg-violet font-semibold text-white' : 'text-ink hover:bg-cream'
              }`}
            >
              {num}
            </button>
          ))}
        </nav>
      )}
    </Container>
  );
}