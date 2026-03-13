const btn = document.getElementById("enterBtn");
const landing = document.getElementById("landing");

if (btn) {
  btn.addEventListener("click", () => {
    if (landing) {
      landing.classList.add("slide-up");
      setTimeout(() => {
        window.location.href = "index_mistnost.html";
      }, 800);
      return;
    }

    window.location.href = "index_mistnost.html";
  });
}

