(() => {
  "use strict";

  // ── 画像の設定：ここだけ変更すれば画像を差し替えられます ──
  // CodePenではGitHub Pagesの画像フォルダーURLを指定してください。
  // 例: https://YOUR-NAME.github.io/YOUR-REPOSITORY/
  // 空欄ならローカルプレビューでは同じフォルダーの画像を使用します。
  const IMAGE_BASE_URL = "https://yongmars.github.io/halloween-memory-game/image/";
  const BACK_IMAGE = "back_hw.png";
  const CARD_IMAGES = [
    { id: "noct", name: "ノクト", emoji: "🐈‍⬛", image: "noct_hw.png" },
    { id: "lux", name: "ルクス", emoji: "🐱", image: "lux_hw.png" },
    { id: "saku", name: "朔人型", emoji: "🧙", image: "sakuhuman_hw.png" },
    { id: "noct-human", name: "ノクト人型", emoji: "🧛", image: "nocthuman_hw.png" },
    { id: "yumars", name: "ゆうまるす", emoji: "🎃", image: "yongmars_hw.png" },
    { id: "lux-human", name: "ルクス人型", emoji: "🍬", image: "luxhuman_hw.png" },
    { id: "saku-beast", name: "朔獣人型", emoji: "👻", image: "sakubeast_hw.png" },
    { id: "saku-cat", name: "朔猫", emoji: "🦇", image: "sakucat_hw.png" }
  ];
  // ── 画像の設定ここまで ──

  const root = document.querySelector(".halloween-game");
  if (!root) return;
  const board = root.querySelector("#card-board");
  const count = root.querySelector("#pair-count");
  const status = root.querySelector("#game-status");
  const celebration = root.querySelector("#celebration");
  const confetti = root.querySelector("#confetti");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let first = null;
  let locked = false;
  let pairs = 0;
  let turnTimer;
  let confettiTimer;

  function imageUrl(path) {
    if (!path) return "";
    if (/^https:\/\//i.test(path)) return path;
    const pageImageBase = document.documentElement.dataset.imageBase;
    if (pageImageBase) {
      return new URL(path, new URL(pageImageBase, document.baseURI)).href;
    }
    if (document.documentElement.dataset.localPreview === "true") {
      return new URL(path, document.baseURI).href;
    }
    const base = IMAGE_BASE_URL.trim();
    if (base) return new URL(path, base.endsWith("/") ? base : base + "/").href;
    // index.htmlがローカル用の印を付けます。CodePenでは未設定の通信を避けます。
    return "";
  }

  function makeFace(side, path, emoji, name) {
    const face = document.createElement("span");
    face.className = "card-face card-" + side;
    face.setAttribute("aria-hidden", "true");
    const fallback = document.createElement("span");
    fallback.className = "card-fallback";
    const icon = document.createElement("span");
    icon.className = "fallback-icon";
    icon.textContent = emoji;
    const label = document.createElement("span");
    label.className = "fallback-name";
    label.textContent = name;
    fallback.append(icon, label);
    face.append(fallback);
    const src = imageUrl(path);
    if (src) {
      const img = new Image();
      img.alt = "";
      img.draggable = false;
      img.hidden = true;
      img.addEventListener("load", () => { img.hidden = false; });
      img.addEventListener("error", () => { img.remove(); });
      img.src = src;
      face.append(img);
    }
    return face;
  }

  function setCardLabel(card, revealed) {
    card.setAttribute("aria-label", `${Number(card.dataset.position) + 1}枚目：${revealed ? card.dataset.name : "裏向きのカード"}${card.classList.contains("is-matched") ? "、ペア完成" : ""}`);
    card.setAttribute("aria-pressed", String(revealed));
  }

  function playConfetti() {
    if (reducedMotion.matches) return;
    confetti.style.setProperty("--fall-distance", root.scrollHeight + "px");
    const colors = ["#ffd782", "#b58be0", "#f29642", "#fff0c6"];
    for (let i = 0; i < 44; i++) {
      const piece = document.createElement("i");
      piece.className = "confetti-piece";
      piece.style.setProperty("--left", Math.random() * 100 + "%");
      piece.style.setProperty("--delay", Math.random() * .7 + "s");
      piece.style.setProperty("--color", colors[i % colors.length]);
      confetti.append(piece);
    }
    confettiTimer = window.setTimeout(() => confetti.replaceChildren(), 3600);
  }

  function reveal(card) {
    if (locked || card === first || card.classList.contains("is-matched")) return;
    card.classList.add("is-flipped");
    setCardLabel(card, true);
    if (!first) {
      first = card;
      status.textContent = "あと1枚めくってね";
      return;
    }
    const previous = first;
    first = null;
    if (previous.dataset.pair === card.dataset.pair) {
      for (const matched of [previous, card]) {
        matched.classList.add("is-matched");
        matched.setAttribute("aria-disabled", "true");
        setCardLabel(matched, true);
      }
      pairs++;
      count.textContent = pairs;
      status.textContent = `${card.dataset.name}のペアがそろったよ！`;
      if (pairs === CARD_IMAGES.length) {
        locked = true;
        turnTimer = window.setTimeout(() => {
          celebration.hidden = false;
          status.textContent = "8組すべて完成！";
          root.querySelector("#clear-title").focus({ preventScroll: true });
          celebration.scrollIntoView({ behavior: reducedMotion.matches ? "instant" : "smooth", block: "nearest" });
          playConfetti();
        }, reducedMotion.matches ? 0 : 450);
      }
    } else {
      locked = true;
      status.textContent = "よく覚えてね…";
      turnTimer = window.setTimeout(() => {
        for (const missed of [previous, card]) {
          missed.classList.remove("is-flipped");
          setCardLabel(missed, false);
        }
        status.textContent = "もう一度、2枚めくってね";
        // 裏返すアニメーションが終わるまで次の操作を待ちます。
        turnTimer = window.setTimeout(() => { locked = false; }, reducedMotion.matches ? 0 : 420);
      }, 1000);
    }
  }

  function startGame(moveFocus = false) {
    clearTimeout(turnTimer);
    clearTimeout(confettiTimer);
    first = null;
    locked = false;
    pairs = 0;
    count.textContent = "0";
    celebration.hidden = true;
    confetti.replaceChildren();
    status.textContent = "好きなカードを2枚めくってね";
    const deck = CARD_IMAGES.flatMap(item => [item, item]);
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    board.replaceChildren();
    deck.forEach((item, index) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "memory-card";
      card.dataset.pair = item.id;
      card.dataset.position = index;
      card.dataset.name = item.name;
      setCardLabel(card, false);
      const inner = document.createElement("span");
      inner.className = "card-inner";
      inner.append(makeFace("back", BACK_IMAGE, "🌙", "Happy Halloween"), makeFace("front", item.image, item.emoji, item.name));
      card.append(inner);
      card.addEventListener("click", () => reveal(card));
      board.append(card);
    });
    if (moveFocus) board.querySelector("button").focus();
  }

  root.querySelector("#play-again").addEventListener("click", () => startGame(true));
  startGame();
})();
