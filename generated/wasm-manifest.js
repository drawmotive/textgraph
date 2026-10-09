export default {
  "schemaVersion": 1,
  "packageName": "@drawmotive/textgraph",
  "packageVersion": "0.2.2-alpha.4",
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
    "commit": "be84f251d1a3c5154879ffb1706f550cf2e27b7a",
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
    "textgraph-fonts-v1"
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
      "bytes": 87317,
      "sha256": "07b7ce97bda54fdd3ca0b163928753955131f3ece8ab112548be849f393b350c"
    },
    {
      "path": "wasm/ExCSS.wasm",
      "mediaType": "application/wasm",
      "bytes": 289557,
      "sha256": "7354d17ae4ca035d9f1af9fd76abe8b4d289c532e186ee50b22c18b7e6699982"
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
      "bytes": 3978521,
      "sha256": "f7d2ca7a2f9d93e314d7d2e38234f49197cb5e89081c52bcf4c53e86a53c2ea9"
    },
    {
      "path": "wasm/Grpc.Core.Api.wasm",
      "mediaType": "application/wasm",
      "bytes": 7957,
      "sha256": "820f0b14fea87b381e41316cb1568cadad24b398563fce89f4d9b37e10b8ad8b"
    },
    {
      "path": "wasm/HarfBuzzSharp.wasm",
      "mediaType": "application/wasm",
      "bytes": 30485,
      "sha256": "21d1c00150aacc23bdc2b8a340da841b907172ac560a948fd15641682eea4e31"
    },
    {
      "path": "wasm/MagicOnion.Abstractions.wasm",
      "mediaType": "application/wasm",
      "bytes": 29973,
      "sha256": "05b5023f95e1afa39865c39db2f58f096106c0cce4ccf9c890d7c10d9606a1c9"
    },
    {
      "path": "wasm/MagicOnion.Serialization.MessagePack.wasm",
      "mediaType": "application/wasm",
      "bytes": 7445,
      "sha256": "5adf4177dea421de3a06ac8c29f7fccb9eef4024e646ec2d578cc7721abdafcf"
    },
    {
      "path": "wasm/MagicOnion.Shared.wasm",
      "mediaType": "application/wasm",
      "bytes": 7957,
      "sha256": "892cd914758fc1012e606f075e6c8695f88ede648095d4a53316ac523dcd3daa"
    },
    {
      "path": "wasm/Markdig.wasm",
      "mediaType": "application/wasm",
      "bytes": 501525,
      "sha256": "e8eecc5e6637f174b7fa36816e1ad0595448669e52cb30e343a1f6f031b0f2ea"
    },
    {
      "path": "wasm/Math.Core.wasm",
      "mediaType": "application/wasm",
      "bytes": 3241241,
      "sha256": "a5dcb82cad00d2e85b9b8e09cc140f9bfecfd5243571936172fc9c1a8241c6c9"
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
      "sha256": "63c95aacf7bb902be49398c55401368ebc8d87595ed65bcd178d9dda1b721a96"
    },
    {
      "path": "wasm/MessagePack.wasm",
      "mediaType": "application/wasm",
      "bytes": 382229,
      "sha256": "80e0efde4960a87125a8455e3548c32195ac8aa269c6b0d4b4ff856b1c14cc2d"
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
      "bytes": 2049096,
      "sha256": "bfb7bb691513f12e734dc346c03a03f784912432d7e3fa8e56efcf906fe86b3d"
    },
    {
      "path": "wasm/Polly.Core.wasm",
      "mediaType": "application/wasm",
      "bytes": 62741,
      "sha256": "f8ee04f0780f1107c25d5adce6a188387208b9d62c7ac05506c39f0cc3b58f10"
    },
    {
      "path": "wasm/Polly.wasm",
      "mediaType": "application/wasm",
      "bytes": 275733,
      "sha256": "35c57b82eb621870837dfd3aff00ecb9dfb6d1697ac4e1073616a55ace027481"
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
      "sha256": "73c0898ade1266d1b3113c9aacd122c1859cfddcdf5a2e6ec02cb89bd0b043df"
    },
    {
      "path": "wasm/SkiaSharp.HarfBuzz.wasm",
      "mediaType": "application/wasm",
      "bytes": 14613,
      "sha256": "8a2addae5691a3e23d32a971e09aa30a5c5883d21b6d339a047c7a932c8b227e"
    },
    {
      "path": "wasm/SkiaSharp.wasm",
      "mediaType": "application/wasm",
      "bytes": 102677,
      "sha256": "670bad27cab33b129d7219d9ecb08f84eac8030abe64353811aa361143cec921"
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
      "bytes": 8469,
      "sha256": "65284d5515120117e161edb5025bc12aca02090abe00aff279f098c70a2a2e74"
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
      "bytes": 108309,
      "sha256": "99645bd981c5648d1674f68487a9f1f94e5631468c97a80af450fbd4a87a5297"
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
      "sha256": "0402a653e9545a0c61b64999f2389e099796a3cd115b1199b36a2867a8aa67fa"
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
      "sha256": "7ee461cf0fa93b5d7b6cb01fe2981fcbd60136de4a7c043db3ed9585e3d69ac5"
    },
    {
      "path": "wasm/System.Memory.wasm",
      "mediaType": "application/wasm",
      "bytes": 20757,
      "sha256": "dfe7538a8f5fd7057d0fe05666e188c15f1be95cb6ad70420db255b7dd3bf504"
    },
    {
      "path": "wasm/System.Net.Http.wasm",
      "mediaType": "application/wasm",
      "bytes": 142101,
      "sha256": "5532cb0efd02b9f2fdd07667ef30cf5afd36aee4e0f06f66f92c1c2720f58b74"
    },
    {
      "path": "wasm/System.Net.Primitives.wasm",
      "mediaType": "application/wasm",
      "bytes": 7445,
      "sha256": "7929262d69d9dd1912c104c7eddba715733053e04ce02df9afd76f773012bd49"
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
      "sha256": "646cd447d337c46fa576831726510c161ca41ccd57334ee9c1c3522a79948230"
    },
    {
      "path": "wasm/System.Private.CoreLib.wasm",
      "mediaType": "application/wasm",
      "bytes": 2177817,
      "sha256": "b987ff1a51b77c02e481259a0edf55aa7ea6ab4b6a33fc6770c1e4907da69e39"
    },
    {
      "path": "wasm/System.Private.Uri.wasm",
      "mediaType": "application/wasm",
      "bytes": 68373,
      "sha256": "eea588aaee51076c8ab8831816190301d64f4c2f131df0564105c53a362ec946"
    },
    {
      "path": "wasm/System.Private.Xml.Linq.wasm",
      "mediaType": "application/wasm",
      "bytes": 37653,
      "sha256": "61474b4a57e1e264dea6baf0c90214c6c125ac96d87ef6d45a991e724289fef4"
    },
    {
      "path": "wasm/System.Private.Xml.wasm",
      "mediaType": "application/wasm",
      "bytes": 549141,
      "sha256": "36f2b30a7216ee98c21cc719db2357e1de46163bc05b7585453225df4a59b217"
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
      "sha256": "936500e89a8ea4057249ab51af04463554279df097efd77324bd43f5aeef0b63"
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
      "bytes": 251669,
      "sha256": "543bfbb2f3af04144ba040b78edf1cfcb8954b808227263cbd7bb2dbf9e95868"
    },
    {
      "path": "wasm/System.Text.RegularExpressions.wasm",
      "mediaType": "application/wasm",
      "bytes": 255253,
      "sha256": "62f1e990dfec44f1a2feaad21c21df5b1e88a4132b8ab7265f8aba084cb63ee8"
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
      "path": "wasm/System.Xml.Linq.wasm",
      "mediaType": "application/wasm",
      "bytes": 4373,
      "sha256": "7b9b71b657b457f8e567ee656b11defa4da8db17b01e1eba015a43ae3f325e57"
    },
    {
      "path": "wasm/System.Xml.XDocument.wasm",
      "mediaType": "application/wasm",
      "bytes": 4885,
      "sha256": "673f1c7e7bf2397b49ac18f910a1712a81d69ae3a0a3fbce2b057d128719d0c8"
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
      "bytes": 18023,
      "sha256": "70860e48b60926393c97b33b3c5b5e921c07993c861ad5273e5317005274ccfd"
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
      "bytes": 248697,
      "sha256": "432e3ef8049930253ad4580757a750b831660de5206e350d2c4b98236ecee763"
    },
    {
      "path": "wasm/dotnet.native.wasm",
      "mediaType": "application/wasm",
      "bytes": 6307594,
      "sha256": "97ea2d6f0eae159db5cf4d56d39ff1517148443cf183f74c9de732ac108049a3"
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
      "bytes": 3795,
      "sha256": "2a4e25471c5fbb29bd9639bc97311e1dea941ecd7f9cf9d720f18626811ff057"
    }
  ]
};
