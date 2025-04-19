const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

const token = "7964468262:AAFWpwQ0stF5cNX6ZDO_1T7aBljKyib-B7E";
const apiURL = `https://api.telegram.org/bot${token}/`;

app.post("/", async (req, res) => {
  const update = req.body;

  if (!update.message || !update.message.text) return res.sendStatus(200);

  const chat_id = update.message.chat.id;
  const text = update.message.text.toLowerCase();

  const sendMessage = async (msg) => {
    await axios.post(`${apiURL}sendMessage`, {
      chat_id,
      text: msg,
      parse_mode: "Markdown",
    });
  };

  const editMessage = async (msg_id, texto) => {
    await axios.post(`${apiURL}editMessageText`, {
      chat_id,
      message_id: msg_id,
      text: texto,
      parse_mode: "Markdown",
    });
  };

  const enviarConsultando = async () => {
    const res = await axios.post(`${apiURL}sendMessage`, {
      chat_id,
      text: "🔍 *Consultando, por favor aguarde...*",
      parse_mode: "Markdown",
    });
    return res.data.result.message_id;
  };

  if (text.startsWith("/cpf")) {
    const cpf = text.replace("/cpf", "").replace(/\D/g, "");

    if (cpf.length === 11) {
      const msg_id = await enviarConsultando();
      const url = `http://apidb.servehttp.com/api/cpfcredilink?Access-Key=pladix&cpf=${cpf}`;
      const { data } = await axios.get(url);

      if (data?.status === 200 && data?.dados?.dados_basicos) {
        const info = data.dados.dados_basicos;
        const msg = `✅ *Resultado da Consulta por CPF:*\n\n` +
                    `• *Nome:* ${info.nome}\n` +
                    `• *CPF:* ${info.cpf}\n` +
                    `• *Nascimento:* ${info.dt_nascimento}\n` +
                    `• *Sexo:* ${info.sexo}\n` +
                    `• *Situação:* ${info.status_receita_federal}`;
        await editMessage(msg_id, msg);
      } else {
        await editMessage(msg_id, "❌ *CPF não encontrado ou inválido.*");
      }
    } else {
      await sendMessage("⚠️ CPF inválido. Use o formato: /cpf 00000000000");
    }

  } else if (text.startsWith("/nome")) {
    const nome = text.replace("/nome", "").trim();

    if (nome.length >= 5) {
      const msg_id = await enviarConsultando();
      const url = `http://apidb.servehttp.com/api/nomecredilink?Access-Key=pladix&nome=${encodeURIComponent(nome)}`;
      const { data } = await axios.get(url);

      if (data?.status === 200 && data?.dados?.length > 0) {
        const info = data.dados[0];
        const msg = `✅ *Resultado da Consulta por Nome:*\n\n` +
                    `• *Nome:* ${info.nome}\n` +
                    `• *CPF:* ${info.cpf}\n` +
                    `• *Nascimento:* ${info.nasc}\n` +
                    `• *Sexo:* ${info.sexo}\n` +
                    `• *Situação:* ${info.situacao_rf}`;
        await editMessage(msg_id, msg);
      } else {
        await editMessage(msg_id, "❌ *Nome não encontrado ou inválido.*");
      }
    } else {
      await sendMessage("⚠️ Nome muito curto. Use: /nome Nome completo");
    }

  } else if (text === "/start" || text === "/menu") {
    const reply_markup = {
      inline_keyboard: [
        [{ text: "🔎 Consultar CPF", switch_inline_query_current_chat: "/cpf " }],
        [{ text: "👤 Consultar Nome", switch_inline_query_current_chat: "/nome " }],
      ],
    };

    await axios.post(`${apiURL}sendMessage`, {
      chat_id,
      text: "👋 *Bem-vindo ao Bot de Consultas!*\n\nEscolha uma opção abaixo:",
      parse_mode: "Markdown",
      reply_markup,
    });

  } else {
    await sendMessage("❓ Comando não reconhecido. Use /menu para ver as opções.");
  }

  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Bot rodando na porta ${PORT}`));
<?php
$token = "7868496036:AAHlVbZx8sH--kOQ7wU7xc2UOPcwGrjbu_Y";
$apiURL = "https://api.telegram.org/bot$token/";

$input = file_get_contents("php://input");
file_put_contents("log.txt", $input);

$update = json_decode($input, true);

if (!isset($update["message"]["text"])) exit;

$chat_id = $update["message"]["chat"]["id"];
$message_id = $update["message"]["message_id"];
$text = strtolower($update["message"]["text"]);
$resposta_final = "";

// Envia mensagem inicial de "consultando..."
function enviarConsultando($chat_id) {
    global $apiURL;
    $msg = "🔍 *Consultando, por favor aguarde...*";
    $res = file_get_contents($apiURL . "sendMessage?" . http_build_query([
        'chat_id' => $chat_id,
        'text' => $msg,
        'parse_mode' => 'Markdown'
    ]));
    $dados = json_decode($res, true);
    return $dados["result"]["message_id"] ?? null;
}

// Edita mensagem com resultado
function editarMensagem($chat_id, $message_id, $texto) {
    global $apiURL;
    file_get_contents($apiURL . "editMessageText?" . http_build_query([
        'chat_id' => $chat_id,
        'message_id' => $message_id,
        'text' => $texto,
        'parse_mode' => 'Markdown'
    ]));
}

// Comando CPF
if (strpos($text, "/cpf") === 0) {
    $cpf = preg_replace("/[^0-9]/", "", str_replace("/cpf", "", $text));

    if (strlen($cpf) == 11) {
        $msg_id = enviarConsultando($chat_id);
        $url = "http://apidb.servehttp.com/api/cpfcredilink?Access-Key=pladix&cpf={$cpf}";
        $dados = json_decode(file_get_contents($url), true);

        if ($dados && $dados["status"] == 200 && isset($dados["dados"]["dados_basicos"])) {
            $info = $dados["dados"]["dados_basicos"];
            $resposta_final = "✅ *Resultado da Consulta por CPF:*\n\n";
            $resposta_final .= "• *Nome:* `{$info['nome']}`\n";
            $resposta_final .= "• *CPF:* `{$info['cpf']}`\n";
            $resposta_final .= "• *Nascimento:* `{$info['dt_nascimento']}`\n";
            $resposta_final .= "• *Sexo:* `{$info['sexo']}`\n";
            $resposta_final .= "• *Situação:* `{$info['status_receita_federal']}`";
        } else {
            $resposta_final = "❌ *CPF não encontrado ou inválido.*";
        }

        editarMensagem($chat_id, $msg_id, $resposta_final);
    } else {
        file_get_contents($apiURL . "sendMessage?" . http_build_query([
            'chat_id' => $chat_id,
            'text' => "⚠️ CPF inválido. Use o formato: `/cpf 00000000000`",
            'parse_mode' => 'Markdown'
        ]));
    }

// Comando Nome
} elseif (strpos($text, "/nome") === 0) {
    $nome = trim(str_replace("/nome", "", $text));

    if (strlen($nome) >= 5) {
        $msg_id = enviarConsultando($chat_id);
        $url = "http://apidb.servehttp.com/api/nomecredilink?Access-Key=pladix&nome=" . urlencode($nome);
        $dados = json_decode(file_get_contents($url), true);

        if ($dados && $dados["status"] == 200 && !empty($dados["dados"])) {
            $info = $dados["dados"][0];
            $resposta_final = "✅ *Resultado da Consulta por Nome:*\n\n";
            $resposta_final .= "• *Nome:* `{$info['nome']}`\n";
            $resposta_final .= "• *CPF:* `{$info['cpf']}`\n";
            $resposta_final .= "• *Nascimento:* `{$info['nasc']}`\n";
            $resposta_final .= "• *Sexo:* `{$info['sexo']}`\n";
            $resposta_final .= "• *Situação:* `{$info['situacao_rf']}`";
        } else {
            $resposta_final = "❌ *Nome não encontrado ou inválido.*";
        }

        editarMensagem($chat_id, $msg_id, $resposta_final);
    } else {
        file_get_contents($apiURL . "sendMessage?" . http_build_query([
            'chat_id' => $chat_id,
            'text' => "⚠️ Nome muito curto. Use: `/nome Nome completo`",
            'parse_mode' => 'Markdown'
        ]));
    }

// Comando /menu ou /start
} elseif ($text == "/menu" || $text == "/start") {
    $texto = "👋 *Bem-vindo ao Bot de Consultas!*\n\nEscolha uma opção abaixo:";
    $botoes = [
        'inline_keyboard' => [
            [['text' => '🔎 Consultar CPF', 'switch_inline_query_current_chat' => '/cpf ']],
            [['text' => '👤 Consultar Nome', 'switch_inline_query_current_chat' => '/nome ']],
        ]
    ];

    file_get_contents($apiURL . "sendMessage?" . http_build_query([
        'chat_id' => $chat_id,
        'text' => $texto,
        'parse_mode' => 'Markdown',
        'reply_markup' => json_encode($botoes)
    ]));

// Comando desconhecido
} else {
    file_get_contents($apiURL . "sendMessage?" . http_build_query([
        'chat_id' => $chat_id,
        'text' => "❓ Comando não reconhecido. Use /menu para ver as opções.",
        'parse_mode' => 'Markdown'
    ]));
}
?>
