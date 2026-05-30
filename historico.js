// configuração inicial do Supabase no historico.js
const SUPABASE_URL = "URL_AQUI";
const SUPABASE_KEY = "CHAVE_ANON_AQUI";

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener("DOMContentLoaded", () => {
    const listaHistorico = document.getElementById("lista-historico");
    if (!listaHistorico) return;

    // Recupera o histórico do localStorage
    const historico = JSON.parse(localStorage.getItem("historicoCompras")) || [];

    if (historico.length === 0) {
        listaHistorico.innerHTML = '<p class="carrinho-vazio">Você ainda não realizou nenhuma compra.</p>';
        return;
    }

    // Renderiza cada compra realizada
    historico.forEach(compra => {
        const blocoCompra = document.createElement("div");
        blocoCompra.classList.add("cartao-livro"); // Reaproveita seus cards para manter o padrão
        blocoCompra.style.textAlign = "left";
        blocoCompra.style.alignItems = "flex-start";
        blocoCompra.style.marginBottom = "20px";

        // Gera a lista de itens que estavam dentro daquela compra específica
        const itensHTML = compra.itens.map(item => 
            `<li>${item.titulo} (${item.formato}) - <strong>${item.preco}</strong></li>`
        ).join("");

        blocoCompra.innerHTML = `
            <h3>Pedido #${compra.id.toString().slice(-6)}</h3>
            <p><strong>Data da Compra:</strong> ${compra.data}</p>
            <hr style="width:100%; margin: 10px 0; border: 1px solid #f1f2f6;">
            <ul style="margin-left: 20px; color: #555;">
                ${itensHTML}
            </ul>
            <hr style="width:100%; margin: 10px 0; border: 1px solid #f1f2f6;">
            <p style="font-size: 18px; color: #27ae60;"><strong>Total:</strong> ${compra.total}</p>
        `;
        listaHistorico.appendChild(blocoCompra);
    });
});