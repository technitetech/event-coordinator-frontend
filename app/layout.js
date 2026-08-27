import "./globals.css";

export const metadata = {
  title: "St. Lachland Hotel — Beachfront Luxury, Negombo, Sri Lanka",
  description:
    "A refined coastal sanctuary in Negombo, Sri Lanka. Stay, dine, and plan events with our AI event coordinator overlooking the golden shores of the Indian Ocean.",
  keywords: "luxury hotel, Sri Lanka, Negombo, beach resort, event venue, wedding venue, coastal sanctuary",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* 
          UI UX Pro Max skill: Luxury Serif pairing
          Display: Cormorant Garamond (editorial, luxury manifesto, event apps)
          Body: Manrope (geometric precision, high legibility)
          Supplementary: Playfair Display Italic for pull-quotes
        */}
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=Manrope:wght@400;500;600;700;800&family=Playfair+Display:ital@1&display=swap"
          rel="stylesheet"
        />
        {/* Google Material Symbols Outlined */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
