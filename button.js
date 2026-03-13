const obrazy = document.querySelectorAll(".obrazy");

obrazy.forEach(el => {
  el.addEventListener("click", () => {
    window.location.href = "index_mistnost.html"; // otevře jiný index/html
  });
});

const btn = document.getElementById("enterBtn");
const landing = document.getElementById("landing");

if (btn && landing) {
  btn.addEventListener("click", () => {
    landing.classList.add("slide-up");
  });
}