"use client";

// Importa hooks do React
import { useEffect, useState } from "react";

// Importa Link para navegação entre páginas
import Link from "next/link";
import { IoArrowBackOutline } from "react-icons/io5";


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

      <main className="historico-page">
        {/* Topo da página */}
        <section className="home-top">
          <h1>Histórico</h1>

          {/* Botão para voltar ao feed principal */}
          <Link href="/" className="criar-pedido-btn">
            <IoArrowBackOutline className="icon-add"/>
            Voltar ao feed
          </Link>
        </section>

        {/* Lista de pedidos concluídos */}
        <section className="filtro-box">
          <div className="pedidos-header">
            <label>Pedidos Concluídos</label>
            <text className="pedidos-contagem">{pedidos.length}</text>
          </div>
          {/* 
            Se não existirem pedidos concluídos,
            mostra esta mensagem.
          */}
          {pedidos.length === 0 && (
            <div className="sem-pedidos">
              <div className="sem-pedidos-img">
              </div> 
              <label>Não existem pedidos concluídos.</label>
              <text>Quando pedidos ficarem concluídos, eles aparecerão aqui.</text>
            </div>
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