const { createBot } = require('bedrockflayer');

const HOST = 'minefriends_.aternos.me';
const PORT = 37010;
const BOT_NAME = 'HERMESBOOT';

const TEMPO_RECONEXAO = 10000; // 10 segundos
const TIMEOUT_CONEXAO = 20000; // 20 segundos

let botAtual = null;
let reconectando = false;
let conectado = false;
let movimentoAtivo = false;
let timerMovimento = null;
let timerPausa = null;
let timerTimeout = null;

// =====================================================
// LOG
// =====================================================

function log(mensagem) {
    console.log(`[HERMES] ${mensagem}`);
}

// =====================================================
// PARAR MOVIMENTO
// =====================================================

function pararMovimento() {
    movimentoAtivo = false;

    if (timerMovimento) {
        clearTimeout(timerMovimento);
        timerMovimento = null;
    }

    if (timerPausa) {
        clearTimeout(timerPausa);
        timerPausa = null;
    }

    if (!botAtual) return;

    try {
        botAtual.setControlState('forward', false);
        botAtual.setControlState('back', false);
        botAtual.setControlState('left', false);
        botAtual.setControlState('right', false);
    } catch (err) {
        log(`Erro ao parar movimento: ${err.message}`);
    }
}

// =====================================================
// ANDAR PARA FRENTE
// =====================================================

function andarFrente() {
    if (!botAtual || !conectado || movimentoAtivo) return;

    movimentoAtivo = true;

    log('AFK: andando para frente...');

    try {
        botAtual.setControlState('back', false);
        botAtual.setControlState('forward', true);
    } catch (err) {
        log(`Erro ao andar: ${err.message}`);
    }

    timerMovimento = setTimeout(() => {
        pararMovimento();

        if (!conectado) return;

        log('AFK: pausando por 3 segundos...');

        timerPausa = setTimeout(() => {
            andarTras();
        }, 3000);
    }, 10000);
}

// =====================================================
// ANDAR PARA TRÁS
// =====================================================

function andarTras() {
    if (!botAtual || !conectado || movimentoAtivo) return;

    movimentoAtivo = true;

    log('AFK: andando para trás...');

    try {
        botAtual.setControlState('forward', false);
        botAtual.setControlState('back', true);
    } catch (err) {
        log(`Erro ao andar: ${err.message}`);
    }

    timerMovimento = setTimeout(() => {
        pararMovimento();

        if (!conectado) return;

        log('AFK: pausando por 3 segundos...');

        timerPausa = setTimeout(() => {
            andarFrente();
        }, 3000);
    }, 10000);
}

// =====================================================
// AGENDAR RECONEXÃO
// =====================================================

function agendarReconexao() {
    if (reconectando) return;

    reconectando = true;
    conectado = false;

    pararMovimento();

    log(`Tentando novamente em ${TEMPO_RECONEXAO / 1000} segundos...`);

    setTimeout(() => {
        reconectando = false;
        iniciarHermes();
    }, TEMPO_RECONEXAO);
}

// =====================================================
// INICIAR HERMES
// =====================================================

function iniciarHermes() {

    console.log('');
    console.log('=================================');
    console.log(' HERMESBOOT INICIANDO...');
    console.log('=================================');
    console.log('');

    conectado = false;

    let bot;

    try {
        bot = createBot({
            host: HOST,
            port: PORT,
            username: BOT_NAME,
            offline: true,

            skipPing: true,
            physicsEnabled: false
        });

        botAtual = bot;

    } catch (err) {
        log(`Falha ao criar conexão: ${err.message}`);
        agendarReconexao();
        return;
    }

    // =================================================
    // TIMEOUT DA TENTATIVA DE CONEXÃO
    // =================================================

    timerTimeout = setTimeout(() => {

        if (!conectado) {

            log('A tentativa de conexão demorou demais.');

            try {
                if (bot && typeof bot.end === 'function') {
                    bot.end();
                }
            } catch (err) {
                // ignora erro ao encerrar
            }

            agendarReconexao();
        }

    }, TIMEOUT_CONEXAO);

    // =================================================
    // ENTROU NO SERVIDOR
    // =================================================

    bot.on('spawn', () => {

        if (timerTimeout) {
            clearTimeout(timerTimeout);
            timerTimeout = null;
        }

        conectado = true;
        reconectando = false;

        console.log('');
        console.log('=================================');
        console.log(' HERMESBOOT ENTROU NO SERVIDOR!');
        console.log('=================================');
        console.log('');

        log('Conexão estabelecida.');
        log('Modo AFK iniciado.');

        andarFrente();
    });

    // =================================================
    // MORTE
    // =================================================

    bot.on('death', () => {

        log('HERMES morreu.');

        pararMovimento();

    });

    // =================================================
    // KICK
    // =================================================

    bot.on('kicked', (reason) => {

        console.log('');
        console.log('=================================');
        console.log(' HERMES FOI EXPULSO!');
        console.log('=================================');
        console.log('');

        log(`Motivo: ${reason}`);

        conectado = false;
        pararMovimento();

    });

    // =================================================
    // ERRO
    // =================================================

    bot.on('error', (err) => {

        log(`ERRO: ${err.message || err}`);

    });

    // =================================================
    // CONEXÃO ENCERRADA
    // =================================================

    bot.on('end', () => {

        if (timerTimeout) {
            clearTimeout(timerTimeout);
            timerTimeout = null;
        }

        console.log('');
        console.log('=================================');
        console.log(' HERMES CONEXÃO ENCERRADA');
        console.log('=================================');
        console.log('');

        conectado = false;

        pararMovimento();

        agendarReconexao();

    });
}

// =====================================================
// PROTEÇÃO CONTRA ERROS NÃO TRATADOS
// =====================================================

process.on('uncaughtException', (err) => {

    console.log('');
    console.log('=================================');
    console.log(' ERRO INTERNO DO HERMES');
    console.log('=================================');
    console.log('');

    log(err.message || err);

    agendarReconexao();
});

process.on('unhandledRejection', (reason) => {

    log(`Promise rejeitada: ${reason}`);

});

// =====================================================
// INICIAR
// =====================================================

console.log('');
console.log('#################################');
console.log('#       HERMESBOOT ONLINE       #');
console.log('#################################');
console.log('');

iniciarHermes();