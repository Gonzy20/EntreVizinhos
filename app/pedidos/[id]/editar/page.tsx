"use client";

// Importa hooks do React
import { useEffect, useState } from "react";

// Importa o dynamic do Next.js para carregar componentes só no browser
import dynamic from "next/dynamic";

// Importa hooks do Next.js
import { useParams, useRouter } from "next/navigation";

// Importa o Header da aplicação
import Header from "@/components/Header";

// Importa o mapa de forma dinâmica e desativa o SSR
const MapaSelecionavel = dynamic(
  () => import("@/components/MapaSelecionavel"),
  { ssr: false }
);

// Define o formato de uma freguesia
type Freguesia = {
  _id: string;
  nome: string;
  concelho: string;
};

// Define o formato das coordenadas escolhidas no mapa
type Coordenadas = {
  lat: number;
  lng: number;
};

// Define o formato de um pedido
type Pedido = {
  _id: string;
  titulo: string;
  nomePessoa: string;
  descricao: string;
  morada: string;
  estado: string;

  freguesia: {
    _id: string;
    nome: string;
    concelho: string;
  };

  coordenadas: Coordenadas;
};

export default function EditarPedido() {
  // Vai buscar o id do pedido através do URL
  const params = useParams();

  // Permite navegar para outra página depois de guardar
  const router = useRouter();

  // Estados do formulário
  const [titulo, setTitulo] = useState("");
  const [nomePessoa, setNomePessoa] = useState("");
  const [descricao, setDescricao] = useState("");
  const [freguesiaId, setFreguesiaId] = useState("");
  const [estado, setEstado] = useState("");

  // Guarda as coordenadas atuais ou novas
  const [coordenadas, setCoordenadas] = useState<Coordenadas | null>(null);

  // Guarda as freguesias disponíveis
  const [freguesias, setFreguesias] = useState<Freguesia[]>([]);

  // Guarda a morada
  const [morada, setMorada] = useState("");

  // Mensagem de sucesso ou erro
  const [mensagem, setMensagem] = useState("");

  // Carrega pedido e freguesias quando a página abre
  useEffect(() => {
    async function carregarDados() {
      // Vai buscar todos os pedidos
      const resPedidos = await fetch("/api/pedidos");
      const dataPedidos = await resPedidos.json();

      // Procura o pedido que corresponde ao id do URL
      const pedidoEncontrado = dataPedidos.find(
        (p: Pedido) => p._id === params.id
      );

      // Se encontrar, preenche o formulário
      if (pedidoEncontrado) {
        setTitulo(pedidoEncontrado.titulo);
        setNomePessoa(pedidoEncontrado.nomePessoa);
        setDescricao(pedidoEncontrado.descricao);
        setFreguesiaId(pedidoEncontrado.freguesia._id);
        setEstado(pedidoEncontrado.estado);
        setCoordenadas(pedidoEncontrado.coordenadas);
        setMorada(pedidoEncontrado.morada || "");
      }

      // Vai buscar as freguesias
      const resFreguesias = await fetch("/api/freguesias");
      const dataFreguesias = await resFreguesias.json();

      // Guarda as freguesias no estado
      setFreguesias(dataFreguesias);
    }

    carregarDados();
  }, [params.id]);

  // Tenta obter a freguesia/zona a partir das coordenadas escolhidas no mapa
  async function obterFreguesiaPorCoordenadas(lat: number, lng: number) {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
    );

    const data = await res.json();

    const address = data.address || {};

    return {
      nome:
        address.suburb ||
        address.village ||
        address.city_district ||
        address.town ||
        address.municipality ||
        "",

      concelho:
        address.city ||
        address.county ||
        address.municipality ||
        "",
      
      // Guarda a morada completa devolvida pelo Nominatim
      morada: data.display_name || "",
  };
  }

  // Procura coordenadas aproximadas da freguesia através do nome e concelho
  async function obterCoordenadasDaFreguesia(nome: string, concelho: string) {
    const pesquisa = encodeURIComponent(`${nome}, ${concelho}, Portugal`);

    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${pesquisa}&limit=1`);

    const data = await res.json();

    if (!data.length) {
      return null;
    }

    return {
      lat: Number(data[0].lat),
      lng: Number(data[0].lon),
    };
  }

  // Quando o utilizador clica no mapa,
  // guarda as coordenadas e tenta preencher automaticamente a freguesia
  async function onSelecionarLocalizacao(posicao: Coordenadas) {
    setCoordenadas(posicao);

    const freguesiaInfo = await obterFreguesiaPorCoordenadas(
      posicao.lat,
      posicao.lng
    );

    // Guarda automaticamente a morada do ponto escolhido
    setMorada(freguesiaInfo.morada);

    // Se não conseguir obter nome ou concelho, não cria freguesia automaticamente
    if (!freguesiaInfo.nome || !freguesiaInfo.concelho) {
      setMensagem("Não foi possível detetar a freguesia automaticamente.");
      return;
    }

    // Procura se já existe uma freguesia com o mesmo nome e concelho
    const freguesiaEncontrada = freguesias.find((freguesia) =>
      freguesia.nome.toLowerCase() === freguesiaInfo.nome.toLowerCase() &&
      freguesia.concelho.toLowerCase() === freguesiaInfo.concelho.toLowerCase()
    );
    // Se já existir, usa essa freguesia
    if (freguesiaEncontrada) {
      setFreguesiaId(freguesiaEncontrada._id);
      return;
    }

    // Se não existir, tenta obter coordenadas representativas da freguesia
    const coordenadasFreguesia = await obterCoordenadasDaFreguesia(
      freguesiaInfo.nome,
      freguesiaInfo.concelho
    );

    // Cria a nova freguesia na base de dados
    const res = await fetch("/api/freguesias", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nome: freguesiaInfo.nome,
        concelho:freguesiaInfo.concelho,

        // Usa coordenadas da freguesia se existirem,
        // senão usa o ponto clicado como referência
        lat: coordenadasFreguesia?.lat ?? posicao.lat,
        lng: coordenadasFreguesia?.lng ?? posicao.lng,
      }),
    });

    const novaFreguesia = await res.json();

    // Adiciona a nova freguesia ao select
    setFreguesias((freguesiasAtuais) => [
      ...freguesiasAtuais,
      novaFreguesia,
    ]);

    // Seleciona automaticamente a nova freguesia
    setFreguesiaId(novaFreguesia._id);
  }

  // Função executada ao submeter o formulário
  async function editarPedido(e: React.FormEvent) {
    // Impede refresh da página
    e.preventDefault();

    // Garante que existe localização
    if (!coordenadas) {
      setMensagem("Seleciona uma localização no mapa.");
      return;
    }

    // Envia os dados atualizados para a API
    const res = await fetch(`/api/pedidos/${params.id}`, {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        titulo,
        nomePessoa,
        descricao,
        morada,
        freguesiaId,
        estado,
        lat: coordenadas.lat,
        lng: coordenadas.lng,
      }),
    });

    // Se correr bem, volta aos detalhes do pedido
    if (res.ok) {
      router.push(`/pedidos/${params.id}`);
    } else {
      setMensagem("Erro ao editar pedido.");
    }
  }

  return (
    <>
      <main className="criar-pedido-page">
        <h1>Editar Pedido</h1>

        {/* Formulário para editar o pedido */}
        <form onSubmit={editarPedido} className="criar-pedido-form">
          <label>Título:</label>

          {/* Input controlado pelo estado titulo */}
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
          />

          <label>Nome:</label>

          {/* Input controlado pelo estado nomePessoa */}
          <input
            value={nomePessoa}
            onChange={(e) => setNomePessoa(e.target.value)}
            required
          />

          <label>Descrição:</label>

          {/* Textarea controlada pelo estado descricao */}
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            required
          />

          <label>Freguesia:</label>

          {/* Select controlado pelo estado freguesiaId */}
          <select
            value={freguesiaId}
            onChange={(e) => setFreguesiaId(e.target.value)}
            required
          >
            <option value="">Seleciona uma freguesia:</option>

            {/* Cria uma opção para cada freguesia recebida da API */}
            {freguesias.map((freguesia) => (
              <option key={freguesia._id} value={freguesia._id}>
                {freguesia.nome} - {freguesia.concelho}
              </option>
            ))}
          </select>

          <label>Estado:</label>

          {/* Select para editar o estado atual do pedido */}
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            required
          >
            <option value="ativo">Ativo</option>
            <option value="em_progresso">Em progresso</option>
            <option value="concluido">Concluído</option>
          </select>
          <div className="mapa-container">
            <div className="mapa-morada">
              <label>Seleciona a nova localização no mapa</label>
              {/* Mostra a morada */}
              {morada && (
                <>
                  <label>Morada detetada:</label>
                  <p className="morada-grande">{morada}</p>
                </>
              )}
            </div>
              <div className="mapa-box">
                {/* 
                  Mapa para escolher uma nova localização.
                  Ao clicar no mapa, atualiza as coordenadas do pedido.
                */}
                <MapaSelecionavel
                    posicaoInicial={coordenadas}
                    onSelecionarLocalizacao={onSelecionarLocalizacao}
                    />
              </div>
          </div>

          {/* Botão que submete o formulário */}
          <button type="submit" className="criar-pedido-submit">
            Guardar alterações
          </button>
        </form>

        {/* Mostra mensagem de erro, se existir */}
        {mensagem && <p className="mensagem-pedido">{mensagem}</p>}
      </main>
    </>
  );
}