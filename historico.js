const SUPABASE_URL = "https://qywyrjcbbxhthepxfdoh.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5d3lyamNiYnhodGhlcHhmZG9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwODI5NDgsImV4cCI6MjA5NTY1ODk0OH0.gNxXCqvDSn8kKGjvJh67OCzqM92K-7Jjhq8IDacEzME";
let supabaseClient; 

document.addEventListener("DOMContentLoaded", async () => {
    try {
        if (window.supabase) {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        }
    } catch (e) {
        console.error("Erro ao iniciar Supabase no histórico", e);
    }

    const listaHistorico = document.getElementById("lista-historico");
    if (!listaHistorico) return;

    //dados do usuário que fez login para sabermos o email
    const dadosUsuario = localStorage.getItem("usuarioLivraria");
    if (!dadosUsuario) {
        listaHistorico.innerHTML = '<p class="carrinho-vazio">Por favor, faça login para ver seu histórico.</p>';
        return;
    }
    const emailUsuario = JSON.parse(dadosUsuario).email;

    listaHistorico.innerHTML = '<p class="carregando">Buscando suas compras no banco de dados...</p>';

try {
        // busca no banco trazendo todos os itens comprados por esse email
        // CORREÇÃO AQUI: Mudamos de 'supabase.from' para 'supabaseClient.from'
        const { data: itensComprados, error } = await supabaseClient
            .from('historico_compras')
            .select('*')
            .eq('usuario_email', emailUsuario)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Erro ao buscar dados:", error);
            listaHistorico.innerHTML = '<p class="aviso-erro">Erro ao carregar dados do banco de dados.</p>';
            return;
        }

        // se retornar vazio
        if (!itensComprados || itensComprados.length === 0) {
            listaHistorico.innerHTML = '<p class="carrinho-vazio">Você ainda não realizou nenhuma compra.</p>';
            return;
        }

        // limpa a mensagem de "carregando" para desenhar o histórico real
        listaHistorico.innerHTML = "";

        const pedidosAgrupados = {};

        itensComprados.forEach(item => {
            const chavePedido = item.created_at; 
            
            if (!pedidosAgrupados[chavePedido]) {
                pedidosAgrupados[chavePedido] = {
                    dataExata: item.created_at,
                    itens: [],
                    valorTotal: 0
                };
            }
            
            // adiciona o livro na lista daquele pedido
            pedidosAgrupados[chavePedido].itens.push(item);
            
            const precoNumerico = parseFloat(item.preco.replace("R$", "").replace(".", "").replace(",", ".").trim()) || 0;
            pedidosAgrupados[chavePedido].valorTotal += precoNumerico;
        });

        Object.values(pedidosAgrupados).forEach(pedido => {
            const blocoCompra = document.createElement("div");
            blocoCompra.classList.add("cartao-livro"); 
            blocoCompra.style.textAlign = "left";
            blocoCompra.style.alignItems = "flex-start";
            blocoCompra.style.marginBottom = "20px";

            const dataFormatada = new Date(pedido.dataExata).toLocaleDateString("pt-BR");
            const numeroPedido = new Date(pedido.dataExata).getTime().toString().slice(-6);

            const itensHTML = pedido.itens.map(item => 
                `<li>${item.titulo} (${item.formato}) ${item.cep ? `- CEP: ${item.cep}` : ''} - <strong>${item.preco}</strong></li>`
            ).join("");

            const totalFormatado = `R$ ${pedido.valorTotal.toFixed(2).replace(".", ",")}`;

            blocoCompra.innerHTML = `
                <h3>Pedido #${numeroPedido}</h3>
                <p><strong>Data da Compra:</strong> ${dataFormatada}</p>
                <hr style="width:100%; margin: 10px 0; border: 1px solid #f1f2f6;">
                <ul style="margin-left: 20px; color: #555;">
                    ${itensHTML}
                </ul>
                <hr style="width:100%; margin: 10px 0; border: 1px solid #f1f2f6;">
                <p style="font-size: 18px; color: #27ae60;"><strong>Total do Pedido:</strong> ${totalFormatado}</p>
            `;
            listaHistorico.appendChild(blocoCompra);
        });

    } catch (erroConexao) {
        console.error("Erro de conexão de rede:", erroConexao);
        listaHistorico.innerHTML = '<p class="aviso-erro">Não foi possível conectar ao banco de dados.</p>';
    }
});