import { useEffect, useMemo, useState } from 'react';
import { Archive, Clipboard, Copy, Plus, Search, Sparkles, Tag, Trash2 } from 'lucide-react';

const STORAGE_KEY = 'prompt-cabinet-items-v1';
const categories = ['画像生成', '文章', 'SNS', 'アプリUI', '商品ページ', 'その他'];

const samplePrompts = [
  {
    id: 'sample-style-1',
    title: '① 繊細・半写実・耽美系',
    category: '画像生成',
    tags: ['半写実', '耽美', '低コントラスト', '透明感'],
    prompt: '[subject], delicate semi-realistic anime, porcelain skin, translucent eyes, soft gradients, low contrast, subtle bloom, quiet sky atmosphere',
    memo: '画風の芯：陶器肌／低コントラスト／宝石の瞳／淡い赤み／静かな空気感。避ける語：dramatic, thick outlines, saturated colors。顔の美しさを優先したい時に。',
    createdAt: new Date().toISOString(),
    favorite: true,
  },
  {
    id: 'sample-style-2',
    title: '② 艶・光・感情強め',
    category: '画像生成',
    tags: ['乙女ゲーム', 'KV', '艶髪', '逆光'],
    prompt: '[subject], otome game key visual, cinematic backlight, glossy hair, defined shading, romantic tension, red eyes, emotional distance',
    memo: '画風の芯：艶髪／逆光／木漏れ日／赤い目元／距離感と恋愛圧。避ける語：minimal shading, airy negative space。乙女ゲーム風キービジュアル向き。',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    favorite: false,
  },
  {
    id: 'sample-style-3',
    title: '③ 透明水彩・日常挿絵',
    category: '画像生成',
    tags: ['透明水彩', '日常', '紙質感', 'やさしい'],
    prompt: '[subject], transparent watercolor, soft ink lineart, visible paper texture, muted pastel, minimal shading, airy negative space, gentle indoor light',
    memo: '画風の芯：紙の質感／淡彩／にじみ／余白／自然光／やさしい室内。避ける語：glossy, cinematic, polished game art。紙の白と余白で息をする絵に。',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    favorite: false,
  },
  {
    id: 'sample-style-4',
    title: '④ 透明水彩・絵本幻想',
    category: '画像生成',
    tags: ['水彩絵本', '幻想', '装飾建築', '発光感'],
    prompt: '[scene], watercolor storybook fantasy, ornamental architecture, pastel aqua, pearl palette, luminous atmosphere, delicate linework, dreamlike sea-palace mood',
    memo: '画風の芯：装飾建築／アクア色／真珠感／珊瑚色／童話の発光感。避ける語：photorealist, 3D render, game background art。世界観・建築・幻想を優先したい時に。',
    createdAt: new Date(Date.now() - 259200000).toISOString(),
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
