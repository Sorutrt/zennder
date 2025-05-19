import React, { useState, useEffect } from 'react'
import TinderCard from 'react-tinder-card'
import { GEMINI_API_KEY } from '../secret';
import { GoogleGenAI } from '@google/genai';
import { oklch } from 'culori';

const ZENN_DEV = `https://zenn.dev`;
const AI = new GoogleGenAI({apiKey: GEMINI_API_KEY});

// カラーコードのバリデーション関数
const isValidColor = (color) => {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
};

function Simple () {
  // エラー情報
  const [error, setError] = useState(null);
  // 記事データ
  const [articles, setArticles] = useState([]);
  // カードデータ（印象色付き）
  const [cardDatas, setCardDatas] = useState([]);
  // 最後にスワイプした方向
  const [lastDirection, setLastDirection] = useState();

  // 記事データをAPIから取得
  const fetchArticles = async () => {
    try {
      const response = await fetch('https://zenn-api.vercel.app/api/trendTech');
      if (!response.ok) {
        throw new Error(`APIエラー: ${response.status}`);
      }
      const json = await response.json();
      // 先頭20件のみ整形
      const formattedArticles = json.slice(0, 20).map((article) => ({
        title: article["title"],
        emoji: article["emoji"],
        url: ZENN_DEV + article["path"]
      }));
      setArticles(formattedArticles);
      setError(null);
      return formattedArticles;
    } catch (err) {
      setError(err.message);
      setArticles([]);
      console.error(err.message);
      return [];
    }
  };

  // AIにカラーコードを問い合わせるプロンプト
  const buildColorPrompt = (urls) => {
    return `I will send you article URLs, separated by newlines. Please read each article and respond with the impression you get from it, expressed as a color in RGB. Return only the 6-digit hexadecimal color code as plain text (e.g., #FF5733). When deciding on the color, consider the emotional tone or atmosphere of the article. Here are some guidelines for interpreting the tone into color:Articles that feel passionate, urgent, or give a sense of warning → more red elements. Articles focused on cutting-edge technology or data-driven analysis → more blue elements. Articles that feel cheerful, energetic, or written for beginners → more yellow elements. Articles with a calm, relaxing, or thoughtful tone → more green elements. Try to reflect the overall vibe of the article in the balance of RGB colors you choose.`
  };

  // AIからカラーコードを取得（最大3回リトライ）
  const fetchColorsWithRetry = async (urls, maxRetries = 3) => {
    const prompt = buildColorPrompt(urls);
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await AI.models.generateContent({
          model: "gemini-2.0-flash",
          contents: urls.join("\n"),
          config: {
            systemInstruction: prompt
          }
        });
        // 返却値のtextプロパティにカラーコードが改行区切りで入っている想定
        const text = response.text || '';
        const colors = text.split(/\r?\n/).map(c => c.trim()).filter(Boolean);
        return colors;
      } catch (err) {
        if (attempt === maxRetries) {
          console.error(err.message);
          return null;
        }
        // リトライ（待機時間なし）
      }
    }
    return null;
  };

  // 記事データとカラーコードを組み合わせてカードデータを作成
  const buildCardDatas = (articles, colors) => {
    const cardDatas = [];
    for (let i = 0; i < 20; i++) {
      const article = articles[i];
      let color = (colors && colors[i]) ? colors[i] : '#FFFFFF';
      if (!isValidColor(color)) color = '#FFFFFF';
      cardDatas.push({
        title: article ? article.title : '',
        emoji: article ? article.emoji : '',
        url: article ? article.url : '',
        color
      });
    }
    return cardDatas;
  };

  // カードタイトルの文字色を決定（oklch明度で判定）
  const getTitleColor = (bgColor) => {
    try {
      const oklchColor = oklch(bgColor);
      if (oklchColor && typeof oklchColor.l === 'number') {
        return oklchColor.l >= 0.75 ? '#101010' : '#F0F0F0';
      }
    } catch (e) {
      // 変換失敗時は黒
      return '#101010';
    }
    return '#101010';
  };

  // 初回マウント時にデータ取得
  useEffect(() => {
    const fetchAll = async () => {
      // 記事データ取得
      const articles = await fetchArticles();
      if (articles.length === 0) return;
      // AIでカラーコード取得
      const urls = articles.map(a => a.url);
      const colors = await fetchColorsWithRetry(urls);
      // カードデータ作成
      setCardDatas(buildCardDatas(articles, colors));
    };
    fetchAll();
  }, []);

  // スワイプ時の処理
  const swiped = (direction, nameToDelete) => {
    setLastDirection(direction);
  };

  // カードが画面外に出た時の処理
  const outOfFrame = (name) => {
    // 何もしない
  };

  // エラーが発生した場合はエラーメッセージを表示
  if (error) {
    return (
      <div className="error-container">
        <h2>エラーが発生しました</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <link href='https://fonts.googleapis.com/css?family=Damion&display=swap' rel='stylesheet' />
      <link href='https://fonts.googleapis.com/css?family=Alatsi&display=swap' rel='stylesheet' />
      <h1>Zennder</h1>
      <div className='cardContainer'>
        {cardDatas.map((cardData, idx) =>
          <TinderCard className='swipe' key={cardData.url || idx} onSwipe={(dir) => swiped(dir, cardData.title)} onCardLeftScreen={() => outOfFrame(cardData.title)}>
            <div style={{ background: cardData.color }} className='card' onDoubleClick={() => window.open(cardDatas[idx].url, '_blank')}>
              <div className='cardEmoji'>{cardData.emoji}</div>
              <h3 style={{ color: getTitleColor(cardData.color) }}>{cardData.title}</h3>
            </div>
          </TinderCard>
        )}
      </div>
    </div>
  );
}

export default Simple;
