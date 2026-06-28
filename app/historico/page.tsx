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

  // Estado do pedido (ativo, em progresso, concluído, etc.)
  estado: string;

  // Nome da pessoa que ajudou no pedido
  ajudanteNome: string | null;

  // Dados da freguesia associados ao pedido
  freguesia: {
    nome: string;
    concelho: string;
  };
};

export default function HistoricoPedidos() {
  // Guarda todos os pedidos concluídos
  const [pedidos, setPedidos] = useState<Pedido[]>([]);

  // Executa quando a página carrega
  useEffect(() => {
    async function carregarPedidos() {
      // Vai buscar todos os pedidos à API
      const res = await fetch("/api/pedidos");

      // Converte a resposta para JSON
      const data = await res.json();

      // Filtra apenas os pedidos concluídos
      const pedidosConcluidos = data.filter(
        (pedido: Pedido) => pedido.estado === "concluido"
      );

      // Guarda os pedidos concluídos no estado
      setPedidos(pedidosConcluidos);
    }

    carregarPedidos();
  }, []);

  return (
    <>
      {/* Cabeçalho da aplicação */}
      <Header />

      <main className="historico-page">
        {/* Topo da página */}
        <section className="pagina-topo">
          <h1>Histórico</h1>

          {/* Botão para voltar ao feed principal */}
          <Link href="/" className="voltar-btn">
            Voltar ao feed
          </Link>
        </section>

        {/* Lista de pedidos concluídos */}
        <section className="pedidos-lista">
          {/* Mensagem mostrada caso não existam pedidos concluídos */}
          {pedidos.length === 0 && (
            <p>Não existem pedidos concluídos.</p>
          )}

          {/* Percorre todos os pedidos concluídos */}
          {pedidos.map((pedido) => (
            // Cada card é também um link para os detalhes do pedido
            <Link
              key={pedido._id}
              href={`/pedidos/${pedido._id}`}
              className="pedido-card historico-card"
            >
              {/* Nome da pessoa que criou o pedido */}
              <h2>{pedido.nomePessoa}</h2>

              {/* Descrição do pedido */}
              <p>{pedido.descricao}</p>

              {/* Informação da freguesia */}
              <p>
                {pedido.freguesia.nome} - {pedido.freguesia.concelho}
              </p>

              {/* Nome do ajudante */}
              <p>Ajudante: {pedido.ajudanteNome}</p>

              {/* Estado do pedido */}
              <p>Estado: concluído</p>
            </Link>
          ))}
        </section>
      </main>
    </>
  );
}