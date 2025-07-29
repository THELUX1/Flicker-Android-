const hiddenMovies = [
    
];
const manualMovies = [
{
      id: 1061474,
          title: "Superman",
          image: "https://s3.fiestareel.com/image/t/p/w500/ombsmhYUqR4qqOLOxAyr5V8hbyv.jpg",
          link: "detalles.html?type=movie&id=1061474",
          year: "2025",
          genres: ["Ciencia ficción", "Acción", "Aventura"] // <-- Asegúrate de que esto esté definido
      },
{
      id: 1287536,
          title: "Dora y la Búsqueda del Sol Dorado",
          image: "https://s3.fiestareel.com/image/t/p/w500/r3d6u2n7iPoWNsSWwlJJWrDblOH.jpg",
          link: "detalles.html?type=movie&id=1287536",
          year: "2025",
          genres: ["Familia", "Comedia", "Familia"] // <-- Asegúrate de que esto esté definido
      },
      {
      id: 1087192,
          title: "Cómo entrenar a tu dragón",
          image: "https://s3.fiestareel.com/image/t/p/w500/41dfWUWtg1kUZcJYe6Zk6ewxzMu.jpg",
          link: "detalles.html?type=movie&id=1087192",
          year: "2025",
          genres: ["Fantasía", "Familia", "Acción"] // <-- Asegúrate de que esto esté definido
      },
{
          id: 1071585,
          title: "M3GAN 2.0",
          image: "https://s3.fiestareel.com/image/t/p/w500/4a63rQqIDTrYNdcnTXdPsQyxVLo.jpg",
          link: "detalles.html?type=movie&id=1071585",
          year: "2025",
          genres: ["Acción", "Ciencia ficción", "Suspenso"]
      },
      {
          id: 1011477,
          title: "Karate Kid: Leyendas",
          image: "https://s3.fiestareel.com/image/t/p/w500/AEgggzRr1vZCLY86MAp93li43z.jpg",
          link: "detalles.html?type=movie&id=1011477",
          year: "2025",
          genres: ["Acción", "Aventura", "Drama"]
      },
      {
          id: 846422,
          title: "La vieja guardia 2",
          image: "https://s3.fiestareel.com/image/t/p/w500/wqfu3bPLJaEWJVk3QOm0rKhxf1A.jpg",
          link: "detalles.html?type=movie&id=846422",
          year: "2025",
          genres: ["Acción", "Fantasía"]
      },
      {
          id: 1234821,
          title: "Jurassic World: Renace",
          image: "https://s3.fiestareel.com/image/t/p/w500/q0fGCmjLu42MPlSO9OYWpI5w86I.jpg",
          link: "detalles.html?type=movie&id=1234821",
          year: "2025",
          genres: ["Acción", "Ciencia ficción", "Aventura"]
      },
      {
          id: 1100988,
          title: "Exterminio: La evolución",
          image: "https://s3.fiestareel.com/image/t/p/w500/giAiJSwOJcfA8Y4PCNMGAhfTSyA.jpg",
          link: "detalles.html?type=movie&id=1100988",
          year: "2025",
          genres: ["Terror","Suspenso","Ciencia ficción"]
      },
      {
          id: 749170,
          title: "Jefes de Estado",
          image: "https://s3.fiestareel.com/image/t/p/w500/lVgE5oLzf7ABmzyASEVcjYyHI41.jpg",
          link: "detalles.html?type=movie&id=749170",
          year: "2025",
          genres: ["Acción", "Comedia", "Suspenso"]
      },
      {
          id: 803796,
          title: "Las guerreras k-pop",
          image: "https://s3.fiestareel.com/image/t/p/w500/jfS5KEfiwsS35ieZvdUdJKkwLlZ.jpg",
          link: "detalles.html?type=movie&id=803796",
          year: "2025",
          genres: ["Animación","Música","Fantasía", "Acción","Comedia"]
      },
      {
      id: 1450599,
          title: "K.O.",
          image: "https://s.lupacine.com/image/t/p/w500/r46leE6PSzLR3pnVzaxx5Q30yUF.jpg",
          link: "detalles.html?type=movie&id=1450599",
          year: "2025",
          genres: ["Acción", "Drama", "Aventura"] // <-- Asegúrate de que esto esté definido
      },
      {
          id: 1239193,
          title: "Actores encubiertos",
          image: "https://s3.fiestareel.com/image/t/p/w500/1vXTHTbSQJs9r2hp4Uk08XzKwPp.jpg",
          link: "detalles.html?type=movie&id=1239193",
          year: "2025",
          genres: ["Acción", "Comedia", "Crímen"]
      },
      {
          id: 1097311,
          title: "Echo Valley",
          image: "https://s3.fiestareel.com/image/t/p/w500/3Ey3HuqZdrx1rfxRkfiOXDFtvtl.jpg",
          link: "detalles.html?type=movie&id=1097311",
          year: "2025",
          genres: ["Drama", "Suspenso"]
      },
      {
          id: 1426680,
          title: "Nuestros Tiempos",
          image: "https://s3.fiestareel.com/image/t/p/w500/iJWSUAMJI9mRSzVBJXVUg7iIoJM.jpg",
          link: "detalles.html?type=movie&id=1426680",
          year: "2025",
          genres: ["Ciencia ficción", "Romance", "Comedia"]
      },
      {
          id: 1376434,
          title: "Predator: Killer of Killers",
          image: "https://media.themoviedb.org/t/p/w260_and_h390_bestv2/8upWJ1KTR1bAPqXCHAuVOhfuiAZ.jpg",
          link: "detalles.html?type=movie&id=1376434",
          year: "2025",
          genres: ["Animación", "Ciencia ficción", "Acción"]
      },
      {
          id: 1001414,
          title: "Fear Street: Prom Queen",
          image: "https://s.lupacine.com/image/t/p/w500/gevScWYkF8l5i9NjFSXo8HfPNyy.jpg",
          link: "detalles.html?type=movie&id=1001414",
          year: "2025",
          genres: ["Terror", "Suspenso"]
      },
      {
          id: 1390394,
          title: "Vini Jr.",
          image: "https://s3.fiestareel.com/image/t/p/w500/4ImGMcwpy4k2zmcXBSFYNK6kRr9.jpg",
          link: "detalles.html?type=movie&id=1390394",
          year: "2025",
          genres: ["Documental"]
      },
      {
          id: 1098006,
          title: "La fuente de la eterna juventud",
          image: "https://s3.fiestareel.com/image/t/p/w500/4iWjGghUj2uyHo2Hyw8NFBvsNGm.jpg",
          link: "detalles.html?type=movie&id=1098006",
          year: "2025",
          genres: ["Aventura", "Fantasía", "Misterio"]
      },
      {
          id: 552524,
          title: "Lilo y Stitch",
          image: "https://s3.fiestareel.com/image/t/p/w500/Y6pjszkKQUZ5uBbiGg7KWiCksJ.jpg",
          link: "detalles.html?type=movie&id=552524",
          year: "2025",
          genres: ["Familia", "Comedia", "Ciencia ficción"]
      },
      {
          id: 574475,
          title: "Destino final lazos de sangre",
          image: "https://s3.fiestareel.com/image/t/p/w500/6WxhEvFsauuACfv8HyoVX6mZKFj.jpg",
          link: "detalles.html?type=movie&id=574475",
          year: "2025",
          genres: ["Terror", "Misterio"]
      },
      {
          id: 896536,
          title: "La Leyenda de Ochi",
          image: "https://s3.fiestareel.com/image/t/p/w500/qYyEelO4JfOwE0Ui5KsrCE0O8UA.jpg",
          link: "detalles.html?type=movie&id=896536",
          year: "2025",
          genres: ["Fantasía", "Aventura", "Familia"]
      },
      {
          id: 650033,
          title: "Gravedad cero",
          image: "https://s3.fiestareel.com/image/t/p/w500/oY1b65zg8IwsbNdr7SEiQ7ohZ7u.jpg",
          link: "detalles.html?type=movie&id=650033",
          year: "2025",
          genres: ["Ciencia ficción", "Suspenso"]
      },
      {
          id: 661539,
          title: "Un completo desconocido",
          image: "https://s.lupacine.com/image/t/p/w500/llWl3GtNoXosbvYboelmoT459NM.jpg",
          link: "detalles.html?type=movie&id=661539",
          year: "2024",
          genres: ["Drama", "Música", "Historia"]
      },
      {
      id: 1069387,
          title: "Pedro Páramo",
          image: "https://s3.fiestareel.com/image/t/p/w500/gugzjPIalz5hy2RbVxqXCpXWanj.jpg",
          link: "detalles.html?type=movie&id=1069387",
          year: "2024",
          genres: ["Drama", "Misterio", "Suspenso", "Terror","Fantasía", "Western"] // <-- Asegúrate de que esto esté definido
      },
      {
          id: 1061699,
          title: "Seis Triple Ocho",
          image: "https://s.lupacine.com/image/t/p/w500/7tvAnzZj9e9AjdoHaN9jshm2Cjw.jpg",
          link: "detalles.html?type=movie&id=1061699",
          year: "2024",
          genres: ["Drama", "Historia", "Bélica"]
      },
      {
      id: 1241436,
          title: "Tiempo de guerra",
          image: "https://s3.fiestareel.com/image/t/p/w500/srj9rYrjefyWqkLc6l2xjTGeBGO.jpg",
          link: "detalles.html?type=movie&id=1241436",
          year: "2025",
          genres: ["Bélica", "Acción"] // <-- Asegúrate de que esto esté definido
      },
      {
          id: 906126,
          title: "La sociedad de la nieve",
          image: "https://s3.fiestareel.com/image/t/p/w500/2e853FDVSIso600RqAMunPxiZjq.jpg",
          link: "detalles.html?type=movie&id=906126",
          year: "2023",
          genres: ["Historia", "Drama"]
      },
      {
          id: 850920,
          title: "Escapada de espanto",
          image: "https://s3.fiestareel.com/image/t/p/w500/5lMu14IMuHo0hKYCwCIogt7IioX.jpg",
          link: "detalles.html?type=movie&id=850920",
          year: "2025",
          genres: ["Terror", "Comedia"]
      },
      {
          id: 1075456,
          title: "O'Dessa",
          image: "https://s.lupacine.com/image/t/p/w500/xbdRxyr1u5dbhvMm14w7J1jJWQS.jpg",
          link: "detalles.html?type=movie&id=1075456",
          year: "2025",
          genres: ["Música", "Drama", "Ciencia ficción"]
      },
      {
          id: 1233413,
          title: "Los Pecadores",
          image: "https://s.lupacine.com/image/t/p/w500/jYfMTSiFFK7ffbY2lay4zyvTkEk.jpg",
          link: "detalles.html?type=movie&id=1233413",
          year: "2025",
          genres: ["Terror", "Suspenso","Drama","Acción","Western","Música"]
      },
      {
          id: 1469239,
          title: "Karol G: Mañana fue muy bonito",
          image: "https://s3.fiestareel.com/image/t/p/w500/5aXoQYwaQ7JJVUWclHAEXJgiS2M.jpg",
          link: "detalles.html?type=movie&id=1469239",
          year: "2025",
          genres: ["Música", "Documental"]
      },
      {
          id: 1299652,
          title: "Watchmen: Capítulo 2",
          image: "https://s3.fiestareel.com/image/t/p/w500/4rBObJFpiWJOG7aIlRrOUniAkBs.jpg",
          link: "detalles.html?type=movie&id=1299652",
          year: "2024",
          genres: ["Animación", "Drama", "Acción","Ciencia ficción","Misterio"]
      },
      {
          id: 929204,
          title: "Wallace y Gromit: La venganza se sirve con plumas",
          image: "https://s3.fiestareel.com/image/t/p/w500/6BxK38ehxuX2dJmZIMpJcVNbYks.jpg",
          link: "detalles.html?type=movie&id=929204",
          year: "2024",
          genres: ["Animación","Familia", "Comedia", "Aventura"]
      },
      {
          id: 1297763,
          title: "Batman Ninja vs La Liga Yakuza",
          image: "https://s3.fiestareel.com/image/t/p/w500/sVVT6GYFErVv0Lcc9NvqCu0iOxO.jpg",
          link: "detalles.html?type=movie&id=1297763",
          year: "2025",
          genres: ["Animación","Acción"]
      },
      {
          id: 1144430,
          title: "La bala perdida 3",
          image: "https://s.lupacine.com/image/t/p/w500/qycPITRqXgPai7zj1gKffjCdSB5.jpg",
          link: "detalles.html?type=movie&id=1144430",
          year: "2025",
          genres: ["Acción", "Suspenso", "Crímen","Drama"]
      },
      {
          id: 1333100,
          title: "Attack on Titan: EL ATAQUE FINAL",
          image: "https://s.lupacine.com/image/t/p/w500/wgwldDDlTDDMrluOMkpSA8lyKjv.jpg",
          link: "detalles.html?type=movie&id=1333100",
          year: "2024",
          genres: ["Anime","Animación", "Aventura", "Acción","Drama","Fantasía"]
      },
      {
          id: 668489,
          title: "Estragos",
          image: "https://s.lupacine.com/image/t/p/w500/r46leE6PSzLR3pnVzaxx5Q30yUF.jpg",
          link: "detalles.html?type=movie&id=668489",
          year: "2025",
          genres: ["Acción", "Crímen", "Suspenso"]
      },
      {
          id: 986056,
          title: "Thunderbolts*",
          image: "https://s.lupacine.com/image/t/p/w500/m9EtP1Yrzv6v7dMaC9mRaGhd1um.jpg",
          link: "detalles.html?type=movie&id=986056",
          year: "2025",
          genres: ["Drama","Acción", "Aventura", "Ciencia ficción"]
      },
      {
          id: 1233069,
          title: "Extraterritorial",
          image: "https://s.lupacine.com/image/t/p/w500/jM2uqCZNKbiyStyzXOERpMqAbdx.jpg",
          link: "detalles.html?type=movie&id=1233069",
          year: "2025",
          genres: ["Acción", "Suspenso"]
      },
      {
          id: 950387,
          title: "Una película de Minecraft",
          image: "https://s3.fiestareel.com/image/t/p/w500/yFHHfHcUgGAxziP1C3lLt0q2T4s.jpg",
          link: "detalles.html?type=movie&id=950387",
          year: "2025",
          genres: ["Aventura", "Fantasía", "Comedia","Familia"]
      },
      {
          id: 1195506,
          title: "Novocaine",
          image: "https://s3.fiestareel.com/image/t/p/w500/xmMHGz9dVRaMY6rRAlEX4W0Wdhm.jpg",
          link: "detalles.html?type=movie&id=1195506",
          year: "2025",
          genres: ["Acción", "Suspenso", "Comedia"]
      },
      {
          id: 1244944,
          title: "La mujer de las sombras",
          image: "https://s3.fiestareel.com/image/t/p/w500/n0WS2TsNcS6dtaZKzxipyO7LuCJ.jpg",
          link: "detalles.html?type=movie&id=1244944",
          year: "2025",
          genres: ["Terror", "Suspenso", "Misterio"]
      },
      {
          id: 974573,
          title: "Otro pequeño favor",
          image: "https://s.lupacine.com/image/t/p/w500/zboCGZ4aIqPMd7VFI4HWnmc7KYJ.jpg",
          link: "detalles.html?type=movie&id=974573",
          year: "2025",
          genres: ["Comedia", "Suspenso", "Crímen"]
      },
      {
          id: 1197306,
          title: "Rescate implacable",
          image: "https://s.lupacine.com/image/t/p/w500/6FRFIogh3zFnVWn7Z6zcYnIbRcX.jpg",
          link: "detalles.html?type=movie&id=1197306",
          year: "2025",
          genres: ["Acción", "Suspenso", "Crímen"]
      },
      {
          id: 1087891,
          title: "El amateur: Operación venganza",
          image: "https://s3.fiestareel.com/image/t/p/w500/SNEoUInCa5fAgwuEBMIMBGvkkh.jpg",
          link: "detalles.html?type=movie&id=1087891",
          year: "2025",
          genres: ["Suspenso", "Acción"]
      },
      {
          id: 1254786,
          title: "Mi Lista De Deseos",
          image: "https://s.lupacine.com/image/t/p/w500/5fg98cVo7da7OIK45csdLSd4NaU.jpg",
          link: "detalles.html?type=movie&id=1254786",
          year: "2025",
          genres: ["Romance", "Comedia", "Drama"]
      },
      {
          id: 931349,
          title: "Ash",
          image: "https://s.lupacine.com/image/t/p/w500/nRa8B3tQCUK6pVwjasIyQehbvpF.jpg",
          link: "detalles.html?type=movie&id=931349",
          year: "2025",
          genres: ["Terror", "Suspenso", "Ciencia ficción"]
      },
      {
          id: 1013601,
          title: "The Alto Knights",
          image: "https://s.lupacine.com/image/t/p/w500/95KmR0xNuZZ6DNESDwLKWGIBvMg.jpg",
          link: "detalles.html?type=movie&id=1013601",
          year: "2025",
          genres: ["Crímen", "Drama", "Historia"]
      },
      {
          id: 1210938,
          title: "Revelación",
          image: "https://s3.fiestareel.com/image/t/p/w500/ak0HlRVsVzh8mvwIUZpZr0z6uqW.jpg",
          link: "detalles.html?type=movie&id=1210938",
          year: "2025",
          genres: ["Suspenso", "Crímen", "Misterio"]
      },
      {
          id: 1249213,
          title: "Drop: Amenaza anónima",
          image: "https://s3.fiestareel.com/image/t/p/w500/hSQPSW8aLjsMBfwqGjgJ6HozTkp.jpg",
          link: "detalles.html?type=movie&id=1249213",
          year: "2025",
          genres: ["Terror", "Suspenso", "Misterio"]
      },
      {
          id: 1276073,
          title: "Bullet Train Explosion",
          image: "https://s.lupacine.com/image/t/p/w500/jmzxlDBwgvRbpPJzNQwizyn9UEn.jpg",
          link: "detalles.html?type=movie&id=1276073",
          year: "2025",
          genres: ["Drama", "Suspenso", "Acción","Crímen"]
      },
      {
          id: 1418522,
          title: "Delicia",
          image: "https://s3.fiestareel.com/image/t/p/w500/o1ZIvviAEuIHcH9x6sv112mSvTR.jpg",
          link: "detalles.html?type=movie&id=1418522",
          year: "2025",
          genres: ["Drama", "Suspenso"]
      },
      {
          id: 1140535,
          title: "Presencia",
          image: "https://media.themoviedb.org/t/p/w220_and_h330_face/kc7YIx6KNiXm1dpqlhqdX3eTL7a.jpg",
          link: "detalles.html?type=movie&id=1140535",
          year: "2025",
          genres: ["Drama", "Terror"]
      },
      {
          id: 799766,
          title: "Better Man",
          image: "https://media.themoviedb.org/t/p/w220_and_h330_face/otXaS8K5coAwmUyGxBsNz9mWs8H.jpg",
          link: "detalles.html?type=movie&id=799766",
          year: "2025",
          genres: ["Música", "Drama"]
      },
      {
          id: 1124620,
          title: "El Mono",
          image: "https://s.lupacine.com/image/t/p/w500/yYa8Onk9ow7ukcnfp2QWVvjWYel.jpg",
          link: "detalles.html?type=movie&id=1124620",
          year: "2025",
          genres: ["Comedia", "Terror"]
      },
      {
          id: 1356039,
          title: "Counterstrike",
          image: "https://s.lupacine.com/image/t/p/w500/lI2uFlSEkwXKljqiry7coaJ6wIS.jpg",
          link: "detalles.html?type=movie&id=1356039",
          year: "2025",
          genres: ["Acción", "Fantasía", "Suspenso"]
      },
      {
          id: 1104845,
          title: "Plankton: La Película",
          image: "https://s.lupacine.com/image/t/p/w500/hGaUNLF5VZbg9ovPTyjm9Rv5xWz.jpg",
          link: "detalles.html?type=movie&id=1104845",
          year: "2025",
          genres: ["Animación", "Comedia", "Aventura", "Familia", "Fantasía"]
      },
      {
          id: 939243,
          title: "Sonic 3: La Película",
          image: "https://media.themoviedb.org/t/p/w220_and_h330_face/3aDWCRXLYOCuxjrjiPfLd79tcI6.jpg",
          link: "detalles.html?type=movie&id=939243",
          year: "2024"
      },
      {
          id: 1241982,
          title: "Moana 2",
          image: "https://media.themoviedb.org/t/p/w220_and_h330_face/b1WsCRfomw7tRi12NuseKsAJxYK.jpg",
          link: "detalles.html?type=movie&id=1241982",
          year: "2024"
      },
      {
          id: 762509,
          title: "Mufasa El Rey León",
          image: "https://media.themoviedb.org/t/p/w220_and_h330_face/dmw74cWIEKaEgl5Dv3kUTcCob6D.jpg",
          link: "detalles.html?type=movie&id=762509",
          year: "2024"
      },
      {
          id: 1064213,
          title: "Anora",
          image: "https://media.themoviedb.org/t/p/w220_and_h330_face/n5wEFSLkm2fCtN0FVAuphrCAjf8.jpg",
          link: "detalles.html?type=movie&id=1064213",
          year: "2024"
      },
      {
          id: 823219,
          title: "Flow",
          image: "https://media.themoviedb.org/t/p/w220_and_h330_face/337MqZW7xii2evUDVeaWXAtopff.jpg",
          link: "detalles.html?type=movie&id=823219",
          year: "2024"
      },
      {
          id: 1126166,
          title: "Amenaza En El Aire",
          image: "https://media.themoviedb.org/t/p/w220_and_h330_face/8T6nkYb4W8BIeafmFffyfsRciTL.jpg",
          link: "detalles.html?type=movie&id=1126166",
          year: "2025"
      },
      {
          id: 1084199,
          title: "Compañera Perfecta",
          image: "https://media.themoviedb.org/t/p/w220_and_h330_face/nyloao2GWttUvS7KVcEM2eSDwUn.jpg",
          link: "detalles.html?type=movie&id=1084199",
          year: "2025"
      },
      {
          id: 822119,
          title: "Capitán América: Un Nuevo Mundo",
          image: "https://media.themoviedb.org/t/p/w220_and_h330_face/xVwP4GCbEfO66JSSyonnAhU3Fad.jpg",
          link: "detalles.html?type=movie&id=822119",
          year: "2025",
          genres: ["Acción", "Ciencia ficción", "Suspenso"]
      },
      {
          id: 950396,
          title: "El Abismo Secreto",
          image: "https://media.themoviedb.org/t/p/w220_and_h330_face/3s0jkMh0YUhIeIeioH3kt2X4st4.jpg",
          link: "detalles.html?type=movie&id=950396",
          year: "2025",
          genres: ["Romance", "Ciencia ficción","Suspenso"]
      },
      {
          id: 1405338,
          title: "Oni-Goroshi: Ciudad de los demonios",
          image: "https://s3.fiestareel.com/image/t/p/w500/g5PqsFFrayyRL1Ldgib2lMYuJXg.jpg",
          link: "detalles.html?type=movie&id=1405338",
          year: "2025",
          genres: ["Acción", "Crímen", "Fantasía", "Suspenso"]
      },
      {
          id: 1352774,
          title: "Piglet",
          image: "https://s.lupacine.com/image/t/p/w500/5wZNFUJAwyX6RCxdqrLO9lLWJ20.jpg",
          link: "detalles.html?type=movie&id=1352774",
          year: "2025",
          genres: ["Terror"]
      },
      {
          id: 1035048,
          title: "Criaturas: Línea de extinción",
          image: "https://s.lupacine.com/image/t/p/w500/tnfc0NJ3BzhJrGJhkkEd6MHBdq5.jpg",
          link: "detalles.html?type=movie&id=1035048",
          year: "2024",
          genres: ["Acción", "Suspenso", "Ciencia ficción"]
      },
      {
          id: 1201012,
          title: "Dhoom Dhaam",
          image: "https://s.lupacine.com/image/t/p/w500/2E7me3rPi8HqaeheuD86YlpNX6k.jpg",
          link: "detalles.html?type=movie&id=1201012",
          year: "2025",
          genres: ["Acción", "Comedia", "Romance"]
      },
      {
          id: 558449,
          title: "Gladiador II",
          image: "https://s3.fiestareel.com/image/t/p/w500/2cxhvwyEwRlysAmRH4iodkvo0z5.jpg",
          link: "detalles.html?type=movie&id=558449",
          year: "2024",
          genres: ["Aventura", "Drama", "Acción", "Historia"]
      },
      {
          id: 1138749,
          title: "The Island",
          image: "https://s3.fiestareel.com/image/t/p/w500/ajb1rMiorchfRemYHZCkbV9DBg6.jpg",
          link: "detalles.html?type=movie&id=1138749",
          year: "2023",
          genres: ["Acción", "Suspenso", "Crímen"]
      },
      {
          id: 1247019,
          title: "Thi Yot 2: Susurros Mortales",
          image: "https://s.lupacine.com/image/t/p/w500/uDW5eeFUYp1vaU2ymEdVBG6g7iq.jpg",
          link: "detalles.html?type=movie&id=1247019",
          year: "2024",
          genres: ["Terror", "Acción", "Suspenso"]
      },
      {
          id: 912649,
          title: "Venom: El último baile",
          image: "https://s3.fiestareel.com/image/t/p/w500/vGXptEdgZIhPg3cGlc7e8sNPC2e.jpg",
          link: "detalles.html?type=movie&id=912649",
          year: "2024",
          genres: ["Acción", "Ciencia ficción", "Suspenso"]
      },
      {
          id: 516729,
          title: "Paddington: Aventura en la selva",
          image: "https://s.lupacine.com/image/t/p/w500/1ffZAucqfvQu36x1C49XfOdjuOG.jpg",
          link: "detalles.html?type=movie&id=516729",
          year: "2024",
          genres: ["Aventura", "Comedia", "Familia"]
      },
      {
          id: 774370,
          title: "Las aventuras de Dog Man",
          image: "https://s3.fiestareel.com/image/t/p/w500/89wNiexZdvLQ41OQWIsQy4O6jAQ.jpg",
          link: "detalles.html?type=movie&id=774370",
          year: "2025",
          genres: ["Animación", "Aventura", "Familia", "Comedia", "Acción"]
      },
      {
          id: 539972,
          title: "Kraven el cazador",
          image: "https://s.lupacine.com/image/t/p/w500/1GvBhRxY6MELDfxFrete6BNhBB5.jpg",
          link: "detalles.html?type=movie&id=539972",
          year: "2024",
          genres: ["Acción", "Ciencia ficción", "Aventura", "Suspenso"]
      },
      {
          id: 710295,
          title: "Hombre Lobo",
          image: "https://s.lupacine.com/image/t/p/w500/vtdEHG1j07PqLlVyhKNZRHTPKGt.jpg",
          link: "detalles.html?type=movie&id=710295",
          year: "2025",
          genres: ["Terror", "Suspenso"]
      },
      {
          id: 1357633,
          title: "Solo Leveling: Segundo Despertar",
          image: "https://s3.fiestareel.com/image/t/p/w500/dblIFen0bNZAq8icJXHwrjfymDW.jpg",
          link: "detalles.html?type=movie&id=1357633",
          year: "2024",
          genres: ["Anime", "Fantasía", "Aventura"]
      },
      {
          id: 696506,
          title: "Mickey 17",
          image: "https://s.lupacine.com/image/t/p/w500/edKpE9B5qN3e559OuMCLZdW1iBZ.jpg",
          link: "detalles.html?type=movie&id=696506",
          year: "2025",
          genres: ["Ciencia ficción", "Aventura", "Comedia"]
      },
      {
          id: 426063,
          title: "Nosferatu",
          image: "https://media.themoviedb.org/t/p/w220_and_h330_face/jivUhECegXI3OYtPVflWoIDtENt.jpg",
          link: "detalles.html?type=movie&id=426063",
          year: "2024",
          genres: ["Terror"]
      },
      {
          id: 777443,
          title: "Estado Eléctrico",
          image: "https://media.themoviedb.org/t/p/w220_and_h330_face/nCuSMDWhWGJAPdp9rSDIogG5X82.jpg",
          link: "detalles.html?type=movie&id=777443",
          year: "2025",
          genres: ["Ciencia ficción", "Aventura", "Drama"]
      },
];

// Películas de acción (vacío)
const accionMovies = [
    {
        id: 822119, // ID de TMDb para "Fight Club"
        title: "Capitán América: Un Nuevo Mundo",
        image: "https://media.themoviedb.org/t/p/w220_and_h330_face/xVwP4GCbEfO66JSSyonnAhU3Fad.jpg",
        link: "detalles.html?type=movie&id=822119", // Usamos el ID de TMDb
        year: "2025"
    },
    {
        id: 1126166, // ID de TMDb para "Fight Club"
        title: "Amenaza En El Aire",
        image: "https://media.themoviedb.org/t/p/w220_and_h330_face/8T6nkYb4W8BIeafmFffyfsRciTL.jpg",
        link: "detalles.html?type=movie&id=1126166", // Usamos el ID de TMDb
        year: "2025"
    },
    {
        id: 950396, // ID de TMDb para "Fight Club"
        title: "El Abismo Secreto",
        image: "https://media.themoviedb.org/t/p/w220_and_h330_face/3s0jkMh0YUhIeIeioH3kt2X4st4.jpg",
        link: "detalles.html?type=movie&id=950396", // Usamos el ID de TMDb
        year: "2025"
    },
   
];

// Películas de drama (vacío)
const dramaMovies = [
    {
        id: 974576, // ID de TMDb para "Fight Club"
        title: "Cónclave",
        image: "https://media.themoviedb.org/t/p/w220_and_h330_face/jkOgeASTlWwyKLBNblHVwWmAKhD.jpg",
        link: "detalles.html?type=movie&id=974576", // Usamos el ID de TMDb
        year: "2025"
    },
    {
        id: 933260, // ID de TMDb para "Fight Club"
        title: "The substance",
        image: "https://media.themoviedb.org/t/p/w220_and_h330_face/w1PiIqM89r4AM7CiMEP4VLCEFUn.jpg",
        link: "detalles.html?type=movie&id=933260", // Usamos el ID de TMDb
        year: "2024"
    },
    {
        id: 1272149, // ID de TMDb para "Fight Club"
        title: "Bridget Jones: Loca Por Él",
        image: "https://media.themoviedb.org/t/p/w220_and_h330_face/9K4xBef7N7YZTnke23FiNTHBGNU.jpg",
        link: "detalles.html?type=movie&id=1272149", // Usamos el ID de TMDb
        year: "2025"
    },
    {
        id: 1294203, // ID de TMDb para "Fight Club"
        title: "Culpa Mía: Londres",
        image: "https://media.themoviedb.org/t/p/w220_and_h330_face/q0HxfkF9eoa6wSVnzwMhuDSK7ba.jpg",
        link: "detalles.html?type=movie&id=1294203", // Usamos el ID de TMDb
        year: "2025"
    },
];
// Al final del archivo:
const userTracking = {
    viewedMovies: [],
    likedMovies: [],
    viewedDetails: [],
    watchedGenres: {},
    likedGenres: {},
    favoriteActors: {},
    favoriteDirectors: {},
    watchTime: {},
    lastWatched: [],
    preferencesUpdatedAt: null
};

// Asegurar que todas las películas tengan los campos necesarios
manualMovies.forEach(movie => {
    movie.directors = movie.directors || ["Director Desconocido"];
    movie.cast = movie.cast || ["Actor Desconocido"];
    movie.mood = movie.mood || "neutral";
});

accionMovies.forEach(movie => {
    movie.directors = movie.directors || ["Director Desconocido"];
    movie.cast = movie.cast || ["Actor Desconocido"];
    movie.mood = movie.mood || "intense";
});

dramaMovies.forEach(movie => {
    movie.directors = movie.directors || ["Director Desconocido"];
    movie.cast = movie.cast || ["Actor Desconocido"];
    movie.mood = movie.mood || "serious";
});

export { hiddenMovies, manualMovies, accionMovies, dramaMovies };