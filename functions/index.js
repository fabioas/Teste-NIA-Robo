// Copyright 2016, Google, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

const fs = require("fs");
const functions = require('firebase-functions');
const {actionssdk,
       List,
       Permission,
       Suggestions,
       LinkOutSuggestion,
       Carousel,
       BasicCard,
       Image,
       SignIn
      } = require('actions-on-google');
//const request = require('request');
const nia = require('./teste1');
//const maps = require('@google/maps');
const url = require('url');
const decoder = require('ent');
const request = require('request-promise');
const keymaps = 'AIzaSyBbyPDhRxA9_ELMJpiuc_GoFM9vy4chWsY';
let linkMap = '';
let tipoAg = '';
let dista = '';
let med = '';
const {ssml} = require('./util');
const config = functions.config();
//const client = maps.createClient({key: keymaps});

let agecc = '';
let agecli = ''; 
let agebusca= '';
let contacli = '';
let tipoAt = '';
let url_chk = '';
let controle_age = 0;

const responses = {
  permissionReason: 'Por favor',
  newSurfaceContext: 'Para mostrar sua localização',
  notificationText: 'Veja onde você está...',
};

/**
   * Gets the city name from results returned by Google Maps reverse geocoding
   * from coordinates.
   * @param {number} latitude
   * @param {number} longitude
   * @return {Promise<string>}
   */


const app = actionssdk({debug: true, clientId: '786432424698-5adot39n7nv1cj59a75o2l9nfb60db5s.apps.googleusercontent.com',});

/* //incluso pra teste de captura de email
app.intent('actions.intent.SIGN_IN', (conv, input, signin) => {
  if (signin.status === 'OK') {
    const email = conv.user.email
    conv.ask(`Seu email é ${email}.`)
  } else {
    conv.ask(`Não consegui pegar seu email`)
  }
}); */

app.intent('actions.intent.MAIN', (conv) => {
  

  //lista inicial com as opções de atendimento
  conv.ask(`<speak><prosody rate="112%" pitch="-1.5st"><p><s>Olá!</s><s> Sou o assistente virtual do BB.</s><s>Diga se você quer <emphasis level="moderate"> "informações gerais" </emphasis> ou <emphasis level="moderate"> "endereço de agências"</emphasis> ou ainda <emphasis level="moderate"> "emissão de senha"</emphasis></s></p></prosody></speak>`)
  conv.ask(new List(
    {
      title: 'Escolha o atendimento',
      items: {
        // Add the first item to the list
        'informações gerais': {
          synonyms: [
              'gerais',
              'informações',
              'quero saber informações gerais',      
            ],
          title: 'informações gerais'
        },
        'endereço de agências': {
          synonyms: [
            'agencias',
            'endereços',
            'localizar',
            'endereços de agências',
            'encontrar agências',
            'terminais',
            'quero localizar minha agência',
            'quero saber onde fica minha agência',
            'buscar minha agência',
            'onde tem uma agência',
            'onde está minha agência',
            'onde encontro minha agência',
            'onde encontro uma agêndcia',
            'qual endereço da minha agência',
            'qual endereço da agência mais próxima',
            'qual endereço da agẽncia mais perto',
            'qual agência mais próxima',
          ],
          title: 'endereço de agências'
        },
        'emissão de senha': {
          synonyms: [
            'senha de atendimento',
            'senha da agência',
            'emitir senha',
            'senha',
            'senhas',
            'atendimento na agência',
            'quero a senha',
          ],
          title: 'emissão de senha'
        }
      }
    }
  ));

});

//trabalha com as opções acima (informações, endereço ou senha)
app.intent('actions.intent.OPTION', (conv, params, option) => {
  if (!option) {
    conv.ask(`<speak><prosody rate="112%" pitch="-1.5st">Selecione uma das opções da lista.</prosody></speak>`);
  } else if (option.search(/informações gerais/i) != -1) { //caso a opção 'informações gerais' for escolhida
    
    /* //teste para sign in
    conv.ask(new SignIn()) //incluso pra teste de captura de email */

    conv.ask(`<speak><prosody rate="112%" pitch="-1.5st">Diga o que quer saber sobre produtos e serviços do BB.</prosody></speak>`);
    app.intent('actions.intent.TEXT', async (conv, input) => {
    
        let resposta = await nia.consultaNIA(input); 
        
        let saida = JSON.stringify(resposta.data.output.text);
        //let saida = "O BB possui produtos, tais como: Brasilprev, Ourocap, Seguros. Consulte o site www.bb.com.br para maiores esclarecimentos! Tem dúvidas? Acesse e confira!"
        let findreplace = {". ": ". </s><s>", ": " : ": </s><s>", "! " : "! </s><s>", "? " : "? </s><s>","INTENCAO_SEM_FEEDBACK":"",";)":"",":)":"",'["':'','"]':''};
        let saida_norm = saida.replace(new RegExp("(" + Object.keys(findreplace).map(function(i){return i.replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&")}).join("|") + ")", "g"), function(s){return findreplace[s]});
        let saida_fim = decoder.decode(saida_norm);
        
        if(input.search(/quero perguntar mais/i) != -1){
          conv.ask(`<speak><prosody rate="112%" pitch="-1.5st">Diga o que quer saber sobre produtos e serviços do BB.</prosody></speak>`);
        }else
        if (input.search(/tchau/i) != -1 || input.search(/obrigado/i) != -1) {
          return conv.close('<speak><prosody rate="112%" pitch="-1.5st"><p><s>'+saida_fim+'</s></p></prosody></speak>');
        }else{
          conv.ask('<speak><prosody rate="112%" pitch="-1.5st"><p><s>'+saida_fim+'</s></p></prosody></speak>')
          conv.ask(new Suggestions(['Quero perguntar mais', 'Ok. Obrigado!']));
        }
    });
  } else if (option.search(/endereço de agências/i) != -1) { //caso a opção 'endereço de agências' for escolhida
    if(!conv.user.storage.location){   //permissão para nome e localização do usuário
      conv.ask(new Permission({
        context: responses.permissionReason,
        permissions: ['NAME','DEVICE_PRECISE_LOCATION'],
      }));
    }
    app.intent('actions.intent.TEXT', (conv, input) => {
      if(input.search(/tchau/i) != -1 || input.search(/obrigado/i) != -1 || input.search(/não traçar rota/i) != -1 || input == 'não'){
        return conv.close(`<speak><prosody rate="112%" pitch="-1.5st">Tudo bem. Pode me chamar quando quiser!</prosody></speak>`);
      }else
      if(input.search(/traçar rota/i) != -1){ //enviar as coordenadas e abrir app do google maps
        conv.ask(`<speak><prosody rate="112%" pitch="-1.5st">Aqui está uma sugestão de rota.</prosody></speak>`)
        conv.close(new LinkOutSuggestion({
          name: 'Rota Google Maps',
          url: linkMap,
        })); 
      }else
      if(input.search(/terminal/i) != -1){ //encontrar o lugar mais próximo
          
        const {coordinates} = conv.device.location;
        const rotaMapsURL = url.parse('https://www36.bb.com.br/encontreobb/rest/WsLocalizacaoAgencias/'+coordinates.latitude+'/'+coordinates.longitude+'/0/0/2', true);
    
        const rotaViewURL = url.format(rotaMapsURL);
        return request(rotaViewURL, { json: true })
          .then(function (traca) {
            linkMap = traca[0].linkGoogleMapsDriving;
            dista = (traca[0].distancia).toFixed(2);
            conv.ask(`<speak><prosody rate="112%" pitch="-1.5st"><p><s>Ok ${conv.user.name.given}, você está a ${dista}km do ${traca[0].pontoDescricao} localizado em ${traca[0].logradouro}.</s><s> Diga se quer traçar uma rota até lá.</s></p></prosody></speak>`)
            conv.ask(new Suggestions(['traçar rota', 'não traçar rota']));
          })
          .catch(function (err) {
              conv.close(err);
          });
      }else{
        //buscar agência pedida pelo usuário
        const rotaAgMapsURL = url.parse('https://www36.bb.com.br/encontreobb/rest/WsLocalizacaoAgencias/'+input+'/0/0/?uf=todos', true);
        const rotaAgViewURL = url.format(rotaAgMapsURL);
        return request(rotaAgViewURL, { json: true })
          .then(function (rote) {
            linkMap = rote[1].linkGoogleMapsDriving;
            conv.ask(`<speak><prosody rate="112%" pitch="-1.5st"><p><s>Ok.</s><s>A agência ${rote[1].nomePonto} está localizada em ${rote[1].logradouro},  ${rote[1].bairro},  ${rote[1].municipio}.</s><s>Atende das ${rote[1].horaInicioDU} às ${rote[1].horaFimDU}.</s><s> Diga se quer traçar uma rota até lá.</s></p></prosody></speak>`)
            conv.ask(new Suggestions(['traçar rota', 'não traçar rota']));
            })
          .catch(function (err) {
              conv.close(err);
        });    
      }
    });

    app.intent('actions.intent.PERMISSION', (conv, params, permissionGranted) => {
      if (!permissionGranted) {
        throw new Error('Permissão negada');
      }
      conv.ask(`<speak><prosody rate="112%" pitch="-1.5st"><p><s>Se quiser encontrar uma agência, diga a cidade e UF <break time="200ms" />, bairro ou número da agência.</s><s> Se quiser algum terminal mais próximo de você, diga  <emphasis level="moderate"> "terminal" </emphasis></s></p></prosody></speak>`)
      conv.ask(new Suggestions(['terminal']));
    
    });

  }else if(option.search(/emissão de senha/i) != -1){ //caso a opção 'emissão de senha' for escolhida
    

    if(!conv.user.storage.location){   
      conv.ask(new Permission({           //permissão para nome e localização do usuário
        context: responses.permissionReason,
        permissions: ['NAME','DEVICE_PRECISE_LOCATION'],
      }));
    }
    //pedir os dados de agência, conta e onde será atendido
    app.intent('actions.intent.PERMISSION', (conv, params, permissionGranted) => {
      if (!permissionGranted) {
        throw new Error('Permissão negada');
      }
      conv.ask(`<speak><prosody rate="112%" pitch="-1.5st"><p><s>Por favor informe o numero da sua agência com 4 dígitos, sem o dígito verificador.</s></p></prosody></speak>`);
    });

    app.intent('actions.intent.TEXT', (conv, input) => {
      let numero = input.match(/\d/g);
      if(numero != null && numero.length == 4){
        controle_age = 1; //controle para não passar sem armazenar a agencia
        agecli = numero.join("");
        agebusca = numero.join("");
        conv.ask(`<speak><prosody rate="112%" pitch="-1.5st"><p><s>Por favor informe o numero da sua conta corrente, com dígito verificador.</s></p></prosody></speak>`);
      }else
      if(numero != null && controle_age){
        contacli = input;
        
        //ver se a agência é varejo ou estilo
        const rotaAgMapsURL = url.parse('https://www36.bb.com.br/encontreobb/rest/WsLocalizacaoAgencias/'+agebusca+'/0/0/?uf=todos', true);
        const rotaAgViewURL = url.format(rotaAgMapsURL);
        var ritems = {};
        
        return request(rotaAgViewURL, { json: true })
          .then(function (rote) {
            //tipo da agência para busca das mais próximas
            tipoAg = rote[1].pontoTipo;
            //incluir a agência informada no carrossel
            ritems[rote[1].id1] = {
              title: rote[1].id1+' - '+rote[1].nomePonto,
              description: 'Essa é sua agência',
            }
            //tirar essa parte quando for pra produção
            ritems['rote[1].id1'] = {
              title: 'rote[1].id1+' - '+rote[1].nomePonto',
              description: 'Essa é sua agência',
            }
            //localizar as agências mais próximas
            const {coordinates} = conv.device.location;
            const rotaMapsURL = url.parse('https://www36.bb.com.br/encontreobb/rest/WsLocalizacaoAgencias/'+coordinates.latitude+'/'+coordinates.longitude+'/0/0/2', true);
            const rotaViewURL = url.format(rotaMapsURL);

            return request(rotaViewURL, { json: true })
            .then(function (traca) {
              for(var index = 1; index < traca.length; index++){
                if(tipoAg == '101'){
                  if(traca[index].pontoTipo == '101' && traca[index].distancia < 3 && traca[index].id1 != rote[1].id1){
                    ritems[traca[index].id1] = {
                      title: traca[index].id1+' - '+traca[index].nomePonto,
                      description: 'Distância: '+traca[index].distancia.toFixed(2)+'Km',
                    }
                  }
                }else
                if(tipoAg == '102'){
                  if((traca[index].pontoTipo == '101' || traca[index].pontoTipo == '102') && traca[index].distancia < 3  && traca[index].id1 != rote[1].id1){
                    ritems[traca[index].id1] = {
                      title: traca[index].id1+' - '+traca[index].nomePonto,
                      description: 'Distância: '+traca[index].distancia.toFixed(2)+'Km',
                    }
                  }
                }
              }
              //numero minimo de itens no carrossel é 2
              conv.ask(`<speak><prosody rate="112%" pitch="-1.5st">Escolha uma agência para atendimento:</prosody></speak>`) 
              //colocar o carrossel com as agências na tela
              conv.ask(new Carousel(
                { 
                  title:'Agências',
                  items:ritems
                }
              ));
              //fim de carrossel
            })
            .catch(function (err) {
                conv.close(err);
            });
            //fim da localização de agencias
          })
          .catch(function (err) {
              conv.close(err);
        });
      }else{
        conv.ask(`<speak><prosody rate="112%" pitch="-1.5st">Me desculpe ${conv.user.name.given}, não entendi. Por favor repita.</prosody></speak>`);
      }
    });
  }else{ //emite a senha com a agência escolhida
    let emitSenha = '';

    conv.ask(`<speak><prosody rate="112%" pitch="-1.5st">Quer atendimento negocial ou pro caixa?</prosody></speak>`);

    app.intent('actions.intent.TEXT', async (conv, input) => {
      if(input.search(/negocial/i) != -1){
        tipoAt = '17';
        //===opção de produção===
        let AgURL = 'tela/EmissaoSenha/telaSenha?agencia='+agecli+'&contaCorrente='+contacli+'&titularidade=1&prefixoAgenciaAtendimento='+option+'&tipoAtendimento='+tipoAt; 
        //===opção de desenv===
        //let AgURL = 'tela/EmissaoSenha/telaSenha?agencia=7984-7&contaCorrente=4024-x&titularidade=1&prefixoAgenciaAtendimento='+option+'&tipoAtendimento=17'; 
        let txtSenha = await nia.emiteSenha(AgURL);

        if(txtSenha.conteiner.telas[0].nome == 'telaErro'){
          let resposta = txtSenha.conteiner.telas[0].sessoes[0].celulas[0].componentes[0].texto;
          let txterro = resposta.split('.');
          conv.close(`<speak><prosody rate="112%" pitch="-1.5st">${txterro[0]}</prosody></speak>`);
        }else{
          emitSenha = txtSenha.conteiner.telas[0].protocoloExecutaAposRenderizacao.codigoSenha;
          let mensagem = (txtSenha.conteiner.telas[0].sessoes[0].celulas[3].componentes[0].protocolo.mensagem);
          let findreplace = {". ": ". </s><s>", ": " : ": </s><s>", "! " : "! </s><s>", "? " : "? </s><s>","INTENCAO_SEM_FEEDBACK":"",";)":"",":)":"",'["':'','"]':''};
          let msg_norm = mensagem.replace(new RegExp("(" + Object.keys(findreplace).map(function(i){return i.replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&")}).join("|") + ")", "g"), function(s){return findreplace[s]});
          conv.ask(`<speak><prosody rate="112%" pitch="-1.5st"><p><s>Ok ${conv.user.name.given}, a senha emitida é <say-as interpret-as="characters">${emitSenha}</say-as></s>\n` +
          `<s>${msg_norm}</s></p></prosody></speak>`)
          conv.ask(new Suggestions(['estou na agência'],['traçar rota'],['cancelar']));
          //parte da url para checkin
          url_chk = txtSenha.conteiner.telas[0].sessoes[0].celulas[3].componentes[0].protocolo.botaoDois.acao;
        }     
      }else
      if(input.search(/caixa/i) != -1){
        tipoAt = '16';
        //===opção de produção===
        let AgURL = 'tela/EmissaoSenha/telaSenha?agencia='+agecli+'&contaCorrente='+contacli+'&titularidade=1&prefixoAgenciaAtendimento='+option+'&tipoAtendimento='+tipoAt; 
        //===opção de desenv===

        //somente quando for pra produção. Erro de conexão

        //let AgURL = 'tela/EmissaoSenha/telaSenha?agencia=7984-7&contaCorrente=4024-x&titularidade=1&prefixoAgenciaAtendimento='+option+'&tipoAtendimento=16'; 
        let txtSenha = await nia.emiteSenha(AgURL);

        if(txtSenha.conteiner.telas[0].nome == 'telaErro'){
          let resposta = txtSenha.conteiner.telas[0].sessoes[0].celulas[0].componentes[0].texto;
          let txterro = resposta.split('.');
          conv.close(`<speak><prosody rate="112%" pitch="-1.5st">${txterro[0]}</prosody></speak>`);
        }else{
          emitSenha = txtSenha.conteiner.telas[0].protocoloExecutaAposRenderizacao.codigoSenha;
          let mensagem = (txtSenha.conteiner.telas[0].sessoes[0].celulas[3].componentes[0].protocolo.mensagem);
          let findreplace = {". ": ". </s><s>", ": " : ": </s><s>", "! " : "! </s><s>", "? " : "? </s><s>","INTENCAO_SEM_FEEDBACK":"",";)":"",":)":"",'["':'','"]':''};
          let msg_norm = mensagem.replace(new RegExp("(" + Object.keys(findreplace).map(function(i){return i.replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&")}).join("|") + ")", "g"), function(s){return findreplace[s]});
          
          conv.ask(`<speak><prosody rate="112%" pitch="-1.5st"><p><s>Ok ${conv.user.name.given}, a senha emitida é <say-as interpret-as="characters">${emitSenha}</say-as></s>\n` +
          `<s>${msg_norm}</s></p></prosody></speak>`)
          conv.ask(new Suggestions(['estou na agência'],['traçar rota'],['cancelar']));
          //parte da url para checkin
          url_chk = txtSenha.conteiner.telas[0].sessoes[0].celulas[3].componentes[0].protocolo.botaoDois.acao;
        } 
      }else
      if(input.search(/tchau/i) != -1 || input.search(/obrigado/i) != -1 || input.search(/cancelar/i) != -1){
        return conv.close(`<speak><prosody rate="112%" pitch="-1.5st"><p><s>Ok.</s><s> Pode me chamar sempre que precisar!</s></p></prosody></speak>`);
      }else 
      if(input.search(/estou na agência/i) != -1){  //enviar a requisição de check in do atendimento
        let txt_chk = await nia.emiteSenha(url_chk);
        let conf_chk = txt_chk.conteiner.telas[0].sessoes[0].celulas[3].componentes[0].texto;
        let ambAtend = (txt_chk.conteiner.telas[0].sessoes[0].celulas[7].componentes[1].componentes[0].texto);

        conv.ask(`<speak><prosody rate="112%" pitch="-1.5st">${conf_chk}. <break time="200ms"/>\nSua senha de atendimento é <say-as interpret-as="characters">${emitSenha}</say-as><break time="200ms"/>\n</prosody></speak>`)
        conv.close(`<speak><prosody rate="112%" pitch="-1.5st">Favor dirigir-se ao ${ambAtend}</prosody></speak>`);
      }else
      if(input.search(/traçar rota/i) != -1 ){  //enviar a requisição de check in do atendimento
        const rotaAgAt = url.parse('https://www36.bb.com.br/encontreobb/rest/WsLocalizacaoAgencias/'+option+'/0/0/?uf=todos', true);
        const rotaAgViewAt = url.format(rotaAgAt);
        return request(rotaAgViewAt, { json: true })
          .then(function (roter) {
            const linkMap = roter[1].linkGoogleMapsDriving;
            conv.ask(`<speak><prosody rate="112%" pitch="-1.5st">Aqui está uma sugestão de rota.</prosody></speak>`)
            conv.ask(new LinkOutSuggestion({
              name: 'Rota Google Maps',
              url: linkMap,
            }))
            conv.ask(new Suggestions(['estou na agência'],['cancelar']));; 
          })
          .catch(function (err) {
            conv.close(err);
          }); 
      }else{  //caso a entrada não satisfaça as condições acima
        conv.ask(`<speak><prosody rate="112%" pitch="-1.5st">Me desculpe ${conv.user.name.given}, não entendi. Por favor repita.</prosody></speak>`);
      }
    });
  }
});

exports.atendeBB = functions.https.onRequest(app);
