const quotes = [
  'When you have eliminated the impossible, whatever remains, however improbable, must be the truth.',
  'There is nothing more deceptive than an obvious fact.',
  'I never make exceptions. An exception disproves the rule.',
  'What one man can invent another can discover.',
  'Education never ends, Watson. It is a series of lessons, with the greatest for the last.'
];

let words = [];
let wordIndex = 0;
let startTime = 0;

const quoteElement = document.getElementById('quote');
const messageElement = document.getElementById('message');
const typedValueElement = document.getElementById('typed-value');
const startButton = document.getElementById('start');

// 모달 관련 요소
const modal = document.getElementById('result-modal');
const modalMessage = document.getElementById('modal-message');
const closeModal = document.getElementById('close-modal');
const restartButton = document.getElementById('restart');

// 최고 기록 가져오기 (없으면 null)
let bestTime = localStorage.getItem('bestTime')
  ? parseFloat(localStorage.getItem('bestTime'))
  : null;

// Start 버튼 클릭 시
startButton.addEventListener('click', () => {
  const quoteIndex = Math.floor(Math.random() * quotes.length);
  const quote = quotes[quoteIndex];
  words = quote.split(' ');
  wordIndex = 0;

  const spanWords = words.map(word => `<span>${word} </span>`);
  quoteElement.innerHTML = spanWords.join('');
  quoteElement.childNodes[0].className = 'highlight';
  messageElement.innerText = '';

  typedValueElement.value = '';
  typedValueElement.disabled = false;
  typedValueElement.focus();
  startTime = new Date().getTime();

  startButton.disabled = true;
});

// 입력 시 이벤트
typedValueElement.addEventListener('input', () => {
  const currentWord = words[wordIndex];
  const typedValue = typedValueElement.value;

  if (typedValue === currentWord && wordIndex === words.length - 1) {
    // 마지막 단어까지 맞게 입력했을 때
    const elapsedTime = (new Date().getTime() - startTime) / 1000;
    const formattedTime = elapsedTime.toFixed(2);

    // 최고 기록 갱신 확인
    if (bestTime === null || elapsedTime < bestTime) {
      bestTime = elapsedTime;
      localStorage.setItem('bestTime', bestTime);
    }

    // 모달 메시지 표시
    modalMessage.innerHTML = `
      <p>⏱️ Your time: <span class="time-highlight">${formattedTime}</span> seconds</p>
      <p class="best-time-text">🏆 Best time: <span>${bestTime.toFixed(2)}</span> seconds</p>
    `;

    // 모달 열기
    modal.style.display = 'flex';
    typedValueElement.disabled = true;
    startButton.disabled = false;

  } else if (typedValue.endsWith(' ') && typedValue.trim() === currentWord) {
    typedValueElement.value = '';
    wordIndex++;
    for (const wordElement of quoteElement.childNodes) {
      wordElement.className = '';
    }
    quoteElement.childNodes[wordIndex].className = 'highlight';
  } else if (currentWord.startsWith(typedValue)) {
    typedValueElement.className = '';
  } else {
    typedValueElement.className = 'error';
  }
});

// 모달 닫기 버튼
closeModal.addEventListener('click', () => {
  modal.style.display = 'none';
});

// 다시하기 버튼
restartButton.addEventListener('click', () => {
  modal.style.display = 'none';
  startButton.click(); // 새 게임 자동 시작
});
