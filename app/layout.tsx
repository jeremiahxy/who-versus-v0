import type { Metadata } from "next";
import { Orbitron, Share, Wallpoet } from "next/font/google";
import "./globals.css";

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

const share = Share({
  variable: "--font-share",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const wallpoet = Wallpoet({
  variable: "--font-wallpoet",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Who Versus",
  description: "Challenge others to games you create",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${orbitron.variable} ${share.variable} ${wallpoet.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
