const userText = document.getElementById("user-text");
const applyBtn = document.getElementById("apply-btn");
const resultBox = document.getElementById("result-box");
const colorInfo = document.getElementById("color-info");

function randomHex() {
  return "#" + Math.floor(Math.random() * 16777215)
    .toString(16)
    .padStart(6, "0");
}

applyBtn.addEventListener("click", () => {
  const text = userText.value.trim();
  if (!text) {
    resultBox.textContent = "텍스트를 입력해주세요 🙂";
    return;
  }

  const bgColor = randomHex();
  const textColor = randomHex();

  resultBox.style.background = bgColor;
  resultBox.style.color = textColor;
  resultBox.textContent = text;

  colorInfo.textContent = `배경색: ${bgColor} / 텍스트색: ${textColor}`;
});
