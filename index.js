const { createBot } = require('bedrockflayer');

const HOST = 'minefriends_.aternos.me';
const PORT = 37010;
const BOT_NAME = 'HERMESBOOT';

function iniciarHermes() {
    console.log('');
    console.log('=================================');
    console.log(' HERMESBOOT INICIANDO...');
    console.log('=================================');
    console.log('');

    const bot = createBot({
        host: HOST,
        port: PORT,
        username: BOT_NAME,
        offline: true,

        // Configuração que já funcionou
        skipPing: true,
        physicsEnabled: false
    });

    let cicloMovimento = null;
    let movimentoAtivo = false;
    let casaConstruida = false;

    // ==========================================
    // PARAR MOVIMENTO
    // ==========================================

    function pararMovimento() {
        try {
            bot.setControlState('forward', false);
            bot.setControlState('back', false);
            bot.setControlState('left', false);
            bot.setControlState('right', false);
        } catch (err) {
            console.log('[HERMES] Erro ao parar:', err.message);
        }

        movimentoAtivo = false;
    }

    // ==========================================
    // ANDAR PARA FRENTE
    // ==========================================

    function andarFrente() {
        if (movimentoAtivo) return;

        movimentoAtivo = true;

        console.log('[HERMES AFK] Andando para frente...');

        try {
            bot.setControlState('back', false);
            bot.setControlState('forward', true);
        } catch (err) {
            console.log('[HERMES] Erro:', err.message);
        }

        setTimeout(() => {
            pararMovimento();

            console.log('[HERMES AFK] Pausando...');

            setTimeout(() => {
                andarTras();
            }, 3000);

        }, 10000);
    }

    // ==========================================
    // ANDAR PARA TRÁS
    // ==========================================

    function andarTras() {
        if (movimentoAtivo) return;

        movimentoAtivo = true;

        console.log('[HERMES AFK] Andando para trás...');

        try {
            bot.setControlState('forward', false);
            bot.setControlState('back', true);
        } catch (err) {
            console.log('[HERMES] Erro:', err.message);
        }

        setTimeout(() => {
            pararMovimento();

            console.log('[HERMES AFK] Pausando...');

            setTimeout(() => {
                andarFrente();
            }, 3000);

        }, 10000);
    }

    // ==========================================
    // VERIFICAR SE O LOCAL ESTÁ LIVRE
    // ==========================================

    function localLivre(x, y, z) {
        try {
            for (let dx = -4; dx <= 4; dx++) {
                for (let dz = -4; dz <= 4; dz++) {
                    for (let dy = 0; dy <= 5; dy++) {

                        const bloco = bot.blockAt({
                            x: x + dx,
                            y: y + dy,
                            z: z + dz
                        });

                        if (!bloco) continue;

                        const nome = bloco.name;

                        // Ignora ar e blocos de ar
                        if (
                            nome !== 'air' &&
                            nome !== 'cave_air' &&
                            nome !== 'void_air'
                        ) {
                            return false;
                        }
                    }
                }
            }

            return true;

        } catch (err) {
            console.log('[HERMES] Erro verificando terreno:', err.message);
            return false;
        }
    }

    // ==========================================
    // CONSTRUIR CASA
    // ==========================================

    async function construirCasa() {

        if (casaConstruida) {
            console.log('[HERMES CASA] A casa já foi construída.');
            return;
        }

        if (!bot.entity || !bot.entity.position) {
            console.log('[HERMES CASA] Posição do bot ainda não disponível.');
            return;
        }

        console.log('');
        console.log('=================================');
        console.log(' HERMES PROCURANDO TERRENO');
        console.log('=================================');
        console.log('');

        const pos = bot.entity.position;

        /*
         * A casa será construída 8 blocos à frente
         * da posição inicial do HERMES.
         */

        const x = Math.floor(pos.x) + 8;
        const y = Math.floor(pos.y);
        const z = Math.floor(pos.z);

        console.log(
            `[HERMES CASA] Área escolhida: X=${x} Y=${y} Z=${z}`
        );

        // Verifica se o espaço está livre
        if (!localLivre(x, y, z)) {

            console.log('');
            console.log('[HERMES CASA] O local não está livre.');
            console.log('[HERMES CASA] NÃO vou construir aqui.');
            console.log('');
            return;
        }

        console.log('[HERMES CASA] Local livre!');
        console.log('[HERMES CASA] Começando construção...');

        /*
         * IMPORTANTE:
         *
         * Esta versão usa blocos que o bot precisa
         * ter no inventário.
         *
         * Para teste, recomendamos colocar o HERMES
         * no CRIATIVO e dar blocos para ele.
         */

        try {

            // ======================================
            // TENTAR PEGAR BLOCO DE CONSTRUÇÃO
            // ======================================

            const bloco = bot.inventory.items().find(item => {
                return (
                    item.name === 'oak_planks' ||
                    item.name === 'birch_planks' ||
                    item.name === 'stone' ||
                    item.name === 'cobblestone'
                );
            });

            if (!bloco) {
                console.log('');
                console.log('[HERMES CASA] Não encontrei blocos.');
                console.log('[HERMES CASA] Coloque blocos no inventário.');
                console.log('');
                return;
            }

            console.log(
                `[HERMES CASA] Usando: ${bloco.name}`
            );

            await bot.equip(bloco, 'hand');

            // ======================================
            // FUNÇÃO PARA COLOCAR BLOCO
            // ======================================

            async function colocar(xb, yb, zb) {

                const alvo = bot.blockAt({
                    x: xb,
                    y: yb,
                    z: zb
                });

                if (!alvo) return;

                // Só coloca se for ar
                if (
                    alvo.name !== 'air' &&
                    alvo.name !== 'cave_air' &&
                    alvo.name !== 'void_air'
                ) {
                    return;
                }

                const referencia = bot.blockAt({
                    x: xb,
                    y: yb - 1,
                    z: zb
                });

                if (!referencia) return;

                try {
                    await bot.placeBlock(
                        referencia,
                        { x: 0, y: 1, z: 0 }
                    );
                } catch (err) {
                    console.log(
                        `[HERMES CASA] Não consegui colocar ${xb},${yb},${zb}`
                    );
                }
            }

            // ======================================
            // CHÃO 7x7
            // ======================================

            console.log('[HERMES CASA] Construindo chão...');

            for (let dx = -3; dx <= 3; dx++) {
                for (let dz = -3; dz <= 3; dz++) {

                    await colocar(
                        x + dx,
                        y,
                        z + dz
                    );
                }
            }

            // ======================================
            // PAREDES
            // ======================================

            console.log('[HERMES CASA] Construindo paredes...');

            for (let altura = 1; altura <= 3; altura++) {

                for (let dx = -3; dx <= 3; dx++) {

                    await colocar(
                        x + dx,
                        y + altura,
                        z - 3
                    );

                    await colocar(
                        x + dx,
                        y + altura,
                        z + 3
                    );
                }

                for (let dz = -3; dz <= 3; dz++) {

                    await colocar(
                        x - 3,
                        y + altura,
                        z + dz
                    );

                    await colocar(
                        x + 3,
                        y + altura,
                        z + dz
                    );
                }
            }

            // ======================================
            // PAREDE DA FRENTE COM ESPAÇO DA PORTA
            // ======================================

            // Tenta deixar espaço central para porta
            for (let altura = 1; altura <= 2; altura++) {

                const portaX = x;

                const blocoPorta = bot.blockAt({
                    x: portaX,
                    y: y + altura,
                    z: z - 3
                });

                // Não coloca nada no espaço da porta
                if (
                    blocoPorta &&
                    (
                        blocoPorta.name === 'air' ||
                        blocoPorta.name === 'cave_air' ||
                        blocoPorta.name === 'void_air'
                    )
                ) {
                    continue;
                }
            }

            // ======================================
            // TETO
            // ======================================

            console.log('[HERMES CASA] Construindo teto...');

            for (let dx = -3; dx <= 3; dx++) {
                for (let dz = -3; dz <= 3; dz++) {

                    await colocar(
                        x + dx,
                        y + 4,
                        z + dz
                    );
                }
            }

            // ======================================
            // FINAL
            // ======================================

            casaConstruida = true;

            console.log('');
            console.log('=================================');
            console.log(' HERMES CASA CONCLUÍDA!');
            console.log('=================================');
            console.log('');
            console.log(
                `[HERMES CASA] Local: ${x}, ${y}, ${z}`
            );
            console.log('');

            try {
                bot.chat('Minha casa está pronta!');
            } catch (err) {}

        } catch (err) {

            console.log('');
            console.log('=================================');
            console.log(' ERRO NA CONSTRUÇÃO');
            console.log('=================================');
            console.log(err);
            console.log('');
        }
    }

    // ==========================================
    // BOT ENTROU
    // ==========================================

    bot.on('spawn', () => {

        console.log('');
        console.log('=================================');
        console.log(' HERMESBOOT ENTROU NO SERVIDOR!');
        console.log('=================================');
        console.log('');

        console.log('[HERMES] Modo AFK iniciado!');
        console.log('');

        // Começa AFK
        andarFrente();

        // Constrói a casa depois de alguns segundos
        setTimeout(() => {

            pararMovimento();

            construirCasa();

        }, 5000);

        // Mensagem no console a cada 30 segundos
        cicloMovimento = setInterval(() => {

            console.log(
                '[HERMES] AFK ativo - conexão funcionando.'
            );

        }, 30000);
    });

    // ==========================================
    // CHAT
    // ==========================================

    bot.on('chat', (username, message) => {

        console.log(`[CHAT] <${username}> ${message}`);

        if (message === '!casa') {

            console.log(
                '[HERMES] Comando !casa recebido.'
            );

            construirCasa();
        }

        if (message === '!status') {

            try {
                bot.chat(
                    'HERMES online e funcionando!'
                );
            } catch (err) {}
        }
    });

    // ==========================================
    // MORTE
    // ==========================================

    bot.on('death', () => {

        console.log(
            '[HERMES] HERMES morreu.'
        );
    });

    // ==========================================
    // EXPULSO
    // ==========================================

    bot.on('kicked', (reason) => {

        console.log('');
        console.log('=================================');
        console.log('[HERMES] FOI EXPULSO!');
        console.log('=================================');
        console.log('Motivo:', reason);
        console.log('');
    });

    // ==========================================
    // ERRO
    // ==========================================

    bot.on('error', (err) => {

        console.log('');
        console.log('=================================');
        console.log('[HERMES] ERRO');
        console.log('=================================');
        console.log(err);
        console.log('');
    });

    // ==========================================
    // DESCONECTOU
    // ==========================================

    bot.on('end', () => {

        console.log('');
        console.log('=================================');
        console.log('[HERMES] CONEXÃO ENCERRADA');
        console.log('=================================');
        console.log('[HERMES] Reconectando em 10 segundos...');
        console.log('');

        if (cicloMovimento) {
            clearInterval(cicloMovimento);
            cicloMovimento = null;
        }

        setTimeout(() => {
            iniciarHermes();
        }, 10000);
    });
}

// ==========================================
// INICIAR
// ==========================================

iniciarHermes();