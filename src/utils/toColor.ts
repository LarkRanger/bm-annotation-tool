const colors: {[key: string]: string} = {
  'Choose label...': "#888888",
  pylon: "#0000FF",
  farm: "#FF0000",
  gold_mine: "#9d9d00"
};

export const toColor = (label: string) => {
  return colors[label];
};