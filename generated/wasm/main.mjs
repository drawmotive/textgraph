import { dotnet } from './dotnet.js';

const runtime = await dotnet.create();
const exports = await runtime.getAssemblyExports('DrawMotive.TextGraph.Bridge.dll');
globalThis.drawmotiveTextGraphBridge = exports.DrawMotive.TextGraph.Bridge.Program;
