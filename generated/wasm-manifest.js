export default {
  "schemaVersion": 1,
  "packageName": "@drawmotive/textgraph",
  "packageVersion": "0.3.5",
  "abiVersion": "1.0.0",
  "protocolVersion": 2,
  "runtimeModule": "wasm/dotnet.js",
  "bridge": {
    "assembly": "DrawMotive.TextGraph.Bridge.dll",
    "type": "DrawMotive.TextGraph.Bridge.Program",
    "info": "GetRuntimeInfo",
    "validate": "Validate",
    "execute": "Execute"
  },
  "rendering": {
    "theme": "wasm/themes.css",
    "fonts": [
      {
        "family": "Noto Sans",
        "asset": "wasm/NotoSans-Regular.ttf",
        "languages": [
          "en"
        ]
      },
      {
        "family": "Fuzzy Bubbles",
        "asset": "wasm/FuzzyBubbles-Regular.ttf",
        "languages": [
          "en"
        ]
      }
    ]
  },
  "targetFramework": "net11.0",
  "privateSource": {
    "commit": "ebc80655817380c0eda6fb8275fa58476c7f20fb",
    "project": "DrawMotive.TextGraph.Bridge"
  },
  "entryAssembly": "wasm/DrawMotive.TextGraph.Bridge.wasm",
  "runtimeWasm": "wasm/dotnet.native.wasm",
  "runtimeConfig": "wasm/DrawMotive.TextGraph.Bridge.runtimeconfig.json",
  "capabilities": [
    "abi-handshake",
    "textgraph-parser-link",
    "textgraph-validate-v1",
    "textgraph-render-v1",
    "textgraph-render-svg-v1",
    "textgraph-render-dark-v1",
    "textgraph-fonts-v1",
    "textgraph-font-inventory-v1"
  ],
  "assets": [
    {
      "path": "wasm/DrawMotive.TextGraph.Bridge.runtimeconfig.json",
      "mediaType": "application/json",
      "bytes": 2543,
      "sha256": "6f0ce64ca6c2aabadea7d2f83cda6c5b33512a899c2decf5d38d9911107881fe"
    },
    {
      "path": "wasm/DrawMotive.TextGraph.Bridge.wasm",
      "mediaType": "application/wasm",
      "bytes": 92953,
      "sha256": "39aa837d8e668671eac3b33862ae9b89a99ed5bb3d8b19d0f33efad280212332"
    },
    {
      "path": "wasm/ExCSS.wasm",
      "mediaType": "application/wasm",
      "bytes": 287513,
      "sha256": "9c757a46dca8b88c8b9055f037c791760506b8a64c1de6dd75415d7c5e4896cd"
    },
    {
      "path": "wasm/FuzzyBubbles-LICENSE.txt",
      "mediaType": "text/plain",
      "bytes": 4399,
      "sha256": "91807f6aa2acf563d9884889355f7b1da2e72aebf207b1aaadc2c11bb2ed2b29"
    },
    {
      "path": "wasm/FuzzyBubbles-Regular.ttf",
      "mediaType": "font/ttf",
      "bytes": 145008,
      "sha256": "0fcfecadb6cf574cb5009967a3da171471f7633de00d96cb4b86b3c6a6f61cca"
    },
    {
      "path": "wasm/Graphics.Core.wasm",
      "mediaType": "application/wasm",
      "bytes": 3956509,
      "sha256": "cc06d32f484b2bb90211a677b02ca841ea9ee94b894dd4314e8751b7bcef1360"
    },
    {
      "path": "wasm/HarfBuzzSharp.wasm",
      "mediaType": "application/wasm",
      "bytes": 28441,
      "sha256": "895167a2cf0879bf437defad909ae8bfe269d8ab9d42f7ce47556fa0ae96b931"
    },
    {
      "path": "wasm/Markdig.wasm",
      "mediaType": "application/wasm",
      "bytes": 310041,
      "sha256": "53c7f951aa57e6aababf0e3ceb5c1a3eb7f93d2564767f10011ae6ba58f35a02"
    },
    {
      "path": "wasm/Math.Core.wasm",
      "mediaType": "application/wasm",
      "bytes": 502041,
      "sha256": "1585130befbe1ca86772e23b49736607ee89a9da449c25d1eb9422ecd71f57b5"
    },
    {
      "path": "wasm/MemoryPack.Core.wasm",
      "mediaType": "application/wasm",
      "bytes": 85273,
      "sha256": "e6aba72f7d217a0e6f142a61d15080b589736f6eef93152cbacdd7059dfcc660"
    },
    {
      "path": "wasm/Microsoft.Extensions.DependencyInjection.Abstractions.wasm",
      "mediaType": "application/wasm",
      "bytes": 17177,
      "sha256": "b9638f3fa5d8965b6ffe9a5b24ae2764df3cb6974ee5fa5c419eb7625b2fea16"
    },
    {
      "path": "wasm/Microsoft.Extensions.DependencyInjection.wasm",
      "mediaType": "application/wasm",
      "bytes": 47385,
      "sha256": "db38df39ca75bdd30312ce3a7f55cf57f596c973b8aa13c3b895e78a3a49c409"
    },
    {
      "path": "wasm/Microsoft.Extensions.Logging.Abstractions.wasm",
      "mediaType": "application/wasm",
      "bytes": 19225,
      "sha256": "84e4475231c145d62fdcc05a733e33cb71afdfc2432c2d0f586bebecff3fbd05"
    },
    {
      "path": "wasm/Microsoft.Extensions.Logging.wasm",
      "mediaType": "application/wasm",
      "bytes": 18713,
      "sha256": "9f6d5fcf372ad76c071ed95dd9503de4ee03e797ba7b106c7a13774e401a9f46"
    },
    {
      "path": "wasm/Microsoft.Extensions.Options.wasm",
      "mediaType": "application/wasm",
      "bytes": 17177,
      "sha256": "368aec90d1d05089bfc6bf06bfd384b7ea56184d28f3c451d99f3e9e5060c0f0"
    },
    {
      "path": "wasm/Microsoft.Extensions.Primitives.wasm",
      "mediaType": "application/wasm",
      "bytes": 8473,
      "sha256": "72a0c5fc9028d6c286cc833ea54fe0ba08c5724675cbdf3a2abd83eba1c2c79a"
    },
    {
      "path": "wasm/Nanoid.wasm",
      "mediaType": "application/wasm",
      "bytes": 5401,
      "sha256": "b236ff2fd0df7876cc83aced95fd28e0d58abbae9630d5021e9c2a08b9094a0d"
    },
    {
      "path": "wasm/NotoSans-LICENSE.txt",
      "mediaType": "text/plain",
      "bytes": 4395,
      "sha256": "e2e177a32561584d4fc13aaa3cd8e53758a12910f013fe9ca125419111722029"
    },
    {
      "path": "wasm/NotoSans-Regular.ttf",
      "mediaType": "font/ttf",
      "bytes": 2049096,
      "sha256": "bfb7bb691513f12e734dc346c03a03f784912432d7e3fa8e56efcf906fe86b3d"
    },
    {
      "path": "wasm/R3.wasm",
      "mediaType": "application/wasm",
      "bytes": 9497,
      "sha256": "a01b28eeb7b4990353a1093f5df541647795ced47e15ca0291403b8baff7dbf4"
    },
    {
      "path": "wasm/RBush.wasm",
      "mediaType": "application/wasm",
      "bytes": 14105,
      "sha256": "49851fce4c40ed837d5a2df7f0aae07e784fd74b1f145a253d39c10932c112ea"
    },
    {
      "path": "wasm/SkiaSharp.HarfBuzz.wasm",
      "mediaType": "application/wasm",
      "bytes": 6937,
      "sha256": "e7597c1261800351b777ff6a4324e8337cabdb031490a6fc9aecf3a26ab0e5a0"
    },
    {
      "path": "wasm/SkiaSharp.wasm",
      "mediaType": "application/wasm",
      "bytes": 106265,
      "sha256": "9255ba775b3cee16f223bb51d91bea90cf2aad43f93c7986c2ff8eb88538c430"
    },
    {
      "path": "wasm/System.Collections.Concurrent.wasm",
      "mediaType": "application/wasm",
      "bytes": 12569,
      "sha256": "551d72729c1c820bb34fd054fb548048d60c0fc9ac0240a3b76aa01d5bd43df0"
    },
    {
      "path": "wasm/System.Collections.Immutable.wasm",
      "mediaType": "application/wasm",
      "bytes": 86297,
      "sha256": "5d82f37a1b30e69d5fab1aad4a8f73c60043a6948798a14f2c678e3bb1987561"
    },
    {
      "path": "wasm/System.Collections.NonGeneric.wasm",
      "mediaType": "application/wasm",
      "bytes": 7961,
      "sha256": "2a2e9ac19f367817f9b5070e7982f2da36349c96a9249f611066f782b2a9e37b"
    },
    {
      "path": "wasm/System.Collections.Specialized.wasm",
      "mediaType": "application/wasm",
      "bytes": 10009,
      "sha256": "d43ec2ecf02e4cd1433f0636634a36cf89501b7c09098f01259448a9bb290cbf"
    },
    {
      "path": "wasm/System.Collections.wasm",
      "mediaType": "application/wasm",
      "bytes": 43801,
      "sha256": "89c763ca9e5e13efc199754cac9b0549b50a90389e8ca5d88b1ea8b3a5751351"
    },
    {
      "path": "wasm/System.ComponentModel.Primitives.wasm",
      "mediaType": "application/wasm",
      "bytes": 11033,
      "sha256": "56aee4d4d486f5d2b4efed2f99b5ea80063d861f9c527339c50e472430155319"
    },
    {
      "path": "wasm/System.ComponentModel.TypeConverter.wasm",
      "mediaType": "application/wasm",
      "bytes": 50969,
      "sha256": "5c599eb02b00d084d14e8cbba1408830854e9c2feff8ec12026ec6795d9236a5"
    },
    {
      "path": "wasm/System.ComponentModel.wasm",
      "mediaType": "application/wasm",
      "bytes": 4889,
      "sha256": "f6cdc887585eedfbc4f3a021f022c782439c0f0363750da331dba84056c29373"
    },
    {
      "path": "wasm/System.Console.wasm",
      "mediaType": "application/wasm",
      "bytes": 14617,
      "sha256": "2c9e79785221c4bda7fdb985c1e4af719da7c3d0cc76b957953294e88d60a1c6"
    },
    {
      "path": "wasm/System.IO.Pipelines.wasm",
      "mediaType": "application/wasm",
      "bytes": 5913,
      "sha256": "fa08176bf00f1319b540105fc9a776c9789a48ec4b73ff69da46dce56ae2cb95"
    },
    {
      "path": "wasm/System.Linq.wasm",
      "mediaType": "application/wasm",
      "bytes": 102681,
      "sha256": "f71871c006db464297cda99e5790dca486fa82080c872186e2928e1104e6c824"
    },
    {
      "path": "wasm/System.Memory.wasm",
      "mediaType": "application/wasm",
      "bytes": 16665,
      "sha256": "cf7c7570f8d4cf173dca4236b97299db263f6dbbbdacd78a673e0c7ddd5bbc11"
    },
    {
      "path": "wasm/System.Net.Http.wasm",
      "mediaType": "application/wasm",
      "bytes": 139033,
      "sha256": "f71414b204a2aee849ac00a98bfeba50583705729b6f217963e3a6bcc3e9af1c"
    },
    {
      "path": "wasm/System.Net.Primitives.wasm",
      "mediaType": "application/wasm",
      "bytes": 7449,
      "sha256": "5a8309602e3a87adfea7a244a833ba84c9e89fb864cc9235c5928c5e3e8bb9d5"
    },
    {
      "path": "wasm/System.ObjectModel.wasm",
      "mediaType": "application/wasm",
      "bytes": 11545,
      "sha256": "f0e04efc5722c9fa556b7beb749b86a586b97d88677c81a66e2d1aeb4d869073"
    },
    {
      "path": "wasm/System.Private.CoreLib.wasm",
      "mediaType": "application/wasm",
      "bytes": 2191133,
      "sha256": "70aa434e2cb18187cb915aa28192b127e88433616b968453a9f3ecc23db03f7d"
    },
    {
      "path": "wasm/System.Private.Uri.wasm",
      "mediaType": "application/wasm",
      "bytes": 65817,
      "sha256": "a5c7436fbb46b05cb91ba4c0fa320dc1f36ec188a3759a835b1d8c1ed0715163"
    },
    {
      "path": "wasm/System.Private.Xml.Linq.wasm",
      "mediaType": "application/wasm",
      "bytes": 33561,
      "sha256": "3deede108d14ee2ed41a654484f2c9c93a2653c0daf092c01b8350d29b33ed5b"
    },
    {
      "path": "wasm/System.Private.Xml.wasm",
      "mediaType": "application/wasm",
      "bytes": 547097,
      "sha256": "b130e3431a593f184b029fe7194d74fa10f9bc7505d2eaa5bc438494f5a7c587"
    },
    {
      "path": "wasm/System.Runtime.InteropServices.JavaScript.wasm",
      "mediaType": "application/wasm",
      "bytes": 43801,
      "sha256": "a70261ea59bfc0b914eeeaf52bc22d701fb5ec72813ce98a894724e27511347c"
    },
    {
      "path": "wasm/System.Runtime.Numerics.wasm",
      "mediaType": "application/wasm",
      "bytes": 126233,
      "sha256": "2ab3fefc415873fa69ca000b1e1cff539040d752704fe711b2451d3407290554"
    },
    {
      "path": "wasm/System.Security.Cryptography.wasm",
      "mediaType": "application/wasm",
      "bytes": 23321,
      "sha256": "0bfe39aa375d5e8002cc3829f35d7ee84b11b995028a7968053f7ea1b61a8900"
    },
    {
      "path": "wasm/System.Text.Encodings.Web.wasm",
      "mediaType": "application/wasm",
      "bytes": 29465,
      "sha256": "f27048d5d74dae235948f860c7c78da77d9763335dc0bb76949afea6fbc82fff"
    },
    {
      "path": "wasm/System.Text.Json.wasm",
      "mediaType": "application/wasm",
      "bytes": 305433,
      "sha256": "0ac3b4db1fa79ba48b22a1576ffe0eab80c5aba926054fd2527f735ea75a17dc"
    },
    {
      "path": "wasm/System.Text.RegularExpressions.wasm",
      "mediaType": "application/wasm",
      "bytes": 260377,
      "sha256": "ec7bdb6a5219b15003a26c0494352f2e91a0dacc963b18f72ae0d4f405f6852a"
    },
    {
      "path": "wasm/System.Xml.Linq.wasm",
      "mediaType": "application/wasm",
      "bytes": 4377,
      "sha256": "62e7bb6b78fc2f4037d34748f8549b13d6968f3cf40bb9f59f77187f049bfdab"
    },
    {
      "path": "wasm/System.wasm",
      "mediaType": "application/wasm",
      "bytes": 4889,
      "sha256": "75e5740d44db6340e50537d09dc6c8fd283e11bedd38dda75dbca894a7b2bd33"
    },
    {
      "path": "wasm/ZstdSharp.wasm",
      "mediaType": "application/wasm",
      "bytes": 292633,
      "sha256": "211c3225ddcc84c53dabaa775d7acc7609d45adf07de43273f2a06a0efbfdf58"
    },
    {
      "path": "wasm/dotnet.boot.js",
      "mediaType": "text/javascript",
      "bytes": 12888,
      "sha256": "8bf7ee298c98020b6efc5b7e75997b7395683323e6448147a9ec6ea38d3cae81"
    },
    {
      "path": "wasm/dotnet.js",
      "mediaType": "text/javascript",
      "bytes": 36540,
      "sha256": "0ff046434705dc039554fd09c69a8f8135f7910d1018511398f23e146f120918"
    },
    {
      "path": "wasm/dotnet.native.js",
      "mediaType": "text/javascript",
      "bytes": 220070,
      "sha256": "e52e6089fd6782baebde0096308d4541ac5b61f081b00762c30222b4d024d3b2"
    },
    {
      "path": "wasm/dotnet.native.wasm",
      "mediaType": "application/wasm",
      "bytes": 6897163,
      "sha256": "ca745072fc3b51b28fad4a3ef7c424065afa800541ce6d548ffe6759527cae9a"
    },
    {
      "path": "wasm/dotnet.runtime.js",
      "mediaType": "text/javascript",
      "bytes": 197545,
      "sha256": "16c75d28b03d90075f54a23495915a828d2badcfe035ed32ad5b4fefe0ffa8dd"
    },
    {
      "path": "wasm/main.mjs",
      "mediaType": "text/javascript",
      "bytes": 247,
      "sha256": "ffc1ff7690d9d44c0a96514b6be92229f6b6c376d45f6c71a56f4c26b3fec479"
    },
    {
      "path": "wasm/themes.css",
      "mediaType": "text/css",
      "bytes": 10461,
      "sha256": "f8a2a7bad1efd5305c9c5d134f64036d6a02a1bb252a3e609f49c776780987d3"
    }
  ]
};
