"use client";

// Importa hooks do React
import { useEffect, useState } from "react";

// Importa hooks do Next.js:
// useParams permite aceder ao id que vem no URL
// useRouter permite redirecionar o utilizador para outra página
import { useParams, useRouter } from "next/navigation";

// Componente de navegação para realizar transições de página
import Link from "next/link";

// Importa o cabeçalho da aplicação
import Header from "@/components/Header";

// Define o formato de um pedido
type Pedido = {
  _id: string;
  titulo: string;
  nomePessoa: string;
  descricao: string;
  morada: string;
  estado: string;
  ajudanteNome: string | null;
  coordenadas: {
    lat: number;
    lng: number;
  }

  freguesia: {
    nome: string;
    concelho: string;
  };
};

export default function DetalhesPedido() {
  // Vai buscar os parâmetros dinâmicos do URL.
  // Neste caso, o id vem de /pedidos/[id]
  const params = useParams();

  // Permite navegar para outras páginas através de código
  const router = useRouter();

  // Guarda o pedido encontrado
  // Começa como null porque ainda está a carregar
  const [pedido, setPedido] = useState<Pedido | null>(null);

  // Guarda o nome escrito pela pessoa que quer ajudar
  const [nomeAjudante, setNomeAjudante] = useState("");

  // Estado para guardar a justificativa de falha
  const [justificativaFalha, setJustificativaFalha] = useState("");

  // Executa quando a página carrega ou quando o id do URL muda
  useEffect(() => {
    async function carregarPedido() {
      // Vai buscar todos os pedidos à API
      const res = await fetch("/api/pedidos");

      // Converte a resposta para JSON
      const data = await res.json();

      // Procura na lista o pedido cujo _id é igual ao id do URL
      const pedidoEncontrado = data.find(
        (p: Pedido) => p._id === params.id
      );

      // Guarda o pedido encontrado no estado
      setPedido(pedidoEncontrado);
    }

    carregarPedido();
  }, [params.id]);

  // Função usada para aceitar um pedido
  async function aceitarPedido() {
    // Se o nome do ajudante estiver vazio, não faz nada
    if (!nomeAjudante) return;

    // Envia uma atualização para a API,
    // indicando quem é o ajudante do pedido
    const res = await fetch(`/api/pedidos/${params.id}/ajudar`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ajudanteNome: nomeAjudante,
      }),
    });

    // Se a resposta for bem-sucedida,
    // redireciona para a página dos pedidos em progresso
    if (res.ok) {
      router.push("/pedidos-em-progresso");
    }
  }

  // Função usada para marcar o pedido como concluído
  async function concluirPedido() {
    // Faz um PATCH para alterar o estado do pedido para concluído
    const res = await fetch(`/api/pedidos/${params.id}/concluir`, {
      method: "PATCH",
    });

    // Se correr bem, redireciona para o histórico
    if (res.ok) {
      router.push("/historico");
    }
  }

  // Marcar pedido como não resolvido
  async function marcarNaoResolvido() {
    if (!justificativaFalha) return;

    const res = await fetch(`/api/pedidos/${params.id}/nao-resolvido`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        justificativaFalha,
      }),
    });

    if (res.ok) {
      router.push("/");
    }
  }

  // Função usada para eliminar um pedido
  async function eliminarPedido() {
    // Mostra uma caixa de confirmação antes de apagar
    const confirmar = confirm("Tens a certeza?");

    // Se o utilizador cancelar, a função termina aqui
    if (!confirmar) return;

    // Faz um DELETE para apagar o pedido da base de dados
    const res = await fetch(`/api/pedidos/${params.id}`, {
      method: "DELETE",
    });

    // Se correr bem, volta ao feed principal
    if (res.ok) {
      router.push("/");
    }
  }

  // Enquanto o pedido ainda não foi carregado, mostra mensagem de loading
  if (!pedido) {
    return (
      <>
        <main className="detalhes-page">
          <p>A carregar...</p>
        </main>
      </>
    );
  }

  return (
    <>

      <main className="detalhes-page">
        <section className="filter-box">

          {/* Titulo do pedido */}
          <h1>{pedido.titulo}</h1>

          {/* Nome da pessoa que criou o pedido */}
          <p>{pedido.nomePessoa}</p>

          <label>Descrição:</label>

          {/* Descrição do pedido */}
          <p>{pedido.descricao}</p>

          <label>Morada:</label>

          {/* Morada obtida autaticamente a partir da localização selecionada */}
          <p>{pedido.morada || "Morada não disponível"}</p>

          <label>Freguesia:</label>

          {/* Freguesia e concelho associados ao pedido */}
          <p>
            {pedido.freguesia.nome} - {pedido.freguesia.concelho}
          </p>

          <label>Estado:</label>

          {/* Estado atual do pedido */}
          <p>{pedido.estado}</p>

          {/* Só mostra o ajudante se já existir um nome guardado */}
          {pedido.ajudanteNome && (
            <>
              <label>Ajudante:</label>

              <p>{pedido.ajudanteNome}</p>
            </>
          )}

          <div className="mapa-detalhes">
            {/* 
              Mapa embutido do Google Maps.
              Usa a latitude e longitude guardadas no pedido
              para mostrar a localização selecionada.
            */}
            <iframe
              width="100%"
              height="250"
              loading="lazy"
              src={`https://maps.google.com/maps?q=${pedido.coordenadas.lat},${pedido.coordenadas.lng}&z=15&output=embed`}
            />
          </div>

          {/* 
            Se o pedido estiver ativo, mostra o input para o nome do ajudante
            e o botão para aceitar o pedido, juntamente com a possibilidade de marcar como não resolvido e justificar.
          */}
          {pedido.estado === "ativo" && (
            <div className="acoes-box">
              <input
                type="text"
                placeholder="Nome do ajudante"
                value={nomeAjudante}
                onChange={(e) => setNomeAjudante(e.target.value)}
              />

              <button onClick={aceitarPedido} className="acao-verde">
                Aceitar Pedido
              </button>
            </div>
          )}

          {/* 
            Se o pedido estiver em progresso,
            mostra o botão para marcar como concluído.
          */}
          {pedido.estado === "em_progresso" && (
            <div className="acoes-box">
              <button onClick={concluirPedido} className="acao-verde">
                Marcar como concluído
              </button>

              <p>Não foi resolvido? Nos diga o ocorrido.</p>

              <textarea
                placeholder="Justificação caso não tenha sido resolvido"
                value={justificativaFalha}
                onChange={(e) => setJustificativaFalha(e.target.value)}
              />

              <button onClick={marcarNaoResolvido} className="acao-vermelha">
                Marcar como não resolvido
              </button>
            </div>
          )}

          <div className="acoes-secundarias">
            {/* Link para editar este pedido */}
            <Link
              href={`/pedidos/${pedido._id}/editar`}
              className="acao-azul"
            >
              Editar Pedido
            </Link>

            {/* Botão disponível para eliminar o pedido */}
            <button onClick={eliminarPedido} className="acao-vermelha">
              Eliminar Pedido
            </button>
          </div>

        </section>
      </main>
    </>
  );
}