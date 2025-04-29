const confetti = () => {
  const colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

  const createConfetti = () => {
    const confetti = document.createElement("div");
    confetti.style.position = "fixed";
    confetti.style.width = "10px";
    confetti.style.height = "10px";
    confetti.style.backgroundColor =
      colors[Math.floor(Math.random() * colors.length)];
    confetti.style.borderRadius = "50%";
    confetti.style.zIndex = "9999";

    // Random position from top
    confetti.style.left = `${Math.random() * 100}%`;
    confetti.style.top = "-10px";

    // Random falling speed and direction
    const speed = 3 + Math.random() * 5;
    const direction = Math.random() > 0.5 ? 1 : -1;

    document.body.appendChild(confetti);

    let positionY = 0;
    let positionX = parseFloat(confetti.style.left);
    let rotation = 0;

    const fall = () => {
      positionY += speed;
      positionX += direction * (Math.random() * 2);
      rotation += direction * 5;

      confetti.style.top = `${positionY}px`;
      confetti.style.left = `${positionX}%`;
      confetti.style.transform = `rotate(${rotation}deg)`;

      if (positionY < window.innerHeight) {
        requestAnimationFrame(fall);
      } else {
        confetti.remove();
      }
    };

    requestAnimationFrame(fall);
  };

  // Create multiple confetti particles
  for (let i = 0; i < 100; i++) {
    setTimeout(createConfetti, i * 20);
  }
};

export default confetti;
