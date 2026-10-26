export default function limitText(text: string, limit: number = 30) {
  text.trim();
  if (text.length > limit) {
    text = text.substring(0, limit - 2) + "...";
  }
  return text;
}
