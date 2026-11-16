export const isDesktop: boolean =
  typeof window !== "undefined" && Boolean(window.desktop?.isDesktop);

export const isWeb: boolean = !isDesktop;

export const platformType: "web" | "electron" = isDesktop ? "electron" : "web";
