// Listen for context menu / keyboard shortcut to save highlighted text
document.addEventListener("keydown", (e) => {
  // Ctrl/Cmd + Shift + S to save highlight
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "S") {
    e.preventDefault();
    const selection = window.getSelection()?.toString().trim();
    if (selection) {
      chrome.runtime.sendMessage(
        {
          action: "saveHighlight",
          data: {
            url: window.location.href,
            title: document.title,
            highlight: selection,
          },
        },
        (response) => {
          if (response?.success) {
            showNotification("Highlight saved!");
          } else {
            showNotification("Failed to save highlight", true);
          }
        }
      );
    }
  }
});

function showNotification(message, isError = false) {
  const el = document.createElement("div");
  el.textContent = message;
  Object.assign(el.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    padding: "12px 20px",
    borderRadius: "8px",
    fontSize: "14px",
    fontFamily: "system-ui, sans-serif",
    color: "white",
    backgroundColor: isError ? "#ef4444" : "#22c55e",
    zIndex: "999999",
    transition: "opacity 0.3s",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  });
  document.body.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 300);
  }, 2000);
}
