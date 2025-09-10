"use client";

import Link from "next/link";
import { 
  Library, Lightbulb, MessageSquare, Twitter, Instagram, 
  Facebook, LogIn, ChevronDown, Menu, X 
} from "lucide-react";
import React, { useState, useEffect, useRef } from "react";

// --- DADOS MOCKADOS (Sem alterações) ---
const features = [
  { icon: Library, title: "Biblioteca Digital Integrada", description: "Acesse milhares de títulos licenciados diretamente na plataforma, com recursos interativos." },
  { icon: Lightbulb, title: "Gestão Pedagógica Inteligente", description: "Ferramentas para criar planos de aula, acompanhar o progresso dos alunos e gerar relatórios." },
  { icon: MessageSquare, title: "Comunicação Unificada", description: "Um canal direto e seguro entre escolas, professores, alunos e responsáveis." },
];
const featuredBooks = [
  { title: "Aventuras na Amazônia", author: "Maria Souza", imageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&q=80" },
  { title: "O Código do Futuro", author: "João Silva", imageUrl: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=500&q=80" },
  { title: "Geometria das Estrelas", author: "Ana Costa", imageUrl: "https://images.unsplash.com/photo-1592496431122-2349e0fbc666?w=500&q=80" },
  { title: "Histórias do Brasil Colônia", author: "Pedro Martins", imageUrl: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=500&q=80" },
];

// --- NOVOS COMPONENTES E COMPONENTES ATUALIZADOS ---

/**
 * Componente Dropdown para Login
 * Cria um botão que, ao ser clicado, exibe um menu com opções de login.
 */
const LoginDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fecha o dropdown se clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botão principal do Dropdown */}
      <button
        onClick={()=>{window.location.href = './onboard'}}
        className="flex items-center gap-2 bg-gray-900 text-white dark:bg-gray-50 dark:text-gray-900 font-semibold px-4 py-2 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-200 transition-all"
      >
        <LogIn className="h-4 w-4" />
        Acessar Plataforma
      </button>

      {/* Menu do Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-20 border border-gray-200 dark:border-gray-700">
          <Link href="/admin/login" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setIsOpen(false)}>
            Acesso Admin
          </Link>
          <Link href="/onboard/" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setIsOpen(false)}>
            Acesso Secretaria
          </Link>
        </div>
      )}
    </div>
  );
};


/**
 * Header Responsivo
 * Inclui navegação para desktop e um menu hambúrguer para mobile.
 */
const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto flex items-center justify-between p-4">
        <Link href="/" className="flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
          <Library className="h-8 w-8 text-gray-800 dark:text-gray-200" />
          <span className="text-xl font-bold text-gray-900 dark:text-white">Premium Editora</span>
        </Link>
        
        {/* Navegação para Desktop */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600 dark:text-gray-400">
          <Link href="#recursos" className="hover:text-gray-900 dark:hover:text-white transition-colors">Recursos</Link>
          <Link href="#catalogo" className="hover:text-gray-900 dark:hover:text-white transition-colors">Catálogo</Link>
          <Link href="#sobre" className="hover:text-gray-900 dark:hover:text-white transition-colors">Sobre Nós</Link>
        </nav>

        {/* Dropdown de Login para Desktop */}
        <div className="hidden md:block">
          <LoginDropdown />
        </div>

        {/* Botão do Menu Mobile (Hambúrguer) */}
        <div className="md:hidden">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>
      
      {/* Menu Mobile */}
      {isMenuOpen && (
        <div className="md:hidden bg-white/95 dark:bg-black/90 absolute top-full left-0 w-full flex flex-col items-center gap-4 py-8 border-t border-gray-200 dark:border-gray-800">
          <Link href="#recursos" className="text-lg" onClick={() => setIsMenuOpen(false)}>Recursos</Link>
          <Link href="#catalogo" className="text-lg" onClick={() => setIsMenuOpen(false)}>Catálogo</Link>
          <Link href="#sobre" className="text-lg" onClick={() => setIsMenuOpen(false)}>Sobre Nós</Link>
          <div className="mt-4">
             <LoginDropdown />
          </div>
        </div>
      )}
    </header>
  );
};

// --- O RESTANTE DOS COMPONENTES PERMANECE IGUAL ---

const HeroSection = () => (
  <section className="container mx-auto grid md:grid-cols-2 items-center gap-12 px-8 py-20 text-center md:text-left">
    <div className="space-y-6">
      <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-white tracking-tighter">
        A revolução do aprendizado está aqui.
      </h1>
      <p className="text-lg text-gray-600 dark:text-gray-400 max-w-lg mx-auto md:mx-0">
        Conectamos editoras, escolas, professores e alunos em um ecossistema digital completo.
      </p>
      <div className="flex justify-center md:justify-start gap-4">
        <Link 
          href="/onboard" 
          className="bg-gray-900 text-white dark:bg-gray-50 dark:text-gray-900 font-bold px-8 py-3 rounded-full hover:bg-gray-700 dark:hover:bg-gray-200 transition-all hover:scale-105"
        >
          Comece a usar agora
        </Link>
      </div>
    </div>
    <div>
      <img src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2070" alt="Biblioteca moderna" className="rounded-2xl shadow-2xl object-cover" />
    </div>
  </section>
);

const FeatureCard = ({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) => (
  <div className="bg-white dark:bg-gray-800/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
    <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-gray-100 dark:bg-gray-800 mb-4">
      <Icon className="h-6 w-6 text-gray-800 dark:text-gray-200" />
    </div>
    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
    <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
  </div>
);

const BookCard = ({ title, author, imageUrl }: { title: string, author: string, imageUrl: string }) => (
  <div className="group overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
    <div className="overflow-hidden">
      <img src={imageUrl} alt={`Capa do livro ${title}`} className="w-full h-80 object-cover transition-transform duration-300 group-hover:scale-105" />
    </div>
    <div className="p-4">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">{author}</p>
    </div>
  </div>
);

const Footer = () => (
  <footer className="bg-gray-900 text-white">
    <div className="container mx-auto px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
      <div>
        <h3 className="text-lg font-bold mb-4">Premium Editora</h3>
        <p className="text-sm text-gray-400">Transformando a educação através da tecnologia.</p>
        <div className="flex gap-4 mt-4">
          <Link href="#" className="text-gray-400 hover:text-white"><Twitter /></Link>
          <Link href="#" className="text-gray-400 hover:text-white"><Facebook /></Link>
          <Link href="#" className="text-gray-400 hover:text-white"><Instagram /></Link>
        </div>
      </div>
      <div>
        <h4 className="font-semibold mb-4">Plataforma</h4>
        <ul className="space-y-2 text-sm text-gray-400">
          <li><Link href="#recursos" className="hover:text-white">Recursos</Link></li>
          <li><Link href="/onboard" className="hover:text-white">Acesso</Link></li>
          <li><Link href="#catalogo" className="hover:text-white">Catálogo de Livros</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="font-semibold mb-4">Empresa</h4>
        <ul className="space-y-2 text-sm text-gray-400">
          <li><Link href="#sobre" className="hover:text-white">Sobre Nós</Link></li>
          <li><Link href="#" className="hover:text-white">Carreiras</Link></li>
          <li><Link href="#" className="hover:text-white">Contato</Link></li>
        </ul>
      </div>
        <div>
        <h4 className="font-semibold mb-4">Legal</h4>
        <ul className="space-y-2 text-sm text-gray-400">
          <li><Link href="#" className="hover:text-white">Termos de Serviço</Link></li>
          <li><Link href="#" className="hover:text-white">Política de Privacidade</Link></li>
        </ul>
      </div>
    </div>
    <div className="border-t border-gray-800">
      <p className="text-center text-sm text-gray-500 py-4">&copy; {new Date().getFullYear()} Premium Editora. Todos os direitos reservados.</p>
    </div>
  </footer>
);

// --- PÁGINA PRINCIPAL (LANDING PAGE) ---
export default function LandingPage() {
  return (
    <div className="bg-white dark:bg-black font-sans">
      <Header />
      
      <main>
        <HeroSection />

        <section id="recursos" className="py-20 bg-gray-50 dark:bg-gray-900/60">
          <div className="container mx-auto px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Tudo que você precisa em um só lugar</h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">Nossa plataforma foi desenhada para ser completa e intuitiva.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {features.map(feature => <FeatureCard key={feature.title} {...feature} />)}
            </div>
          </div>
        </section>

        <section id="catalogo" className="py-20">
          <div className="container mx-auto px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Conheça nosso Catálogo</h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">Títulos selecionados para inspirar e educar a próxima geração.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredBooks.map(book => <BookCard key={book.title} {...book} />)}
            </div>
          </div>
        </section>

        <section id="sobre" className="py-20 bg-gray-50 dark:bg-gray-900/60">
          <div className="container mx-auto px-8">
            <div className="bg-gray-900 rounded-2xl text-white p-12 grid md:grid-cols-3 items-center gap-8">
                <div className="md:col-span-2">
                    <h2 className="text-3xl font-bold mb-4">Sobre a Premium Editora</h2>
                    <p className="text-gray-300">
                        Nascemos da paixão por educação e da crença no poder da tecnologia. Há mais de 10 anos, nossa missão é criar pontes entre o conhecimento e as pessoas, oferecendo ferramentas que não apenas informam, mas também inspiram.
                    </p>
                </div>
                <div className="flex justify-center">
                    <Library className="h-32 w-32 text-white/40" />
                </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}