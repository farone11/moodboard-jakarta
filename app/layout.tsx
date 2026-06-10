import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: 'swap',
  variable: '--font-poppins'
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#000000'
}

export const metadata: Metadata = {
  title: "MoodBoard AI Jakarta - Cari Spot Jakarta Pake AI",
  description: "Ketik mood kamu, dapetin rekomendasi tempat, vibe, budget, dan lagu yang cocok di Jakarta. Powered by AI. Dibuat oleh Setiawan F.",
  keywords: ["Jakarta", "Moodboard", "AI", "Tempat Nongkrong", "Cafe Jakarta", "Resto Jakarta", "Nightlife"],
  authors: [{ name: "Setiawan F" }],
  creator: "Setiawan F",
  publisher: "Setiawan F",
  openGraph: {
    title: "MoodBoard AI Jakarta",
    description: "Cari spot Jakarta sesuai mood kamu pake AI",
    url: "https://moodboard-jakarta.vercel.app",
    siteName: "MoodBoard AI Jakarta",
    images: [
      {
        url: "https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?q=80&w=1200",
        width: 1200,
        height: 630,
        alt: "MoodBoard AI Jakarta",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MoodBoard AI Jakarta",
    description: "Cari spot Jakarta sesuai mood kamu pake AI",
    images: ["https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?q=80&w=1200"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={poppins.variable}>
      <body className="font-poppins antialiased">{children}</body>
    </html>
  );
}