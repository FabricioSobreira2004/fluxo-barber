// node-test-setup.mjs
// Pré-carregado via "node --import" no script "test" do package.json: registra o hook que ensina
// o "node --test" a entender o alias "@/" (ver alias-loader-hooks.mjs pro motivo completo).
import { register } from "node:module";

register("./alias-loader-hooks.mjs", import.meta.url);
