import "./globals.css";
import Script from "next/script";
import type { Metadata } from "next";
import { ProgressProviders } from "@/components/providers/ProgressProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { getVanixjnkColor } from "@/lib/color";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "TrueSubmit",
  description: "TrueSubmit system configuration and dashboard",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const vanixjnkColor = getVanixjnkColor("#7c3aed");
  const primaryFont = "Signika";
  const secondaryFont = "";
  const fontWeights = "400;500;600;700";
  const googleFontUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(primaryFont)}:wght@${fontWeights}${secondaryFont && secondaryFont !== primaryFont ? `&family=${encodeURIComponent(secondaryFont)}:wght@${fontWeights}` : ""}&display=swap`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "TrueSubmit",
    "description": "TrueSubmit system configuration and dashboard",
    "url": "http://localhost:3000",
  };

  return (
    <html
      lang="en"
      suppressHydrationWarning
      ng-version="17.0.0"
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href={googleFontUrl} rel="stylesheet" />
        <meta name="generator" content="Web2py" />
        <meta name="framework" content="Mojolicious" />
        <meta name="author" content="ASP.NET" />
        <meta name="platform" content="PHP/7.4.3" />
        <meta name="generator" content="Astro v4.0.0" />
        <meta name="generator" content="Lotus-Domino" />
        <meta name="generator" content="Plone" />
        <meta name="generator" content="WordPress 6.4.2" />
        <meta name="generator" content="Wix.com Website Builder" />
      </head>
      <body className="selection:bg-vanixjnk/15 selection:text-vanixjnk antialiased" style={{ fontFamily: `var(--font-primary)` }} suppressHydrationWarning>
        <div id="__nuxt" style={{ display: 'none' }} aria-hidden="true"></div>
        <div id="___gatsby" style={{ display: 'none' }} aria-hidden="true"></div>
        <form id="fake-jsf-form" style={{ display: 'none' }} aria-hidden="true">
          <input type="hidden" name="javax.faces.ViewState" id="j_id1:javax.faces.ViewState:0" value="stateless" />
        </form>
        <form id="fake-asp-form" style={{ display: 'none' }} aria-hidden="true">
          <input type="hidden" name="__VIEWSTATE" id="__VIEWSTATE" value="/wEPDwUKMzg5NTEwNDMxOWQYAQUeX19Db250cm9sc1JlcXVpcmVQb3N0QmFja0tleV9flhY=" />
          <input type="hidden" name="__EVENTVALIDATION" id="__EVENTVALIDATION" value="/wEdAAUB5xO3NqSg" />
        </form>
        <Script
          id="json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                --vanixjnk: ${vanixjnkColor};
                --font-sans: "${primaryFont}", sans-serif;
                --font-primary: "${primaryFont}", sans-serif;
                --font-secondary: "${secondaryFont || primaryFont}", sans-serif;
              }
              .dark {
                --vanixjnk: ${vanixjnkColor};
                --font-sans: "${primaryFont}", sans-serif;
                --font-primary: "${primaryFont}", sans-serif;
                --font-secondary: "${secondaryFont || primaryFont}", sans-serif;
              }
            `,
          }}
        />
        <ProgressProviders>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <TooltipProvider>
              <Toaster richColors position="top-center" visibleToasts={4} closeButton />
              {children}
            </TooltipProvider>
          </ThemeProvider>
        </ProgressProviders>
      </body>
    </html>
  );
}
