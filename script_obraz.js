const obrazy = document.querySelectorAll(".obrazy");

obrazy.forEach(el => {
  el.addEventListener("click", () => {
    window.location.href = "editace.html?image=" + el.id;; // otevře jiný index/html

  });
});