"use client";

// Importa hooks do React
import { useEffect, useState } from "react";

// Importa o dynamic do Next.js para carregar componentes só no browser
import dynamic from "next/dynamic";

// Importa o Header da aplicação
import Header from "@/components/Header";

// Importa o useRouter para poder rederecionar o User para os detalhes do pedido
import { useRouter } from "next/navigation";

// Importa o mapa de forma dinâmica e desativa o SSR.
// Isto é necessário porque bibliotecas de mapas normalmente usam o objeto window,
// que só existe no browser.
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

export default function CriarPedido() {
  // Para rederecionar para detalhes
  const router = useRouter();

  // Guarda um titulo para o pedido
  const [titulo, setTitulo] = useState("");

  // Guarda o nome escrito no input
  const [nomePessoa, setNomePessoa] = useState("");

  // Guarda a descrição escrita na textarea
  const [descricao, setDescricao] = useState("");

  // Guarda a morada
  const [morada, setMorada] = useState("");

  // Guarda o id da freguesia selecionada no select
  const [freguesiaId, setFreguesiaId] = useState("");

  // Guarda as coordenadas escolhidas no mapa.
  // Começa como null porque ainda não há localização selecionada.
  const [coordenadas, setCoordenadas] = useState<Coordenadas | null>(null);

  // Guarda a lista de freguesias recebida da API
  const [freguesias, setFreguesias] = useState<Freguesia[]>([]);

  // Guarda mensagens de sucesso ou erro para mostrar ao utilizador
  const [mensagem, setMensagem] = useState("");

  // Quando a página carrega, vai buscar as freguesias à API
  useEffect(() => {
    async function carregarFreguesias() {
      const res = await fetch("/api/freguesias");
      const data = await res.json();

      // Guarda as freguesias no estado
      setFreguesias(data);
    }

    carregarFreguesias();
  }, []);

  // Tenta obter a freguesia/zona a partir das coordenadas escolhidas no mapa
  async function obterFreguesiaPorCoordenadas(lat: number, lng: number) {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
    );

    // Converte a resposta para objeto JavaScript
    const data = await res.json();

    // Garante que temos um objeto address, mesmo que a API não devolva morada
    const address = data.address || {};

    // Devolve um objeto com o nome da freguesia/zona e concelho
    // nome -> freguesia/zona
    // concelho -> concelho/cidade
    return {
      nome:
        address.suburb ||
        address.village ||
        address.city_district ||
        address.town ||
        "",

      concelho:
        address.city ||
        address.county ||
        address.municipality ||
        "",

      // Morada completa devolvida pelo Nominatim
      morada: data.display_name || "",
  };
  }

  // Quando o utilizador clica no mapa,
  // guarda as coordenadas e tenta preencher automaticamente a freguesia
  async function onSelecionarLocalizacao(posicao: Coordenadas) {
    // Guarda as coordenadas escolhidas no mapa
    setCoordenadas(posicao);

    // Vai buscar freguesia e concelho através das coordenadas
    const freguesiaInfo = await obterFreguesiaPorCoordenadas(
      posicao.lat,
      posicao.lng
    );

    // Garda a morada completa do ponto slecionado
    setMorada(freguesiaInfo.morada);

    // Se a API externa não conseguir descobrir a freguesia ou concelho,
    // mostramos mensagem e deixamos o utilizador escolher manualmente
    if (!freguesiaInfo.nome || !freguesiaInfo.concelho) {
      setMensagem("Não foi possível detetar a freguesia automaticamente.");
      return;
    }

    // Procura se já existe uma freguesia com o mesmo nome e concelho
    const freguesiaEncontrada = freguesias.find(
      (freguesia) =>
        // Evita duplicados
        // Considera igual se o nome for igual e o concelho for igual
        freguesia.nome.toLowerCase() === freguesiaInfo.nome.toLowerCase() &&
        freguesia.concelho.toLowerCase() === freguesiaInfo.concelho.toLowerCase()
    );

    // Se já existir, seleciona essa freguesia no select
    if (freguesiaEncontrada) {
      setFreguesiaId(freguesiaEncontrada._id);
      return;
    }

    // Como a freguesia ainda não existe na base de dados,
    // tentamos obter coordenadas aproximadas da própria freguesia
    const coordenadasFreguesia = await obterCoordenadasDaFreguesia(
      freguesiaInfo.nome,
      freguesiaInfo.concelho
    );

    // Se não existir, cria uma nova freguesia na base de dados
    const res = await fetch("/api/freguesias", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        nome: freguesiaInfo.nome,
        concelho: freguesiaInfo.concelho,

        // Se encontrou coordenadas da freguesia usa essas
        // Caso contrário usa o ponto clicado
        lat: coordenadasFreguesia?.lat ?? posicao.lat,
        lng: coordenadasFreguesia?.lng ?? posicao.lng,
        // Isto faz com que:
        // Se coordenadasFreguesia existir usa coordenadasFreguesia.lat
        // Se não existir então usa posicao.lat e lng,
        // Que é a posição do clique do pedido que foi responsável pela freguesia aparecer na app
        // Que será usado como referência para aquela freguesia
      }),
    });

    // Converte a freguesia criada para objeto JavaScript
    const novaFreguesia = await res.json();

    // Adiciona a nova freguesia à lista que está no state
    setFreguesias((freguesiasAtuais) => [
      ...freguesiasAtuais,
      novaFreguesia,
    ]);

    // Seleciona automaticamente a nova freguesia no select
    setFreguesiaId(novaFreguesia._id);
  }

  // Procura coordenadas aproximadas da freguesia
  async function obterCoordenadasDaFreguesia(
    nome: string,
    concelho: string
  ) {
    // Cria o texto de pesquisa para o Nominatim
    // Exemplo: "São pedro, Ponta Delgada, Açores, Portugal"
    // A pesquisa está limitada a Portugal
    // Para suportar outros países de forma robusta,
    // seria necessário guardar também país/região na base de dados.
    const pesquisa = encodeURIComponent(
      `${nome}, ${concelho}, Portugal`
    );

    // Faz uma pesquisa por texto para tentar encontrar a freguesia/localidade
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${pesquisa}&limit=1`
    );

    // Converte a resposta para objeto JavaScript
    const data = await res.json();

    // Se não encontrou nenhum resultado então devolve null
    if (!data.length) {
      return null;
    }

    return {
      lat: Number(data[0].lat),
      lng: Number(data[0].lon),
    };
  }

  // Função executada quando o formulário é submetido
  async function criarPedido(e: React.FormEvent) {
    // Impede o refresh automático da página
    e.preventDefault();

    // Garante que o utilizador selecionou uma localização no mapa
    if (!coordenadas) {
      setMensagem("Seleciona uma localização no mapa.");
      return;
    }

    // Envia os dados do formulário para a API de pedidos
    const res = await fetch("/api/pedidos", {
      method: "POST",

      // Indica que o corpo do pedido vai em formato JSON
      headers: {
        "Content-Type": "application/json",
      },

      // Converte os dados JavaScript para JSON
      body: JSON.stringify({
        titulo,
        nomePessoa,
        descricao,
        morada,
        freguesiaId,
        lat: coordenadas.lat,
        lng: coordenadas.lng,
      }),
    });

    // Se a API responder com sucesso, limpa o formulário
    if (res.ok) {
      setMensagem("Pedido criado com sucesso!");
      setTitulo("");
      setNomePessoa("");
      setDescricao("");
      setMorada("");
      setFreguesiaId("");
      setCoordenadas(null);

      // Os set acima não são necessários e podem ser removidos
      // Serviam para limpar tudo para um pedido novo
      // Converte a resposta da API para obter o pedido criado
      const pedidoCriado = await res.json();

      // Redireciona para a página de detalhes desse pedido
      router.push(`/pedidos/${pedidoCriado._id}`);
    } else {
      // Caso contrário, mostra uma mensagem de erro
      setMensagem("Erro ao criar pedido.");
    }
  }

  return (
    <>

      <main className="criar-pedido-page">
        <h1 className="morada-box">Criar Pedido</h1>

        {/* Formulário para criar um novo pedido */}
        <form onSubmit={criarPedido} className="criar-pedido-form">
          <label>Titulo:</label>

          {/* Input controlado pelo estado titulo*/}
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Titulo do pedido"
            required
          />

        <label>Nome:</label>
          {/* Input controlado pelo estado nomePessoa */}
          <input
            value={nomePessoa}
            onChange={(e) => setNomePessoa(e.target.value)}
            placeholder="Nome da pessoa"
            required
          />

          <label>Descrição:</label>

          {/* Textarea controlada pelo estado descricao */}
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descreve o que precisas"
            required
          />

          <label>Freguesia:</label>

          {/* Select controlado pelo estado freguesiaId */}
          <select
            value={freguesiaId}
            onChange={(e) => setFreguesiaId(e.target.value)}
            required
          >
            <option value="">Seleciona uma freguesia</option>

            {/* Cria uma opção para cada freguesia recebida da API */}
            {freguesias.map((freguesia) => (
              <option key={freguesia._id} value={freguesia._id}>
                {freguesia.nome} - {freguesia.concelho}
              </option>
            ))}
          </select>

          <label>Seleciona a localização no mapa:</label>
          <div className="mapa-container">
            <div className="mapa-morada">
            {/* Mostra a morada obtida automaticamente */}
            {morada && (
              <>
                <label>Morada detetada:</label>
                <p className="morada-grande">{morada}</p>
              </>
            )}
            {/* 
              Mostra latitude e longitude selecionadas
            */}
            {coordenadas && (
              <div className="coordenadas-box">
                <p>
                  <strong>Latitude:</strong> {coordenadas.lat}
                </p>

                <p>
                  <strong>Longitude:</strong> {coordenadas.lng}
                </p>
              </div>
            )}
            </div>
            <div className="mapa-box">
              {/* 
                Componente do mapa.
                Quando o utilizador escolhe um ponto no mapa,
                o componente chama setCoordenadas e guarda lat/lng no estado.
              */}
              <MapaSelecionavel
                posicaoInicial={coordenadas}
                onSelecionarLocalizacao={onSelecionarLocalizacao} />
            </div>
          </div>

          {/* Botão que submete o formulário */}
          <button type="submit" className="criar-pedido-submit">
            Criar Pedido
          </button>
        </form>

        {/* Mostra mensagem de sucesso ou erro, se existir */}
        {mensagem && <p className="mensagem-pedido">{mensagem}</p>}
      </main>
    </>
  );
}