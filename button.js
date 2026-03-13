const btn = document.getElementById("enterBtn");
const landing = document.getElementById("landing");

if (landing) {
  landing.classList.add("text-enter");
  window.addEventListener("load", () => {
    setTimeout(() => {
      landing.classList.remove("text-enter");
    }, 400);
  });
}

if (btn) {
  btn.addEventListener("click", () => {
    if (landing) {
      landing.classList.remove("text-enter");
      landing.classList.add("text-exit");
      btn.disabled = true;
      setTimeout(() => {
        window.location.href = "index_mistnost.html";
      }, 1600);
      return;
    }

    window.location.href = "index_mistnost.html";
  });
}

