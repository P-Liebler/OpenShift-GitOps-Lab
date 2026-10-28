"use strict";

// Browser-only educational animation. Does NOT access OpenShift or Argo CD APIs.
(() => {
  const start = document.getElementById("start-btn");
  const reset = document.getElementById("reset-btn");
  const message = document.getElementById("sim-message");
  const steps = Array.from(document.querySelectorAll("#timeline li"));
  const messages = [
    "Simulation: Ein Commit wurde erkannt.",
    "Simulation: Die Manifeste wurden verarbeitet.",
    "Simulation: Argo CD synchronisiert den Soll-Zustand.",
    "Simulation: Der neue Pod besteht die Health Checks."
  ];
  let generation = 0;
  let running = false;
  const pending = new Set();

  function schedule(callback, delay) {
    const id = setTimeout(() => {
      pending.delete(id);
      callback();
    }, delay);
    pending.add(id);
  }

  function cancelPending() {
    for (const id of pending) clearTimeout(id);
    pending.clear();
  }

  function resetAll() {
    generation += 1;
    cancelPending();
    running = false;
    start.disabled = false;
    message.textContent = "Bereit f\u00fcr die Simulation.";
    steps.forEach((step) => {
      step.classList.remove("complete", "active");
      step.querySelector(".step-state").textContent = "Ausstehend";
    });
  }

  function showStep(index, cycle) {
    if (cycle !== generation) return;
    if (index >= steps.length) {
      running = false;
      start.disabled = false;
      message.textContent = "Simulation abgeschlossen. Jetzt einen echten Git-Commit testen!";
      return;
    }
    if (index > 0) {
      steps[index - 1].classList.remove("active");
      steps[index - 1].classList.add("complete");
      steps[index - 1].querySelector(".step-state").textContent = "Simuliert";
    }
    steps[index].classList.add("active");
    steps[index].querySelector(".step-state").textContent = "L\u00e4uft (simuliert)";
    message.textContent = messages[index];
    schedule(() => {
      if (cycle !== generation) return;
      if (index === steps.length - 1) {
        steps[index].classList.remove("active");
        steps[index].classList.add("complete");
        steps[index].querySelector(".step-state").textContent = "Simuliert";
      }
      showStep(index + 1, cycle);
    }, 850);
  }

  start.addEventListener("click", () => {
    if (running) return;
    resetAll();
    running = true;
    start.disabled = true;
    const cycle = generation;
    showStep(0, cycle);
  });
  reset.addEventListener("click", resetAll);
})();
