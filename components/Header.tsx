"use client";

import { useState } from "react";
import Link from "next/link";

export default function Header() {
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <>
      <header className="header">
        <button
          className="menu-button"
          onClick={() => setMenuAberto(!menuAberto)}
        >
          ☰
        </button>

        <h1>EntreVizinhos</h1>

        <Link href="/perfil" className="profile-button">
          ◯
        </Link>
      </header>

      {menuAberto && (
        <nav className="side-menu">
          <Link href="/">Página Principal</Link>
          <Link href="/criar-pedido">Criar Pedido</Link>
          <Link href="/pedidos-em-progresso">Pedidos em Progresso</Link>
          <Link href="/historico">Histórico</Link>
          <Link href="/perfil">Perfil</Link>
        </nav>
      )}
    </>
  );
}