export default {
  "schemaVersion": 1,
  "packageName": "@drawmotive/textgraph",
  "packageVersion": "0.2.1",
  "abiVersion": "1.0.0",
  "protocolVersion": 1,
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
        "family": "NotoSans-Regular",
        "asset": "wasm/NotoSans-Regular.ttf"
      },
      {
        "family": "FuzzyBubbles-Regular",
        "asset": "wasm/FuzzyBubbles-Regular.ttf"
      }
    ]
  },
  "targetFramework": "net10.0",
  "privateSource": {
    "commit": "f5a5e5d027072d1faa79ac9b25d5899d1380fdfd",
    "project": "DrawMotive.TextGraph.Bridge"
  },
  "entryAssembly": "wasm/DrawMotive.TextGraph.Bridge.wasm",
  "runtimeWasm": "wasm/dotnet.native.wasm",
  "runtimeConfig": "wasm/DrawMotive.TextGraph.Bridge.runtimeconfig.json",
  "capabilities": [
    "abi-handshake",
    "textgraph-parser-link",
    "textgraph-validate-v1",
    "textgraph-render-v1"
  ],
  "assets": [
    {
      "path": "wasm/DrawMotive.TextGraph.Bridge.runtimeconfig.json",
      "mediaType": "application/json",
      "bytes": 2469,
      "sha256": "72548b26dbef56140f55814296d36e4f9f7bc718a1d3f4f96b02c0562127184c"
    },
    {
      "path": "wasm/DrawMotive.TextGraph.Bridge.wasm",
      "mediaType": "application/wasm",
      "bytes": 77077,
      "sha256": "5fb230dae822fa7c70d2cc692ef149b0842bba7059025bf8791da7b447c08b14"
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
      "bytes": 3119385,
      "sha256": "42a630c1c6a6bd604ab9f314775f168b9316cce2ad9d39d263f8cd9c31720be8"
    },
    {
      "path": "wasm/Grpc.Core.Api.wasm",
      "mediaType": "application/wasm",
      "bytes": 7957,
      "sha256": "4cfce22b743760f635a9720d7cb295206c69a9128ab9ab32894057f6fd45370e"
    },
    {
      "path": "wasm/HarfBuzzSharp.wasm",
      "mediaType": "application/wasm",
      "bytes": 29461,
      "sha256": "76b07b4d990d3d329dac54bf21c298dff5d220dd62f81015bc6bf57dae1fa33c"
    },
    {
      "path": "wasm/MagicOnion.Abstractions.wasm",
      "mediaType": "application/wasm",
      "bytes": 29973,
      "sha256": "ab965b4f5a26e3f4958f113f827de474674c8bfca826c1ed545ca079308d2262"
    },
    {
      "path": "wasm/MagicOnion.Serialization.MessagePack.wasm",
      "mediaType": "application/wasm",
      "bytes": 7445,
      "sha256": "63ff304287c851439d62be1e89255c9d757eb387bf5c457553c953a91bf55606"
    },
    {
      "path": "wasm/MagicOnion.Shared.wasm",
      "mediaType": "application/wasm",
      "bytes": 7957,
      "sha256": "248275a87c1621c84287e054e9c7b5d9aa8ea1efade89a31d38788d083b2b0cd"
    },
    {
      "path": "wasm/Markdig.wasm",
      "mediaType": "application/wasm",
      "bytes": 492821,
      "sha256": "56cf8ee33d7d1aa2b0ded6d6dac3c37464b4fbf57a63b66aa989e28a48c1879f"
    },
    {
      "path": "wasm/Math.Core.wasm",
      "mediaType": "application/wasm",
      "bytes": 3241241,
      "sha256": "fb8f3284fc1c5f79e62c754fc5d146f0b3742c130c94ee293af04dc03892fb8a"
    },
    {
      "path": "wasm/MemoryPack.Core.wasm",
      "mediaType": "application/wasm",
      "bytes": 210197,
      "sha256": "f870f054a04cee5bffd3f6fa8c983d7ee57a33909cff0f55ffe5f7a6cd521f1b"
    },
    {
      "path": "wasm/MessagePack.Annotations.wasm",
      "mediaType": "application/wasm",
      "bytes": 18197,
      "sha256": "5fa4ff07684b7ec713455f11fae74fd62b1843741e768a864d84687b32d62cd4"
    },
    {
      "path": "wasm/MessagePack.wasm",
      "mediaType": "application/wasm",
      "bytes": 382229,
      "sha256": "938e5aedec6c70f25aa145b5171d66198f4173a45b4464c8ac07cd1358294120"
    },
    {
      "path": "wasm/Microsoft.AspNetCore.Components.Web.wasm",
      "mediaType": "application/wasm",
      "bytes": 6933,
      "sha256": "5e6d9fd642036dc4b2bac158ccaf5b43812a247859fa5382aa393bbbfbc03321"
    },
    {
      "path": "wasm/Microsoft.Extensions.DependencyInjection.Abstractions.wasm",
      "mediaType": "application/wasm",
      "bytes": 17685,
      "sha256": "89858c376eddf43ed484cb3e4495a85a1999946f5cfdce02304cb33d4fdef45b"
    },
    {
      "path": "wasm/Microsoft.Extensions.DependencyInjection.wasm",
      "mediaType": "application/wasm",
      "bytes": 46357,
      "sha256": "0c40b58482dc86c474f1f2852f0947fd77e81b01e5443d2c8eba434b665b4ff5"
    },
    {
      "path": "wasm/Microsoft.Extensions.Hosting.Abstractions.wasm",
      "mediaType": "application/wasm",
      "bytes": 5909,
      "sha256": "54c5c3f794e9f2872ecc6bc30021ab4d1f86ea2eb99e6c6de77a90224d833424"
    },
    {
      "path": "wasm/Microsoft.Extensions.Logging.Abstractions.wasm",
      "mediaType": "application/wasm",
      "bytes": 19221,
      "sha256": "db4d78d4fa5428496d5fc50050bef9bea40a4f3ecee2deb96d51693719d5b6ad"
    },
    {
      "path": "wasm/Microsoft.Extensions.Logging.wasm",
      "mediaType": "application/wasm",
      "bytes": 18709,
      "sha256": "b0352b3c8a62a746c2197ca5083ee3d5ba79ae20058a0dbdd08a85e1f847e2ac"
    },
    {
      "path": "wasm/Microsoft.Extensions.Options.wasm",
      "mediaType": "application/wasm",
      "bytes": 16661,
      "sha256": "a7931d1b2311518ce64e426f0aaac56f2f0e493b7050e5d05eccf3e2b39dde4b"
    },
    {
      "path": "wasm/Microsoft.Extensions.Primitives.wasm",
      "mediaType": "application/wasm",
      "bytes": 8469,
      "sha256": "a83187ecfca3dd919a4167d5c3970d93d24e30ddd71cdf6c68e6bf8f1a9e9141"
    },
    {
      "path": "wasm/Microsoft.NET.StringTools.wasm",
      "mediaType": "application/wasm",
      "bytes": 20245,
      "sha256": "d51555ce144bd87c7b93b039648b670a4cfd0913cfbd29934543cb0854911b6a"
    },
    {
      "path": "wasm/Nanoid.wasm",
      "mediaType": "application/wasm",
      "bytes": 9493,
      "sha256": "d950bfeeb6795c17573bd0b41c283a31de4712a912bebf03d50bb9de6052ba4d"
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
      "bytes": 629024,
      "sha256": "fe8c022f48d8dd29f17b744d16f9346f4357e16f7d4f7be58b000ae7c291b614"
    },
    {
      "path": "wasm/Polly.Core.wasm",
      "mediaType": "application/wasm",
      "bytes": 62741,
      "sha256": "98c3c6ba282189a96cf0b19cfe5deab1e39c259222be0c20b9c56733630794b4"
    },
    {
      "path": "wasm/Polly.wasm",
      "mediaType": "application/wasm",
      "bytes": 275733,
      "sha256": "7925d8f81d1447ba39bead70d3e318414f3895746c2918a3d613ffd9bb15f3a2"
    },
    {
      "path": "wasm/R3.BlazorWebAssembly.wasm",
      "mediaType": "application/wasm",
      "bytes": 8981,
      "sha256": "7edf1bf34d3ab23694c7c9cecc28dc58845f2101a1562fd90c95c60a809ee4cf"
    },
    {
      "path": "wasm/R3.wasm",
      "mediaType": "application/wasm",
      "bytes": 598805,
      "sha256": "41aa15c5ecf7e274c1088b7ff533a9d0306ae7269c6d11cddc9db8ec8942caeb"
    },
    {
      "path": "wasm/RBush.wasm",
      "mediaType": "application/wasm",
      "bytes": 24341,
      "sha256": "d1399c1a558d5e02860cae80f0978041fc77da2820a65a0f5902a4894a9e0eb2"
    },
    {
      "path": "wasm/SkiaSharp.HarfBuzz.wasm",
      "mediaType": "application/wasm",
      "bytes": 14613,
      "sha256": "73bda1dcc2f9304d3976a13883aca9613f26c81ccd6fb02204947c108c7613b2"
    },
    {
      "path": "wasm/SkiaSharp.wasm",
      "mediaType": "application/wasm",
      "bytes": 90389,
      "sha256": "a127da31100f5faa8b06d10d3e1381cce04de40c7811a9d80a88450a2d6a3d20"
    },
    {
      "path": "wasm/Stateless.wasm",
      "mediaType": "application/wasm",
      "bytes": 168725,
      "sha256": "116a652dff77a36a50c3808632f09360edb7e043304d7d6d4aa736c49f096c2c"
    },
    {
      "path": "wasm/System.Collections.Concurrent.wasm",
      "mediaType": "application/wasm",
      "bytes": 39189,
      "sha256": "05752be3ea6b72ec64966fabeeccec0e4b4521f3df71bf3fd3648f691cb3f7ad"
    },
    {
      "path": "wasm/System.Collections.Immutable.wasm",
      "mediaType": "application/wasm",
      "bytes": 137493,
      "sha256": "f8ca16c9d47f09d7a2fa1d11dc9c9d9c2634f6630d0e1ba25b0e958367a456bd"
    },
    {
      "path": "wasm/System.Collections.NonGeneric.wasm",
      "mediaType": "application/wasm",
      "bytes": 5397,
      "sha256": "ae2b971f88a17e86cb3886ae82f01a28fe93e3f47a7f26362aa9234c884472b9"
    },
    {
      "path": "wasm/System.Collections.Specialized.wasm",
      "mediaType": "application/wasm",
      "bytes": 10517,
      "sha256": "e3191a7fc9d96b723f0b5ac292a304c7280f00e6fe8436ac63fbe227408fe91b"
    },
    {
      "path": "wasm/System.Collections.wasm",
      "mediaType": "application/wasm",
      "bytes": 67861,
      "sha256": "114a690845d9e4970c2c149508c118c69ab073bc1e157c474e14473a56908159"
    },
    {
      "path": "wasm/System.ComponentModel.Annotations.wasm",
      "mediaType": "application/wasm",
      "bytes": 24853,
      "sha256": "fceca73a0da71359a08d94047e75dd2e4001e6407c5a43ab7ae8ef8040490c2b"
    },
    {
      "path": "wasm/System.ComponentModel.Primitives.wasm",
      "mediaType": "application/wasm",
      "bytes": 12053,
      "sha256": "1a14077cf79132fbc707418925cfe0e791cb98708f36bd012e442d9502b95f13"
    },
    {
      "path": "wasm/System.ComponentModel.TypeConverter.wasm",
      "mediaType": "application/wasm",
      "bytes": 103701,
      "sha256": "5fb96180203eb86865e869d5b919ecc437a01ccc1fa1343d12e82bfdae49ac59"
    },
    {
      "path": "wasm/System.ComponentModel.wasm",
      "mediaType": "application/wasm",
      "bytes": 4885,
      "sha256": "b55430bc5bab02b24b900e875a359bf0bb9fc9d0004ea55df1a2e28c76c5cc26"
    },
    {
      "path": "wasm/System.Console.wasm",
      "mediaType": "application/wasm",
      "bytes": 15125,
      "sha256": "9c7363041f54c658ce25bbd72d063925a1f286401a65c3f08261076a99a88fa9"
    },
    {
      "path": "wasm/System.Diagnostics.StackTrace.wasm",
      "mediaType": "application/wasm",
      "bytes": 4885,
      "sha256": "785d143cd1279d3bc86420cdb83413c13e11dfa24e5db682c6eccbca6800c69b"
    },
    {
      "path": "wasm/System.Diagnostics.Tracing.wasm",
      "mediaType": "application/wasm",
      "bytes": 4885,
      "sha256": "306582b37bccacf032e149982b846c9867dc723361c5330bf549048456caae76"
    },
    {
      "path": "wasm/System.IO.Compression.Brotli.wasm",
      "mediaType": "application/wasm",
      "bytes": 5397,
      "sha256": "178c6225cedf7c0bdc4e6ebb9353688c013cd933aa26eb4dd862e9f2782ec8b6"
    },
    {
      "path": "wasm/System.IO.Compression.wasm",
      "mediaType": "application/wasm",
      "bytes": 13077,
      "sha256": "2c4a4ceef580ee5d6901cf6aaabb9b6d775ba04c28a4e2c52b76bb54c74624b8"
    },
    {
      "path": "wasm/System.IO.Pipelines.wasm",
      "mediaType": "application/wasm",
      "bytes": 5909,
      "sha256": "29e11b130b9a2aafe7130b5d57e33fe82d768cce17b924724084dc182bc26721"
    },
    {
      "path": "wasm/System.Linq.Expressions.wasm",
      "mediaType": "application/wasm",
      "bytes": 367381,
      "sha256": "e1e026068b13204b5a67af96a556e02c29ad83b2be0c28aebda77476bc323149"
    },
    {
      "path": "wasm/System.Linq.wasm",
      "mediaType": "application/wasm",
      "bytes": 104213,
      "sha256": "a83503c71683f670c7e1c0d01038cb805181957f9057ee1362e50fdc1ffec29d"
    },
    {
      "path": "wasm/System.Memory.wasm",
      "mediaType": "application/wasm",
      "bytes": 18709,
      "sha256": "d1dfa622eb633bd607309582f6b970559ee2d6988dcc662692cf54817169a087"
    },
    {
      "path": "wasm/System.Net.Http.wasm",
      "mediaType": "application/wasm",
      "bytes": 135957,
      "sha256": "35ba6c164d8f5f825ec49cdfc9725e73021f005e6587424ee0cef8bed0ba3991"
    },
    {
      "path": "wasm/System.Net.Primitives.wasm",
      "mediaType": "application/wasm",
      "bytes": 7445,
      "sha256": "3ed89e38037dfea73f9fd5cf8f11242c64f200deca08dfbb7a30dfcc6bfd2bb0"
    },
    {
      "path": "wasm/System.Numerics.Vectors.wasm",
      "mediaType": "application/wasm",
      "bytes": 4885,
      "sha256": "a5f308b1c02e26e55461ffb7bd75b53106712b3b803ed1fb5be5a3ff6c93489b"
    },
    {
      "path": "wasm/System.ObjectModel.wasm",
      "mediaType": "application/wasm",
      "bytes": 16661,
      "sha256": "914d9dd053c0602076336b88a809de24fb23c9486103423e2fa0e99ef6eab973"
    },
    {
      "path": "wasm/System.Private.CoreLib.wasm",
      "mediaType": "application/wasm",
      "bytes": 2137369,
      "sha256": "2939e2316d088eb75308f3d685fc19272b08590bd82e6664a25ae236bdb61cc8"
    },
    {
      "path": "wasm/System.Private.Uri.wasm",
      "mediaType": "application/wasm",
      "bytes": 67349,
      "sha256": "bfa170614f25759ae28a52a1f865d834c4f8440a9e49d1745a709f0ac8a0547e"
    },
    {
      "path": "wasm/System.Reflection.Emit.ILGeneration.wasm",
      "mediaType": "application/wasm",
      "bytes": 4885,
      "sha256": "f73fb9d64dd8229a5e8a0bcc78fe8bef26ea6fb09a391326902505818bd7a400"
    },
    {
      "path": "wasm/System.Reflection.Emit.wasm",
      "mediaType": "application/wasm",
      "bytes": 14101,
      "sha256": "6ed3375c73f5dc035bdbae33ccf6513b629668104c6056c725ef8ada0a69aadc"
    },
    {
      "path": "wasm/System.Reflection.Primitives.wasm",
      "mediaType": "application/wasm",
      "bytes": 4885,
      "sha256": "0edbd407250cee2ba08be8996ce52a4530056bdff9ede33ab0400d232858788e"
    },
    {
      "path": "wasm/System.Runtime.InteropServices.JavaScript.wasm",
      "mediaType": "application/wasm",
      "bytes": 43285,
      "sha256": "be1c7f610e3413926d0869a6eaf7a61e9c5e0e0cd4e6f01752c2f67f1f8c1e2b"
    },
    {
      "path": "wasm/System.Runtime.InteropServices.wasm",
      "mediaType": "application/wasm",
      "bytes": 8981,
      "sha256": "24ea6123c5010df4583cca0f5565fabed6c8bc89765f926b7c2fe61edbe1ee4b"
    },
    {
      "path": "wasm/System.Runtime.Intrinsics.wasm",
      "mediaType": "application/wasm",
      "bytes": 5397,
      "sha256": "79a92a3b33a4a74323fd61b48b47ee2b47b817f744373c02f8017949799ab6dd"
    },
    {
      "path": "wasm/System.Runtime.Loader.wasm",
      "mediaType": "application/wasm",
      "bytes": 4885,
      "sha256": "51a4c5fec047c77890a50f683ce45ddb32c8ff4b2a5963072eb795ecd279a117"
    },
    {
      "path": "wasm/System.Runtime.Numerics.wasm",
      "mediaType": "application/wasm",
      "bytes": 103701,
      "sha256": "c46149f9bac1516a09a83a7228241e3c1c7e3a441dd9318ee896b38d426c1637"
    },
    {
      "path": "wasm/System.Runtime.Serialization.Primitives.wasm",
      "mediaType": "application/wasm",
      "bytes": 5909,
      "sha256": "580c09b8a853434c0bad966e09d8e6818ae2352f12af4171ac3fe320a48ffbd5"
    },
    {
      "path": "wasm/System.Runtime.wasm",
      "mediaType": "application/wasm",
      "bytes": 16661,
      "sha256": "34e0ec9e4c89611222118f1c8aba302f1faa0f9bb99aaa109223335fc7965436"
    },
    {
      "path": "wasm/System.Security.Cryptography.wasm",
      "mediaType": "application/wasm",
      "bytes": 22805,
      "sha256": "a59182f319a7fa8392e67746f5e4145e34315cb80a3433970a67709e4e17f403"
    },
    {
      "path": "wasm/System.Text.Encoding.Extensions.wasm",
      "mediaType": "application/wasm",
      "bytes": 4885,
      "sha256": "c65cc35da10df0194967f726c69be30dba58aa65c09d4f52ee9361135d302fbe"
    },
    {
      "path": "wasm/System.Text.Encodings.Web.wasm",
      "mediaType": "application/wasm",
      "bytes": 29461,
      "sha256": "c985076071a1725ab5eadcd76fa7e26108992d280329db82c28201fa52e92af2"
    },
    {
      "path": "wasm/System.Text.Json.wasm",
      "mediaType": "application/wasm",
      "bytes": 242965,
      "sha256": "4546fc910d6dddc2c2647925c8153a15a32635ae1b63c425e3c037a69796434d"
    },
    {
      "path": "wasm/System.Text.RegularExpressions.wasm",
      "mediaType": "application/wasm",
      "bytes": 257813,
      "sha256": "1f05b9b96dd64dd8ef0b9244f44a0a8e8e09594fcd6697956c44c7e22667bf37"
    },
    {
      "path": "wasm/System.Threading.Channels.wasm",
      "mediaType": "application/wasm",
      "bytes": 35093,
      "sha256": "e09cc8a78afb88cc2180e43b3efbdf653104041c7daf55c507b95c6402ad62be"
    },
    {
      "path": "wasm/System.Threading.Thread.wasm",
      "mediaType": "application/wasm",
      "bytes": 4885,
      "sha256": "cfff6ca7df35dc84d7949522d1098e50f311357efb055cceeb25346c82acb3fc"
    },
    {
      "path": "wasm/System.Threading.ThreadPool.wasm",
      "mediaType": "application/wasm",
      "bytes": 4885,
      "sha256": "2e8ff0649da5f791c42e05f3e20e6b7e8368bc3c5693d89e8c3d6f66747de2fe"
    },
    {
      "path": "wasm/System.Threading.wasm",
      "mediaType": "application/wasm",
      "bytes": 12053,
      "sha256": "df703fe777721d1805cb50d032a67264a73a267ef01a2543e9eeb29b175cbb44"
    },
    {
      "path": "wasm/System.wasm",
      "mediaType": "application/wasm",
      "bytes": 4885,
      "sha256": "bcf126d8aaa05eaaee1b09f3ef5f224a0983a01f089a0ee21f71733b9edbd118"
    },
    {
      "path": "wasm/ZstdSharp.wasm",
      "mediaType": "application/wasm",
      "bytes": 396565,
      "sha256": "291ddc007c01eb1b2fc3459778270ff0e9d31cf7a16d307327955b5f9be53955"
    },
    {
      "path": "wasm/dotnet.boot.js",
      "mediaType": "text/javascript",
      "bytes": 17141,
      "sha256": "38a942cbb9bd0df00af223fa0b1b0f4080a2de476c5367c7b10c7b435e1f1a52"
    },
    {
      "path": "wasm/dotnet.js",
      "mediaType": "text/javascript",
      "bytes": 37898,
      "sha256": "ba72088a45591210f9a08fec223b0f848a0a4d3245026ae9479353596c7fa89d"
    },
    {
      "path": "wasm/dotnet.native.js",
      "mediaType": "text/javascript",
      "bytes": 248270,
      "sha256": "d53e77206394560939d72a9d57269a38b611a3cf9cd32d5c6403a802f3346bd4"
    },
    {
      "path": "wasm/dotnet.native.wasm",
      "mediaType": "application/wasm",
      "bytes": 6020218,
      "sha256": "47c90388819f90efd0f47c926f32dd4db28981e5de84548d17a07ee7f48e3d02"
    },
    {
      "path": "wasm/dotnet.runtime.js",
      "mediaType": "text/javascript",
      "bytes": 198480,
      "sha256": "41b9eaad9187b46abbc2e752d7bfc06043e91fd264a61aecc959650fa24799db"
    },
    {
      "path": "wasm/main.mjs",
      "mediaType": "text/javascript",
      "bytes": 247,
      "sha256": "ffc1ff7690d9d44c0a96514b6be92229f6b6c376d45f6c71a56f4c26b3fec479"
    },
    {
      "path": "wasm/netstandard.wasm",
      "mediaType": "application/wasm",
      "bytes": 5909,
      "sha256": "1632bdba86f760692ce5ae566e0f3a184e8c67ad5de9307ff272cb3cb5377ca8"
    },
    {
      "path": "wasm/themes.css",
      "mediaType": "text/css",
      "bytes": 3003,
      "sha256": "1edc0bd9a68927c53806fa4779d5f0e9e19b44f2b355b61c4128752074656287"
    }
  ]
};
