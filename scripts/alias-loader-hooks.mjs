// alias-loader-hooks.mjs
// Hook de resolução de módulos ESM usado SÓ pelos testes (node --test). Resolve 2 coisas que o código-fonte
// usa normalmente (porque o Next.js, em dev/build, resolve isso sozinho) mas que o "node --test" puro não entende:
//   1) o alias "@/" (configurado em tsconfig.json -> paths), ex: "@/utils/data" -> "<raiz>/utils/data.ts";
//   2) imports relativos SEM extensão entre arquivos .ts, ex: "./tipos" -> "./tipos.ts".
// Em vez de reescrever esses imports nos arquivos de origem só pra testar (o que quebraria a convenção usada
// no resto do código), este hook ensina o Node a entender os dois casos, registrado em node-test-setup.mjs.
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const RAIZ_DO_PROJETO = fileURLToPath(new URL("..", import.meta.url)); // scripts/ -> raiz (mesmo mapeamento do tsconfig: "@/*" -> "./*")
const EXTENSOES = ["", ".ts", ".tsx"]; // tenta o caminho exato primeiro, depois ".ts" e ".tsx" (as únicas usadas no projeto)

export function resolve(specifier, context, proximoResolve) {
  if (specifier.startsWith("@/")) {
    return resolverComExtensao(path.join(RAIZ_DO_PROJETO, specifier.slice(2)), specifier, context, proximoResolve);
  }

  if (specifier.startsWith(".") && !path.extname(specifier)) { // import relativo sem extensão (ex: "./tipos")
    const caminhoBase = path.join(fileURLToPath(context.parentURL), "..", specifier);
    return resolverComExtensao(caminhoBase, specifier, context, proximoResolve);
  }

  return proximoResolve(specifier, context); // qualquer outro caso: deixa o resolvedor padrão do Node cuidar
}

function resolverComExtensao(caminhoBase, specifierOriginal, context, proximoResolve) {
  for (const extensao of EXTENSOES) {
    if (existsSync(caminhoBase + extensao)) {
      return proximoResolve(pathToFileURL(caminhoBase + extensao).href, context);
    }
  }
  throw new Error(`alias-loader-hooks: não achei o arquivo de "${specifierOriginal}" (procurei em ${caminhoBase}.ts / .tsx)`);
}
