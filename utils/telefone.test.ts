// ============================================================================
// telefone.test.ts
// Testes simples do utilitário de telefone (utils/telefone.ts). Roda com:
//   node --test utils/telefone.test.ts
// Usa o test runner nativo do Node (não precisei instalar nenhuma lib nova:
// Node 24, usado neste projeto, já roda TypeScript e tem "node:test" prontos).
// ============================================================================

import { test } from "node:test"; // test runner nativo do Node, sem precisar instalar nada
import assert from "node:assert/strict"; // comparações simples (assert.equal etc)
import { normalizarTelefone, telefoneTemFormatoValido, formatarTelefone, aplicarMascaraTelefone } from "./telefone.ts";

test("normalizarTelefone remove parênteses, espaço e hífen", () => { // formatação comum de digitação
  assert.equal(normalizarTelefone("(21) 99016-3583"), "21990163583");
});

test("normalizarTelefone remove o '+' de '+55'", () => { // caso mais simples do código do país
  assert.equal(normalizarTelefone("+55 21 99016-3583"), "21990163583");
});

test("normalizarTelefone remove o '55' colado, sem o '+' (bug corrigido na migration 004)", () => { // o caso que estava quebrado
  assert.equal(normalizarTelefone("55 21 99016-3583"), "21990163583");
  assert.equal(normalizarTelefone("5521990163583"), "21990163583"); // sem nenhuma formatação, só dígitos
});

test("normalizarTelefone remove o '55' colado também em telefone fixo (10 dígitos + 55 = 12)", () => {
  assert.equal(normalizarTelefone("552133334444"), "2133334444");
});

test("normalizarTelefone NÃO mexe num telefone de 11 dígitos só porque começa com outros números", () => { // não pode confundir DDD com código de país
  assert.equal(normalizarTelefone("21990163583"), "21990163583"); // já tem 11 dígitos: não deve cortar nada
});

test("normalizarTelefone não derruba um número que só por acaso tem 12-13 dígitos sem começar com 55", () => {
  assert.equal(normalizarTelefone("119901635831"), "119901635831"); // 12 dígitos, mas não começa com "55": mantém como está (formato inválido mesmo, mas a função só tira o prefixo de país, não valida)
});

test("telefoneTemFormatoValido aceita 10 e 11 dígitos, recusa o resto", () => {
  assert.equal(telefoneTemFormatoValido("2133334444"), true); // 10 dígitos (fixo)
  assert.equal(telefoneTemFormatoValido("21990163583"), true); // 11 dígitos (celular)
  assert.equal(telefoneTemFormatoValido("219000021"), false); // 9 dígitos
  assert.equal(telefoneTemFormatoValido("219000002299"), false); // 12 dígitos
});

test("formatarTelefone formata celular (11) e fixo (10) corretamente", () => {
  assert.equal(formatarTelefone("21990163583"), "(21) 99016-3583");
  assert.equal(formatarTelefone("2133334444"), "(21) 3333-4444");
});

test("aplicarMascaraTelefone formata progressivamente enquanto digita", () => { // simula o usuário indo tecla por tecla
  assert.equal(aplicarMascaraTelefone(""), "");
  assert.equal(aplicarMascaraTelefone("2"), "(2");
  assert.equal(aplicarMascaraTelefone("21"), "(21");
  assert.equal(aplicarMascaraTelefone("219"), "(21) 9");
  assert.equal(aplicarMascaraTelefone("21990163583"), "(21) 99016-3583"); // 11 dígitos completos
});
