import React, { useState } from 'react'
import TinderCard from 'react-tinder-card'

const ZENN_DEV = `https://zenn.dev`;

/*
const db = [
  {
    name: 'Richard Hendricks',
    url: './img/richard.jpg'
  },
  {
    name: 'Erlich Bachman',
    url: './img/erlich.jpg'
  },
  {
    name: 'Monica Hall',
    url: './img/monica.jpg'
  },
  {
    name: 'Jared Dunn',
    url: './img/jared.jpg'
  },
  {
    name: 'Dinesh Chugtai',
    url: './img/dinesh.jpg'
  }
]
*/

function Simple () {
  const url = "https://zenn-api.vercel.app/api/trendTech";
  const [error, setError] = useState(null);
  const [articles, setArticles] = useState([]);
  const [lastDirection, setLastDirection] = useState();

  // APIからデータを取得する関数
  const fetchArticles = async () => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`APIエラー: ${response.status}`);
      }
      const json = await response.json();
      const formattedArticles = json.map((article) => ({
        title: article["title"],
        emoji: article["emoji"],
        url: ZENN_DEV + article["path"]
      }));
      setArticles(formattedArticles);
      setError(null);
    } catch (error) {
      console.error('データ取得エラー:', error.message);
      setError(error.message);
      setArticles([]);
    }
  };

  // コンポーネントマウント時にデータを取得
  React.useEffect(() => {
    fetchArticles();
  }, []);

  const swiped = (direction, nameToDelete) => {
    console.log('removing: ' + nameToDelete);
    setLastDirection(direction);
  };

  const outOfFrame = (name) => {
    console.log(name + ' left the screen!');
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
      <h1>React Tinder Card</h1>
      <div className='cardContainer'>
        {articles.map((article) =>
          <TinderCard className='swipe' key={article.url} onSwipe={(dir) => swiped(dir, article.title)} onCardLeftScreen={() => outOfFrame(article.title)}>
            <div style={{}} className='card'>
              <div className='cardEmoji'>{article.emoji}</div>
              <h3>{article.title}</h3>
            </div>
          </TinderCard>
        )}
      </div>
      {lastDirection ? <h2 className='infoText'>You swiped {lastDirection}</h2> : <h2 className='infoText' />}
    </div>
  );
}

export default Simple;
