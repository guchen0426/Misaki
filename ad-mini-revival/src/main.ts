import './style.css';

import { ArcadeRuntime } from './game/arcadeRuntime';
import { gameCatalog, gameMetaById, researchTopics } from './game/catalog';
import type { GameId, HudState } from './game/types';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('Missing #app mount node.');
}

const defaultGameId: GameId = 'pin-rescue';

app.innerHTML = `
  <div class="shell">
    <aside class="sidebar">
      <section class="panel hero-panel">
        <p class="eyebrow">Game Studio / Browser Prototype</p>
        <h1>广告小游戏还原站</h1>
        <p class="lead">
          先把最有传播力、最容易让人“我上我也行”的广告玩法做成浏览器原型，再根据试玩反馈扩到微信小程序。
        </p>
        <div class="chip-row">
          <span class="chip">Phaser 3</span>
          <span class="chip">TypeScript</span>
          <span class="chip">无广告试玩</span>
        </div>
      </section>

      <section class="panel">
        <div class="section-head">
          <h2>玩法调研</h2>
          <span>广告常见套路</span>
        </div>
        <div class="research-list">
          ${researchTopics
            .map(
              (topic) => `
                <article class="research-card">
                  <h3>${topic.title}</h3>
                  <p>${topic.summary}</p>
                  <p><strong>${topic.signal}</strong> · ${topic.reason}</p>
                </article>
              `,
            )
            .join('')}
        </div>
      </section>
    </aside>

    <main class="main-column">
      <section class="panel top-panel">
        <div class="section-head">
          <h2>首发原型</h2>
          <span>先做 3 款可试玩版本</span>
        </div>
        <div class="game-switcher">
          ${gameCatalog
            .map(
              (game) => `
                <button class="game-tab${game.id === defaultGameId ? ' active' : ''}" data-game-id="${game.id}" type="button">
                  <span>${game.title}</span>
                  <small>${game.genre}</small>
                </button>
              `,
            )
            .join('')}
        </div>
      </section>

      <section class="panel stage-panel">
        <div class="hud-grid">
          <div class="hud-primary">
            <span id="hud-banner" class="hud-banner">广告原型 01</span>
            <h2 id="hud-objective">点击插销，按正确顺序救出角色。</h2>
            <p id="hud-status">先观察场景，再决定拉哪根。</p>
          </div>
          <div class="hud-secondary">
            <div>
              <span class="hud-label">进度</span>
              <strong id="hud-moves">已拉 0 / 3</strong>
            </div>
            <div>
              <span class="hud-label">提示</span>
              <strong id="hud-hint">正确思路通常是“先处理危险，再释放奖励”。</strong>
            </div>
          </div>
        </div>
        <div id="game-root" class="game-root"></div>
      </section>

      <section class="details-grid">
        <article class="panel">
          <div class="section-head">
            <h2>当前玩法</h2>
            <span>可调优方向</span>
          </div>
          <div id="game-detail" class="detail-card"></div>
          <button id="restart-game" class="restart-button" type="button">重开当前玩法</button>
        </article>

        <article class="panel">
          <div class="section-head">
            <h2>产品大纲</h2>
            <span>浏览器到小程序</span>
          </div>
          <div class="outline-list">
            <div class="outline-item">
              <strong>阶段 1</strong>
              <p>验证 3 个广告代表玩法：拉针、堵车、画线，先把“点开广告后真能玩”做扎实。</p>
            </div>
            <div class="outline-item">
              <strong>阶段 2</strong>
              <p>加入关卡包、失败动效、排行榜和每日挑战，形成网页合集站。</p>
            </div>
            <div class="outline-item">
              <strong>阶段 3</strong>
              <p>迁移到微信小程序壳层，补分享、轻量存档、广告位和活动页。</p>
            </div>
            <div class="outline-item">
              <strong>边界</strong>
              <p>只提炼共通玩法，不直接复刻他人品牌角色、美术与剧情包装。</p>
            </div>
          </div>
        </article>
      </section>
    </main>
  </div>
`;

const hudBanner = document.querySelector<HTMLSpanElement>('#hud-banner');
const hudObjective = document.querySelector<HTMLHeadingElement>('#hud-objective');
const hudStatus = document.querySelector<HTMLParagraphElement>('#hud-status');
const hudMoves = document.querySelector<HTMLElement>('#hud-moves');
const hudHint = document.querySelector<HTMLElement>('#hud-hint');
const detailCard = document.querySelector<HTMLDivElement>('#game-detail');
const restartButton = document.querySelector<HTMLButtonElement>('#restart-game');
const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('.game-tab'));

const runtime = new ArcadeRuntime('game-root', updateHud);

function updateHud(state: HudState) {
  if (!hudBanner || !hudObjective || !hudStatus || !hudMoves || !hudHint) {
    return;
  }

  hudBanner.textContent = state.banner;
  hudBanner.style.background = `${state.accent}22`;
  hudBanner.style.color = state.accent;
  hudObjective.textContent = state.objective;
  hudStatus.textContent = state.status;
  hudMoves.textContent = state.moves;
  hudHint.textContent = state.hint;
}

function renderDetail(gameId: GameId) {
  if (!detailCard) {
    return;
  }

  const game = gameMetaById.get(gameId);
  if (!game) {
    return;
  }

  detailCard.innerHTML = `
    <h3>${game.title}</h3>
    <p>${game.hook}</p>
    <div class="detail-meta">
      <span><strong>验证目标</strong>${game.focus}</span>
      <span><strong>操作</strong>${game.controls}</span>
      <span><strong>难度</strong>${game.difficulty}</span>
    </div>
  `;
}

function selectGame(gameId: GameId) {
  tabs.forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.gameId === gameId);
  });
  renderDetail(gameId);
  runtime.selectGame(gameId);
}

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    selectGame(tab.dataset.gameId as GameId);
  });
});

restartButton?.addEventListener('click', () => {
  runtime.restart();
});

renderDetail(defaultGameId);
selectGame(defaultGameId);

window.addEventListener('beforeunload', () => {
  runtime.destroy();
});
