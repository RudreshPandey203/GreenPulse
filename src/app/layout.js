import "./globals.css";

export const metadata = {
  title: "GreenPulse",
  description: "Track and reduce your carbon footprint",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-100 min-h-screen font-sans">
        {children}
      </body>
    </html>
  );
}
