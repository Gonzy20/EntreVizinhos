"use client";

// Importa hooks do React
import { useEffect, useState } from "react";

// Importa Link para navegação entre páginas
import Link from "next/link";

// Importa o cabeçalho da aplicação
import Header from "@/components/Header";

// Define o formato de um pedido
type Pedido = {
  _id: string;
  nomePessoa: string;
  descricao: string;

  // Estado atual do pedido
  estado: string;

  // Nome da pessoa que aceitou ajudar
  ajudanteNome: string | null;

  // Informação da freguesia do pedido
  freguesia: {
    nome: string;
    concelho: string;
  };
};

export default function PedidosEmProgresso() {
  // Guarda todos os pedidos em progresso
  const [pedidos, setPedidos] = useState<Pedido[]>([]);

  // Executa quando a página carrega
  useEffect(() => {
    async function carregarPedidos() {
      // Vai buscar todos os pedidos à API
      const res = await fetch("/api/pedidos");

      // Converte a resposta para JSON
      const data = await res.json();

      // Filtra apenas os pedidos com estado "em_progresso"
      const pedidosEmProgresso = data.filter(
        (pedido: Pedido) => pedido.estado === "em_progresso"
      );

      // Guarda os pedidos filtrados no estado
      setPedidos(pedidosEmProgresso);
    }

    carregarPedidos();
  }, []);

  return (
    <>
      {/* Cabeçalho da aplicação */}
      <Header />

      <main className="pedidos-progresso-page">
        {/* Topo da página */}
        <section className="pagina-topo">
          <h1>Pedidos em Progresso</h1>

          {/* Botão para voltar ao feed principal */}
          <Link href="/" className="voltar-btn">
            Voltar ao feed
          </Link>
        </section>

        {/* Lista de pedidos */}
        <section className="pedidos-lista">
          {/* 
            Se não existirem pedidos em progresso,
            mostra esta mensagem.
          */}
          {pedidos.length === 0 && (
            <p>Não existem pedidos em progresso.</p>
          )}

          {/* 
            Percorre todos os pedidos em progresso
            e cria um card para cada um.
          */}
          {pedidos.map((pedido) => (
            <Link
              key={pedido._id}
              href={`/pedidos/${pedido._id}`}
              className="pedido-card"
            >
              {/* Nome da pessoa que criou o pedido */}
              <h2>{pedido.nomePessoa}</h2>

              {/* Descrição do pedido */}
              <p>{pedido.descricao}</p>

              {/* Informação da freguesia */}
              <p>
                {pedido.freguesia.nome} - {pedido.freguesia.concelho}
              </p>

              {/* Nome da pessoa que está a ajudar */}
              <p>Ajudante: {pedido.ajudanteNome}</p>
            </Link>
          ))}
        </section>
      </main>
    </>
  );
}