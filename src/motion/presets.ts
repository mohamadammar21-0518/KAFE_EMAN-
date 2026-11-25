export const appearTween = {
  duration: 0.5,
  ease: [0.44, 0, 0.56, 1] as const,
};

export const heroEase = [0.12, 0.23, 0.5, 1] as const;
export const heroMediaEase = [0.18, -0.01, 0.3, 1] as const;
export const pageEase = [0.27, 0, 0.51, 1] as const;

export const cardSpring = {
  type: "spring" as const,
  damping: 58,
  stiffness: 400,
};

export const scrollCardSpring = {
  type: "spring" as const,
  bounce: 0.2,
  damping: 80,
  stiffness: 400,
};

export const dividerSpring = {
  type: "spring" as const,
  bounce: 0,
  duration: 1.5,
};

export const navSpring = {
  type: "spring" as const,
  stiffness: 500,
  damping: 60,
};

export const carouselSpring = {
  type: "spring" as const,
  damping: 24,
  stiffness: 100,
};

export const lineGrowSpring = {
  type: "spring" as const,
  damping: 60,
  stiffness: 500,
  duration: 3,
};

export const workspaceSpring = {
  type: "spring" as const,
  damping: 60,
  stiffness: 500,
  duration: 0.3,
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

export const staggerItem = {
  hidden: { opacity: 0, y: -20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 97 },
  },
};
