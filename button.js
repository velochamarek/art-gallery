const btn = document.getElementById("enterBtn");
const landing = document.getElementById("landing");

btn.addEventListener("click", () => {
  landing.classList.add("slide-up");
});