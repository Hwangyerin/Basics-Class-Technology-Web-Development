chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "SET_THEME") {
    const color = msg.color;

    chrome.theme.update({
      colors: {
        frame: color,
        toolbar: color,
        tab_background_text: "#ffffff",
        tab_background_separator: "#00000010"
      }
    });
  }
});
