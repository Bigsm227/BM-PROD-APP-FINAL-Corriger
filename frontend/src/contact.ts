import { Linking } from "react-native";

// Big S Media Production — studio contact & payment info (Niamey)
export const STUDIO = {
  name: "BIG S MEDIA PRODUCTION",
  tagline: "Studio de Production & Audiovisuel — Niamey",
  whatsapp: "22796558193", // wa.me format (no +)
  phoneDisplay: "+227 96 55 81 93",
  phoneTel: "+22796558193",
  email: "sanistomoussa@gmail.com",
};

export type SocialLink = { key: string; label: string; value: string; url: string };

export const SOCIALS: SocialLink[] = [
  {
    key: "tiktok",
    label: "TikTok",
    value: "big.sm.officiel227",
    url: "https://www.tiktok.com/@big.sm.officiel227?_r=1&_t=ZN-99ekDLWCF6c",
  },
  {
    key: "youtube",
    label: "YouTube",
    value: "big_sm_officiel",
    url: "https://youtube.com/@big_sm_officiel?si=bdHBCS1le1hUYVL8",
  },
  {
    key: "facebook",
    label: "Facebook",
    value: "Page Officielle BM Prod",
    url: "https://www.facebook.com/share/1BwNbQyWqu/",
  },
  {
    key: "instagram",
    label: "Instagram",
    value: "Page Officielle BM Prod",
    url: "https://www.facebook.com/share/1BwNbQyWqu/",
  },
];

export async function openWhatsApp(message: string) {
  const url = `https://wa.me/${STUDIO.whatsapp}?text=${encodeURIComponent(message)}`;
  await Linking.openURL(url);
}

export async function openLink(url: string) {
  await Linking.openURL(url);
}

export const SERVICES_OPTIONS = [
  "Enregistrement Audio",
  "Mixage & Mastering",
  "Production Beat / Instrumentale",
  "Tournage / Montage Vidéo",
];
