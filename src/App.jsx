import { useEffect, useMemo, useState } from 'react';
import { Archive, Clipboard, Copy, Plus, Search, Sparkles, Tag, Trash2 } from 'lucide-react';

const STORAGE_KEY = 'prompt-cabinet-items-v1';
const categories = ['画像生成', '文章', 'SNS', 'アプリUI', '商品ページ', 'その他'];

const samplePrompts = [
  {
    id: 'sample-1',
    title: '余白のある見出し画像',
    category: '画像生成',
    tags: ['水彩', '余白', '見出し'],
    prompt: 'Create a poetic everyday header image with soft watercolor texture, calm negative space for title overlay, no text, no logo, gentle paper collage mood.',
    memo: 'Substack / noteの表紙用。文字なし指定を忘れない。',
    createdAt: new Date().toISOString(),
    favorite: true,
  },
  {
    id: 'sample-2',
    title: 'アプリの説明文',
    category: '文章',
    tags: ['説明文', '道具屋', '短文'],
    prompt: 'このアプリで誰が、いつ、何に困っていて、使うと今日どう楽になるかを、やさしく短く説明してください。',
    memo: '公開前の紹介文づくり用。',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    favorite: false,
  },
];

const blankForm = { title: '', category: '画像生成', tags: '', prompt: '', memo: '' };

function loadItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : samplePrompts;
  } catch {
    return samplePrompts;
  }
}

function normalizeTags(value) {
  return value.split(/[、,\s]+/).map((tag) => tag.trim()).filter(Boolean);
}

function formatDate(value) {
  try {
    return new Intl.DateTimeFormat('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric' }).format(new Date(value));
  } catch {
    return '';
  }
}

export default function App() {
  const [items, setItems] = useState(loadItems);
  const [form, setForm] = useState(blankForm);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('すべて');
  const [showForm, setShowForm] = useState(false);
  const [copiedId, setCopiedId] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const allTags = useMemo(() => Array.from(new Set(items.flatMap((item) => item.tags || []))).sort(), [items]);

  const filteredItems = useMemo(() => {
    const lower = query.trim().toLowerCase();
    return items
      .filter((item) => filter === 'すべて' || item.category === filter || (item.tags || []).includes(filter))
      .filter((item) => {
        if (!lower) return true;
        return [item.title, item.category, item.prompt, item.memo, ...(item.tags || [])].join(' ').toLowerCase().includes(lower);
      })
      .sort((a, b) => Number(Boolean(b.favorite)) - Number(Boolean(a.favorite)) || new Date(b.createdAt) - new Date(a.createdAt));
  }, [items, query, filter]);

  function savePrompt(event) {
    event.preventDefault();
    if (!form.prompt.trim()) return;
    const next = {
      id: crypto.randomUUID(),
      title: form.title.trim() || '無題のプロンプト',
      category: form.category,
      tags: normalizeTags(form.tags),
      prompt: form.prompt.trim(),
      memo: form.memo.trim(),
      createdAt: new Date().toISOString(),
      favorite: false,
    };
    setItems((current) => [next, ...current]);
    setForm(blankForm);
    setShowForm(false);
  }

  async function copyPrompt(item) {
    await navigator.clipboard.writeText(item.prompt);
    setCopiedId(item.id);
    window.setTimeout(() => setCopiedId(''), 1400);
  }

  function toggleFavorite(id) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, favorite: !item.favorite } : item)));
  }

  function deletePrompt(id) {
    const ok = window.confirm('このプロンプトを削除しますか？');
    if (ok) setItems((current) => current.filter((item) => item.id !== id));
  }

  return (
    <main className="app-shell">
      <section className="hero-card">
        <div className="hero-badge"><Archive size={16} /> Prompt Cabinet</div>
        <h1>使った呪文を、引き出しへ。</h1>
        <p>画像生成はしません。うまくいったプロンプトを保存して、探して、もう一度コピーして使うための小さなキャビネットです。</p>
        <div className="hero-actions">
          <button className="primary-button" onClick={() => setShowForm((value) => !value)}><Plus size={18} /> {showForm ? '入力を閉じる' : 'プロンプトをしまう'}</button>
        </div>
      </section>

      {showForm && (
        <form className="prompt-form" onSubmit={savePrompt}>
          <label>タイトル<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="例：水彩風の表紙画像" /></label>
          <label>用途<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
          <label>タグ<input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="水彩, 余白, note" /></label>
          <label className="wide">プロンプト本文<textarea required value={form.prompt} onChange={(e) => setForm({ ...form, prompt: e.target.value })} placeholder="ここに使ったプロンプトを貼る" /></label>
          <label className="wide">メモ<textarea className="memo" value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} placeholder="どこで使ったか、何が良かったか" /></label>
          <button className="save-button wide" type="submit"><Clipboard size={18} /> 保存する</button>
        </form>
      )}

      <section className="toolbar">
        <div className="search-box"><Search size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="タイトル・タグ・本文を検索" /></div>
        <div className="chip-row">{['すべて', ...categories, ...allTags.slice(0, 12)].map((chip) => <button key={chip} className={filter === chip ? 'chip active' : 'chip'} onClick={() => setFilter(chip)}>{chip}</button>)}</div>
      </section>

      <section className="list-header"><span>{filteredItems.length} 件</span><span>この端末内に保存中</span></section>

      <section className="prompt-list">
        {filteredItems.map((item) => (
          <article className="prompt-card" key={item.id}>
            <div className="card-top">
              <button className={item.favorite ? 'star active' : 'star'} onClick={() => toggleFavorite(item.id)} aria-label="お気に入り"><Sparkles size={18} /></button>
              <div><h2>{item.title}</h2><p className="date">{item.category} ・ {formatDate(item.createdAt)}</p></div>
            </div>
            <p className="prompt-text">{item.prompt}</p>
            {item.memo && <p className="memo-text">{item.memo}</p>}
            <div className="tag-row">{(item.tags || []).map((tag) => <span key={tag}><Tag size={12} />{tag}</span>)}</div>
            <div className="card-actions">
              <button onClick={() => copyPrompt(item)}><Copy size={16} /> {copiedId === item.id ? 'コピー済み' : 'コピー'}</button>
              <button className="danger" onClick={() => deletePrompt(item.id)}><Trash2 size={16} /> 削除</button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
