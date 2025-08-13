// src/app/layout.tsx

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // Certifique-se de que seu arquivo CSS global está aqui

// Carrega uma fonte otimizada do Google Fonts
const inter = Inter({ subsets: ["latin"] });

// Metadados da sua aplicação (bom para SEO)
export const metadata: Metadata = {
  title: "Dashboard de Gestão",
  description: "Sistema de gerenciamento de livros e licenças.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        {/* A tag {children} é onde o conteúdo da sua 'page.tsx' será injetado. */}
        {children}
      </body>
    </html>
  );
}
