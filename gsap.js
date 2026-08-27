import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText);

const POP_COLORS = ["#11a8db", "#7cf0ff"];

export function initDescriptionPop(selector = ".section-hero__description") {
  const el = document.querySelector(selector);
  if (!el) return;

  const split = SplitText.create(el, {
    type: "chars",
    charsClass: "char",
    aria: "auto",
  });

  const chars = split.chars.filter((char) => char.textContent.trim());
  if (!chars.length) return;

  const restColor = getComputedStyle(el).color;
  const busy = new WeakSet();

  gsap.set(chars, {
    display: "inline-block",
    transformOrigin: "50% 100%",
  });

  const pop = (char) => {
    busy.add(char);

    gsap
      .timeline({
        onComplete: () => {
          busy.delete(char);
          gsap.set(char, { zIndex: 0 });
        },
      })
      .set(char, { zIndex: 1 })
      .to(char, {
        y: gsap.utils.random(-32, -16),
        scale: gsap.utils.random(1.28, 1.7),
        rotation: gsap.utils.random(-32, 32),
        color: gsap.utils.random(POP_COLORS),
        duration: 0.75,
        ease: "elastic.out(1, 0.35)",
      })
      .to(char, {
        y: 0,
        scale: 1,
        rotation: 0,
        color: restColor,
        duration: 0.35,
        ease: "power2.inOut",
      });
  };

  const tick = () => {
    const idle = chars.filter((char) => !busy.has(char));
    if (idle.length) {
      pop(gsap.utils.random(idle));
    }
    gsap.delayedCall(gsap.utils.random(0.25, 1.4), tick);
  };

  tick();
}
