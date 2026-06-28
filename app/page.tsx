"use client";

// Importa hooks do React
import { useEffect, useState } from "react";

// Importa Link para navegação entre páginas
import Link from "next/link";

// Importa o componente Header
import Header from "@/components/Header";

// Importa o componente dynamic, que depois vai ser utilizado na nova implementação do mapa
import dynamic from "next/dynamic";

// Carrega o componente do mapa apenas no browser.
// O Leaflet usa objetos do browser, como window,
// por isso desativamos o Server Side Rendering.
const MapaSelecionavel = dynamic(
  () => import("@/components/MapaSelecionavel"),
  { ssr: false}
)
// ssr : false -> não renderiza no servidor
// () => import(...) -> só importar este componente quando for necessário no browser

// Define o formato de uma freguesia
type Freguesia = {
  _id: string;
  nome: string;
  concelho: string;
};

// Define o formato de um pedido
type Pedido = {
  _id: string;
  titulo: string;
  nomePessoa: string;
  descricao: string;

// Adiciona as coordenadas ao formato do pedido para efeitos de filtrar por proximidade
  coordenadas: {
    lat: number;
    lng: number;
  }

  // Cada pedido tem associada uma freguesia
  freguesia: Freguesia;

  // Estado do pedido (ativo, em progresso, concluído)
  estado: string;
};

// Função com a formula para calcular a distância entre duas coordenadas.
function calcularDistanciaKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
) {
  const R = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export default function Home() {
  // Guarda todos os pedidos recebidos da API
  const [pedidos, setPedidos] = useState<Pedido[]>([]);

  // Guarda todas as freguesias recebidas da API
  const [freguesias, setFreguesias] = useState<Freguesia[]>([]);

  // Guarda a freguesia escolhida no filtro
  const [freguesiaSelecionada, setFreguesiaSelecionada] = useState("");

  // Guarda o texto pesquisado
  const [pesquisa, setPesquisa] = useState("");

  // Guarda se a área dos filtros está aberta ou fechada
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // states para filtro por proximidade
  // Guarda se o filtro por proximidade está ativo
  const [usarFiltroProximidade, setUsarFiltroProximidade] = useState(false);
  // useState false pois o filtro começa desligado

  // Guarda a localização escolhida pelo utilizador para filtrar por distância
  const [localizacaoReferencia, setLocalizacaoReferencia] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  // null pois no inicio não tem localização escolhida

  // Guarda o raio escolhido em quilómetros
  const [raioKm, setRaioKm] = useState(2);
  // useState 2 pois o raio começa a 2 km

  // Executa quando a página carrega
  useEffect(() => {
    async function carregarDados() {
      // Vai buscar os pedidos à API
      const resPedidos = await fetch("/api/pedidos");

      // Converte a resposta para JSON
      const dataPedidos = await resPedidos.json();

      // Guarda os pedidos no estado
      setPedidos(dataPedidos);

      // Tenta carregar as freguesias
      try {
        const resFreguesias = await fetch("/api/freguesias");

        // Converte resposta para JSON
        const dataFreguesias = await resFreguesias.json();

        // Guarda freguesias no estado
        setFreguesias(dataFreguesias);
      } catch {
        // Se houver erro, guarda array vazio
        setFreguesias([]);
      }
    }

    carregarDados();
  }, []);

  // Filtra apenas pedidos ativos
  const pedidosAtivos = pedidos.filter(
    (pedido) => pedido.estado === "ativo"
  );

  // Se existir uma freguesia selecionada,
  // filtra também por freguesia.
  // Caso contrário mostra todos os pedidos ativos.
  const pedidosFiltrados = pedidosAtivos.filter((pedido) => {
    const correspondeFreguesia =
      !freguesiaSelecionada ||
      pedido.freguesia._id === freguesiaSelecionada;

    const correspondePesquisa =
      pedido.titulo.toLowerCase().includes(pesquisa.toLowerCase()) ||
      pedido.nomePessoa.toLowerCase().includes(pesquisa.toLowerCase()) ||
      pedido.descricao.toLowerCase().includes(pesquisa.toLowerCase());

    // Verifica se o pedido respeita o filtro por proximidade
    const correspondeProximidade = 
      // Se o filtro por proximidade estiver desligado,
      // Todos os pedidos passam neste filtro
      !usarFiltroProximidade ||
    
      // Seaidna não foi escolhido uma localização de referência,
      // também não bloqueia nenhum pedido
      !localizacaoReferencia ||
      // ! = "não"
      // || = ou

      // Se o filtro estiver ativo e existir localização,
      // calculamos a distância entre a localização escolhida
      // e a localização do pedido
      calcularDistanciaKm(
        localizacaoReferencia.lat,
        localizacaoReferencia.lng,
        pedido.coordenadas.lat,
        pedido.coordenadas.lng
      ) <= raioKm;

    // O pedido só aparece se passar nos 3 filtros ao mesmo tempo
    return (
      correspondeFreguesia && 
      correspondePesquisa &&
      correspondeProximidade
    );
  });

  return (
    <>
      {/* Cabeçalho da aplicação */}
      <Header />

      <main className="home-page">
        {/* Topo da página */}
        <section className="home-top">
          <div className="morada-box">Feed de Pedidos</div>

          {/* Botão para criar novo pedido */}
          <Link href="/criar-pedido" className="criar-pedido-btn">
            Criar Pedido
          </Link>
        </section>

        {/* Barra de pesquisa */}
        <section className="filtro-box">
          <label>Pesquisar pedido</label>
          <input
          type="text"
          placeholder="Pesquisar por título, nome ou descrição..."
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
          />
          {/* Botão para mostrar / esconder filtros */}
          <button
            type="button"
            className="filtros-toggle-btn"
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
          >
            {mostrarFiltros ? "Esconder filtros" : "Filtros"}
          </button>
        </section>

        {mostrarFiltros && (
          <div className="filtros-expandidos">
            {/* Só mostra o filtro se existirem freguesias carregadas*/}
            {freguesias.length > 0 && (
              <section className="filtro-box">
                <label>Filtrar por freguesia:</label>

                <select
                  value={freguesiaSelecionada}
                  onChange={(e) => setFreguesiaSelecionada(e.target.value)}
                >
                  <option value="">Todas as freguesias</option>

                  {freguesias.map((freguesia) => (
                    <option key={freguesia._id} value={freguesia._id}>
                      {freguesia.nome} - {freguesia.concelho}
                    </option>
                  ))}
                </select>
              </section>
            )}

            {/* Filtro por proximidade */}
            <section className="filtro-box">
              <label>Filtrar por proximidade</label>

              <button
                type="button"
                className="criar-pedido-submit"
                onClick={() =>
                  setUsarFiltroProximidade(!usarFiltroProximidade)
                }
              >
                {usarFiltroProximidade
                  ? "Desativar filtro por proximidade"
                  : "Ativar filtro por proximidade"}
              </button>

              {usarFiltroProximidade && (
                <>
                  <label>Raio</label>

                  <select
                    value={raioKm}
                    onChange={(e) => setRaioKm(Number(e.target.value))}
                  >
                    <option value={1}>1 km</option>
                    <option value={2}>2 km</option>
                    <option value={5}>5 km</option>
                    <option value={10}>10 km</option>
                  </select>

                  <p>Seleciona no mapa a tua localização de referência</p>

                  <div className="mapa-box">
                    <MapaSelecionavel
                      posicaoInicial={localizacaoReferencia}
                      onSelecionarLocalizacao={setLocalizacaoReferencia}
                    />
                  </div>

                  {localizacaoReferencia && (
                    <p>
                      Localização selecionada: {localizacaoReferencia.lat},{" "}
                      {localizacaoReferencia.lng}
                    </p>
                  )}
                </>
              )}
            </section>
                  </div>
                )}

        {/* Lista de pedidos */}
        <section className="pedidos-lista">
          {/* 
            Caso não existam pedidos para mostrar,
            aparece esta mensagem
          */}
          {pedidosFiltrados.length === 0 && (
            //<p>Não existem pedidos ativos para esta freguesia.</p>
            <p>Não existem pedidos ativos.</p>
          )}

          {/* 
            Percorre todos os pedidos filtrados
            e cria um card para cada um
          */}
          {pedidosFiltrados.map((pedido) => (
            <Link
              key={pedido._id}
              href={`/pedidos/${pedido._id}`}
              className="pedido-card"
            >
              {/* Titulo do pedido */}
              <h2>{pedido.titulo}</h2>

              {/* Nome da pessoa */}
              <p>Pedido por: {pedido.nomePessoa}</p>

              {/* Descrição */}
              <p>{pedido.descricao}</p>

              {/* Informação da freguesia */}
              <p>
                {pedido.freguesia.nome} - {pedido.freguesia.concelho}
              </p>
            </Link>
          ))}
        </section>
      </main>
    </>
  );
}