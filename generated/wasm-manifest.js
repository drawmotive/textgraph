export default {
  "schemaVersion": 1,
  "packageName": "@drawmotive/textgraph",
  "packageVersion": "0.3.0",
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
    "commit": "b601abb9aaa52d4d466eec7c70861d822fe06054",
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
      "sha256": "4f07abdfdbdfad4fa5a6cc200e754936157f2b7405cae6f7bfdde4e32f65d5aa"
    },
    {
      "path": "wasm/DrawMotive.TextGraph.Bridge.wasm",
      "mediaType": "application/wasm",
      "bytes": 87317,
      "sha256": "7346c72683925954682e29bf6c5506f209c6805bbb881b1bf122c3e86da5a772"
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
      "bytes": 4131609,
      "sha256": "fbc1faf1f4290e429b8ad6390180f87774702a61d2b9ce00f85548a9c65724a4"
    },
    {
      "path": "wasm/Grpc.Core.Api.wasm",
      "mediaType": "application/wasm",
      "bytes": 7957,
      "sha256": "43c8b14cc2ba3ec833f899e425383ee9cbb185255bc3cd6480b114cfdbcf4100"
    },
    {
      "path": "wasm/HarfBuzzSharp.wasm",
      "mediaType": "application/wasm",
      "bytes": 30485,
      "sha256": "1ef749ff978aadc71c30a54b08bb18bf21d59a950fe274ed2e1d26b4b97f1e9c"
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
      "sha256": "c89ae54305b0b9d0d08c898c05f87c385820b0f84c464c64a95861e865e7697f"
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
      "sha256": "a9077d21b4b484c01b195d4190752da28d825c72ae09008c395393dd70773668"
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
      "bytes": 107285,
      "sha256": "e04168cbcbdcb27038b0652626796695e86d3d54093eec1c89178b64a25d322f"
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
      "sha256": "e85f55450b76b0abf5b60677bcd72940850d92046c6582cdd69699c46b77b7bf"
    },
    {
      "path": "wasm/System.Collections.Immutable.wasm",
      "mediaType": "application/wasm",
      "bytes": 137493,
      "sha256": "ab53f0e15baa6b40327f9069670502c4f4616fd14aa0a1c746f961911a40119d"
    },
    {
      "path": "wasm/System.Collections.NonGeneric.wasm",
      "mediaType": "application/wasm",
      "bytes": 8469,
      "sha256": "c99bfe836900f4abe5dcbbe746048b37be559fe9e7372f50bc75733f21866f46"
    },
    {
      "path": "wasm/System.Collections.Specialized.wasm",
      "mediaType": "application/wasm",
      "bytes": 10517,
      "sha256": "278351cb4b8fbd52b1acf96d14ea3db4bbce0047adbe25068414142164be5b42"
    },
    {
      "path": "wasm/System.Collections.wasm",
      "mediaType": "application/wasm",
      "bytes": 67861,
      "sha256": "e8ddf1dd579a0efa1e1818c4c0bc1da393bceae74ee12543ed27f91f21f2d38c"
    },
    {
      "path": "wasm/System.ComponentModel.Annotations.wasm",
      "mediaType": "application/wasm",
      "bytes": 24853,
      "sha256": "b45a8753d57248e1909d4130a13590ac493a2a01af759b002b2706e8b995c4bc"
    },
    {
      "path": "wasm/System.ComponentModel.Primitives.wasm",
      "mediaType": "application/wasm",
      "bytes": 12053,
      "sha256": "303a291c21496354c0662f4137b4b0d988977dd8f9fd689c112fb1298b38c5a4"
    },
    {
      "path": "wasm/System.ComponentModel.TypeConverter.wasm",
      "mediaType": "application/wasm",
      "bytes": 108309,
      "sha256": "8ffa8f785bb8657c7393beb8174d33773d694d70eedb72c24a82d4462ba4b1c5"
    },
    {
      "path": "wasm/System.ComponentModel.wasm",
      "mediaType": "application/wasm",
      "bytes": 4885,
      "sha256": "3c7ef8f5f1292b78964f719469d82e906db036c2302d93b401eea40d437ccb20"
    },
    {
      "path": "wasm/System.Console.wasm",
      "mediaType": "application/wasm",
      "bytes": 15125,
      "sha256": "af337b8f9160808d97bdd58c1b2c8e90c123ea637116285f200eda03e6e75bb9"
    },
    {
      "path": "wasm/System.Diagnostics.StackTrace.wasm",
      "mediaType": "application/wasm",
      "bytes": 4885,
      "sha256": "a2e6ae4931d062b957ace275f5ec3d7e26d1429c9f8257ad055e6c4665ef5d6d"
    },
    {
      "path": "wasm/System.Diagnostics.Tracing.wasm",
      "mediaType": "application/wasm",
      "bytes": 4885,
      "sha256": "59f8c89737cb2ae4e4ebd890232a877818008b612d152c02658f3bea31011ac3"
    },
    {
      "path": "wasm/System.IO.Compression.Brotli.wasm",
      "mediaType": "application/wasm",
      "bytes": 5397,
      "sha256": "36a462af0f1d9f22efc6c5c06c2816276989cd5d480d456d77268e4640c348e4"
    },
    {
      "path": "wasm/System.IO.Compression.wasm",
      "mediaType": "application/wasm",
      "bytes": 13077,
      "sha256": "0402ab937993d40b0c8bcad17fefee240682b62bf5835fa1f0e53e0df8352473"
    },
    {
      "path": "wasm/System.IO.Pipelines.wasm",
      "mediaType": "application/wasm",
      "bytes": 5909,
      "sha256": "5bc2953080267be65774234312e79ab4328c0ac40492d89c3b782fed681cfc5e"
    },
    {
      "path": "wasm/System.Linq.Expressions.wasm",
      "mediaType": "application/wasm",
      "bytes": 367381,
      "sha256": "c161aa95736a5e297e8855e169686682be8761dd1763c27b101a7cbe190a3423"
    },
    {
      "path": "wasm/System.Linq.wasm",
      "mediaType": "application/wasm",
      "bytes": 104213,
      "sha256": "76907b943b5c1128485757c3f4466c4d84e271573bea4cc5317869c4bd9785f2"
    },
    {
      "path": "wasm/System.Memory.wasm",
      "mediaType": "application/wasm",
      "bytes": 20757,
      "sha256": "abdf795d6113887f70661933ae667c9da3223ac19f6edede2bbf5f80710d1b68"
    },
    {
      "path": "wasm/System.Net.Http.wasm",
      "mediaType": "application/wasm",
      "bytes": 139541,
      "sha256": "d38b76f63577fe3ac3fa84fff0bd15527edefd52c663e0beeb2d5a3536dc0816"
    },
    {
      "path": "wasm/System.Net.Primitives.wasm",
      "mediaType": "application/wasm",
      "bytes": 7445,
      "sha256": "88bce431593e7e8f84d8ee0f906c75f874573476871c5c7a1ba585924790efe2"
    },
    {
      "path": "wasm/System.Numerics.Vectors.wasm",
      "mediaType": "application/wasm",
      "bytes": 4885,
      "sha256": "b843d7d79fb44ce72c11c276d923e4385075a92f68bb0c1e0d5b7414774a4878"
    },
    {
      "path": "wasm/System.ObjectModel.wasm",
      "mediaType": "application/wasm",
      "bytes": 16661,
      "sha256": "6e9c9c9e081dfa61da95eb6c6d55114e6e383531713d45cde99a05f0bb2331fc"
    },
    {
      "path": "wasm/System.Private.CoreLib.wasm",
      "mediaType": "application/wasm",
      "bytes": 2182937,
      "sha256": "3cb9616276a4d0463d8862e3ad245a141f5953333ac7edef9b59aa5dfefe6bb8"
    },
    {
      "path": "wasm/System.Private.Uri.wasm",
      "mediaType": "application/wasm",
      "bytes": 68373,
      "sha256": "b28a82443eb0d9ce6cf7ace87d58176e33e180a00294451ce1c9a9ccdbeeff08"
    },
    {
      "path": "wasm/System.Private.Xml.Linq.wasm",
      "mediaType": "application/wasm",
      "bytes": 37653,
      "sha256": "fb6ec8fcc3d4dc26727325301c295d6804a5953c3af04d330bda98cfa39ee8ff"
    },
    {
      "path": "wasm/System.Private.Xml.wasm",
      "mediaType": "application/wasm",
      "bytes": 549653,
      "sha256": "4e0b77f55b68c25b4816c16a87718abae386e355387d9745bbad468d55c3196e"
    },
    {
      "path": "wasm/System.Reflection.Emit.ILGeneration.wasm",
      "mediaType": "application/wasm",
      "bytes": 4885,
      "sha256": "8a95707dfebdfbf4f46b88b88c2e31b64c666653cf7cfc436ac5c251b043deba"
    },
    {
      "path": "wasm/System.Reflection.Emit.wasm",
      "mediaType": "application/wasm",
      "bytes": 14101,
      "sha256": "5ac7d3656d8f6d58dd9f99ad0e2e7798b133e0498b9a764ead1b3872c6dc63f8"
    },
    {
      "path": "wasm/System.Reflection.Primitives.wasm",
      "mediaType": "application/wasm",
      "bytes": 4885,
      "sha256": "4967913cac03b56c728a0ec90422fed615aa4bb2fc3d857791f4f45df203a331"
    },
    {
      "path": "wasm/System.Runtime.InteropServices.JavaScript.wasm",
      "mediaType": "application/wasm",
      "bytes": 43285,
      "sha256": "e49f3d7ece4b3ba9a50b737cf8dfee63bbf33950a35882336392b605a53f2cc4"
    },
    {
      "path": "wasm/System.Runtime.InteropServices.wasm",
      "mediaType": "application/wasm",
      "bytes": 8981,
      "sha256": "be78604531b9b0963fb0c07f4f0f764a1cedfbe7c1cd3c883968e5be5dfdeb7c"
    },
    {
      "path": "wasm/System.Runtime.Intrinsics.wasm",
      "mediaType": "application/wasm",
      "bytes": 5397,
      "sha256": "d4f839a95b2b4889f1f3782ddb415a455f394c4085e12beda4a5bec2f994b4f3"
    },
    {
      "path": "wasm/System.Runtime.Loader.wasm",
      "mediaType": "application/wasm",
      "bytes": 4885,
      "sha256": "1e1d918681bcdc1607da65e52fc6ab69c4df482f552d910dfac115e3c8e38965"
    },
    {
      "path": "wasm/System.Runtime.Numerics.wasm",
      "mediaType": "application/wasm",
      "bytes": 103701,
      "sha256": "54c381315b28d89c9176f3bfa4c922c08c4c6a37d0d2e50b5f15131493b45e91"
    },
    {
      "path": "wasm/System.Runtime.Serialization.Primitives.wasm",
      "mediaType": "application/wasm",
      "bytes": 5909,
      "sha256": "16d4b8bef1345f3b6d9f31f8b94b952a3857aa66c4afb9560ba556f8b897d739"
    },
    {
      "path": "wasm/System.Runtime.wasm",
      "mediaType": "application/wasm",
      "bytes": 16661,
      "sha256": "f03bb9aaf22bff405f2163e24cf10b32a16b4a9a02469208b56653fce653ab4a"
    },
    {
      "path": "wasm/System.Security.Cryptography.wasm",
      "mediaType": "application/wasm",
      "bytes": 22805,
      "sha256": "e24abd407abb03bbfe98a5eef0053238596b043afa4ddc9996c87576af5e0d55"
    },
    {
      "path": "wasm/System.Text.Encoding.Extensions.wasm",
      "mediaType": "application/wasm",
      "bytes": 4885,
      "sha256": "52383629de2efaca03e61108774591a5d540eea3d9442278d58fc317fefd0b16"
    },
    {
      "path": "wasm/System.Text.Encodings.Web.wasm",
      "mediaType": "application/wasm",
      "bytes": 29461,
      "sha256": "2953a62df2c680568e54dc5ff0a6faa8a6d7d57a6984411c9895f9cddd782836"
    },
    {
      "path": "wasm/System.Text.Json.wasm",
      "mediaType": "application/wasm",
      "bytes": 251669,
      "sha256": "c74dd2dc4ef745b4a1f55c7d9d7eeb1cfa96ea63c9f61202474880177faa1ee7"
    },
    {
      "path": "wasm/System.Text.RegularExpressions.wasm",
      "mediaType": "application/wasm",
      "bytes": 255253,
      "sha256": "586cc47a9d862de630f0aa47b436c1092411784a0950943783762ed8a0387153"
    },
    {
      "path": "wasm/System.Threading.Channels.wasm",
      "mediaType": "application/wasm",
      "bytes": 35093,
      "sha256": "cbea5f84f17f7ad0f1c4cdb69e7a294838a00f2065c4069ab326f645e4835e49"
    },
    {
      "path": "wasm/System.Threading.Thread.wasm",
      "mediaType": "application/wasm",
      "bytes": 4885,
      "sha256": "bb2674e04fe88678c6a185e7b7e208241391dc9c8bd49f1a5935f10de311815a"
    },
    {
      "path": "wasm/System.Threading.ThreadPool.wasm",
      "mediaType": "application/wasm",
      "bytes": 4885,
      "sha256": "7f8dd1931d9a42b5198b5efeba3395c419a26c698031133f025a5ff5317f0a8e"
    },
    {
      "path": "wasm/System.Threading.wasm",
      "mediaType": "application/wasm",
      "bytes": 12053,
      "sha256": "84ecd4796e9d10c40fa62316844301ab3ee636e30516997fe55253f53f2f7811"
    },
    {
      "path": "wasm/System.Xml.Linq.wasm",
      "mediaType": "application/wasm",
      "bytes": 4373,
      "sha256": "6e29ce5b5c36df5495e076925a15bf36936dda1715691a6f5c393917589ff749"
    },
    {
      "path": "wasm/System.Xml.XDocument.wasm",
      "mediaType": "application/wasm",
      "bytes": 4885,
      "sha256": "5bdb1b75174f503c772bd8d9c6fadc965a3fa6b05767d4bca800e2e18928d81d"
    },
    {
      "path": "wasm/System.wasm",
      "mediaType": "application/wasm",
      "bytes": 4885,
      "sha256": "3a2d99557930d8998ff8c04b61fe7a67d42864f8eb0bdbd8bb2536714ac0ec43"
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
      "sha256": "7b712b02baa3489ee4525289694087b17813ee91c72b6b44c3651f03b28bfd48"
    },
    {
      "path": "wasm/dotnet.js",
      "mediaType": "text/javascript",
      "bytes": 37898,
      "sha256": "0501da3cf18e752361a4d3af7880c7ff2fd65e6d8ade7e19601c993d622cb68e"
    },
    {
      "path": "wasm/dotnet.native.js",
      "mediaType": "text/javascript",
      "bytes": 248699,
      "sha256": "fef2c2d4d594af6a2c2ccfd033b5794668c667e7585766bca6c4a0ca44717112"
    },
    {
      "path": "wasm/dotnet.native.wasm",
      "mediaType": "application/wasm",
      "bytes": 6921699,
      "sha256": "3ad668b79d97c3553c59ccfde963c2d9d5bc6af5ee7d9aec3876c0fef00ba54a"
    },
    {
      "path": "wasm/dotnet.runtime.js",
      "mediaType": "text/javascript",
      "bytes": 198480,
      "sha256": "9ae374efa1e0c8e0a801a89def30fb6b6fc637b690eed98afc1cdd9ca830efc8"
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
      "sha256": "caf8423ba0fa797f48097d5aefc011310afc7908c1b9c5688b969f5e2985c690"
    },
    {
      "path": "wasm/themes.css",
      "mediaType": "text/css",
      "bytes": 3795,
      "sha256": "2a4e25471c5fbb29bd9639bc97311e1dea941ecd7f9cf9d720f18626811ff057"
    }
  ]
};
